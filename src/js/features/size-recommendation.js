const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const measurementFields = ['chestCm', 'waistCm', 'hipsCm'];
const bottomTypes = new Set(['bottom', 'bottoms', 'jeans', 'skirt', 'skirts', 'pants', 'trousers']);
const topTypes = new Set(['top', 'tops', 'shirt', 'shirts', 'cardigan', 'sweater', 'dress', 'dresses']);

function getChart(product) {
  if (Array.isArray(product?.sizeChart)) return product.sizeChart;
  if (Array.isArray(product?.sizeChart?.sizes)) return product.sizeChart.sizes;
  return [];
}

function getSizes(product) {
  return Array.isArray(product?.sizes) ? product.sizes : [];
}

function isOneSize(product) {
  const sizes = getSizes(product).map(size => String(size).toLowerCase());
  const chart = getChart(product);

  return sizes.some(size => size === 'os' || size === 'one size')
    || chart.some(row => {
      const size = String(row?.size || '').toLowerCase();
      return size === 'os' || size === 'one size';
    });
}

function distanceFromRange(value, range) {
  if (!Array.isArray(range) || range.length < 2 || !Number.isFinite(Number(value))) {
    return null;
  }

  const min = Number(range[0]);
  const max = Number(range[1]);
  const number = Number(value);

  if (number >= min && number <= max) return 0;
  return number < min ? min - number : number - max;
}

function getSizeIndex(size) {
  const index = sizeOrder.indexOf(String(size).toUpperCase());
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getRelevantFields(product) {
  const type = String(product?.type || '').toLowerCase();
  const category = String(product?.category || '').toLowerCase();
  const slug = String(product?.slug || '').toLowerCase();
  const tokens = [type, category, slug];

  if (tokens.some(token => bottomTypes.has(token))) {
    return ['waistCm', 'hipsCm'];
  }

  if (tokens.some(token => topTypes.has(token))) {
    return measurementFields;
  }

  return measurementFields;
}

function adjustForPreferredFit(size, chart, preferredFit) {
  const index = chart.findIndex(row => row.size === size);
  if (index === -1) return size;

  if (preferredFit === 'slim' && index > 0) {
    return chart[index - 1].size;
  }

  if (preferredFit === 'oversized' && index < chart.length - 1) {
    return chart[index + 1].size;
  }

  return size;
}

export function recommendSize(product, measurements = {}) {
  if (!product) return null;
  if (isOneSize(product)) return 'One size';

  const chart = getChart(product)
    .filter(row => row?.size)
    .sort((a, b) => getSizeIndex(a.size) - getSizeIndex(b.size));

  if (!chart.length) {
    return getSizes(product)[0] || null;
  }

  const fields = getRelevantFields(product);
  const scored = chart.map(row => {
    const distances = fields
      .map(field => distanceFromRange(measurements[field], row[field]))
      .filter(distance => distance != null);

    if (!distances.length) {
      return { size: row.size, score: Number.MAX_SAFE_INTEGER };
    }

    return {
      size: row.size,
      score: distances.reduce((sum, distance) => sum + distance, 0),
    };
  });

  const best = scored.sort((a, b) => a.score - b.score || getSizeIndex(a.size) - getSizeIndex(b.size))[0];
  if (!best || best.score === Number.MAX_SAFE_INTEGER) return null;

  return adjustForPreferredFit(best.size, chart, measurements.preferredFit);
}

export function getRecommendationLabel(product, measurements) {
  const size = recommendSize(product, measurements);

  if (!size) {
    return 'Укажи параметры в Fit Finder';
  }

  return `Рекомендуемый размер: ${size}`;
}
