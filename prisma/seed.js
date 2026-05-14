import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { resolveDatabaseUrl } from '../server/database-url.js';

const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

const sizeCharts = {
  oneSize: [
    { size: 'One size' },
  ],
  tops: [
    { size: 'XS', chestCm: [76, 84], waistCm: [58, 66], hipsCm: [82, 90] },
    { size: 'S', chestCm: [84, 90], waistCm: [66, 72], hipsCm: [90, 96] },
    { size: 'M', chestCm: [90, 96], waistCm: [72, 78], hipsCm: [96, 102] },
    { size: 'L', chestCm: [96, 104], waistCm: [78, 88], hipsCm: [102, 110] },
    { size: 'XL', chestCm: [104, 114], waistCm: [88, 98], hipsCm: [110, 120] },
  ],
  bottoms: [
    { size: 'XS', waistCm: [58, 66], hipsCm: [82, 90] },
    { size: 'S', waistCm: [66, 72], hipsCm: [90, 96] },
    { size: 'M', waistCm: [72, 78], hipsCm: [96, 102] },
    { size: 'L', waistCm: [78, 88], hipsCm: [102, 110] },
    { size: 'XL', waistCm: [88, 98], hipsCm: [110, 120] },
  ],
  jeans: [
    { size: 'XS', waistCm: [58, 66], hipsCm: [82, 90] },
    { size: 'S', waistCm: [66, 72], hipsCm: [90, 96] },
    { size: 'M', waistCm: [72, 80], hipsCm: [96, 104] },
    { size: 'L', waistCm: [80, 90], hipsCm: [104, 114] },
    { size: 'XL', waistCm: [90, 102], hipsCm: [114, 124] },
  ],
};

const products = [
  {
    slug: 'hat',
    name: 'Amanita Halo Hat',
    description: 'Декоративная шляпа в форме шляпки мухомора с объёмными светлыми пятнами. Плотная текстильная основа и шерстяной фетр помогают аксессуару держать форму и выглядеть как арт-объект, а не костюмная бутафория.',
    type: 'accessory',
    category: 'головной убор',
    price: 4900,
    imageUrl: '/images/products/hat-001/hat-001-thumbnail.webp',
    modelUrl: '/models/hat.glb',
    gallery: [
      '/images/products/hat-001/hat-001-thumbnail.webp',
      '/images/products/hat-001/hat-001-top.webp',
      '/images/products/hat-001/hat-001-bottom.webp',
    ],
    sizes: ['OS'],
    sizeChart: sizeCharts.oneSize,
    composition: 'Shell: 100% cotton canvas\nStructure: lightweight millinery felt\nTrim: wool felt applique',
    care: 'Не стирать. Очищать сухой мягкой щёткой или слегка влажной тканью. Хранить отдельно, не сдавливать.',
  },
  {
    slug: 'dress',
    name: 'Forest Nymph Dress',
    description: 'Длинное оливковое платье с корсетной верхней частью, плетёными бретелями, шнуром на талии и кружевной отделкой по подолу. Хлопковый вельвет даёт плотную натуральную фактуру, а вискозная подкладка делает посадку мягче и комфортнее.',
    type: 'dress',
    category: 'платье',
    price: 12900,
    imageUrl: '/images/products/dress-001/dress-001-front-clean.webp',
    modelUrl: '/models/dress.glb',
    gallery: [
      '/images/products/dress-001/dress-001-front-clean.webp',
      '/images/products/dress-001/dress-001-mannequin-front.webp',
      '/images/products/dress-001/dress-001-side-left.webp',
      '/images/products/dress-001/dress-001-back.webp',
      '/images/products/dress-001/dress-001-character-sitting.webp',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    sizeChart: sizeCharts.tops,
    composition: 'Main: 100% cotton corduroy\nLining: 100% viscose\nTrim: cotton lace, cotton rope',
    care: 'Деликатная ручная стирка или химчистка. Сушить в расправленном виде. Гладить с изнанки на низкой температуре.',
  },
  {
    slug: 'cardigan',
    name: 'Mosswood Cardigan',
    description: 'Объёмный кардиган оттенка moss green с V-образным вырезом, крупными пуговицами и накладными карманами. Мягкая смесовая пряжа с шерстью и альпакой делает его тёплым, фактурным и визуально более “живым”, без ощущения обычного синтетического трикотажа.',
    type: 'knitwear',
    category: 'кардиган',
    price: 14900,
    imageUrl: '/images/products/cardigan-001/cardigan-001-thumbnail.webp',
    modelUrl: '/models/cardigan.glb',
    gallery: [
      '/images/products/cardigan-001/cardigan-001-thumbnail.webp',
      '/images/products/cardigan-001/cardigan-001-mannequin-front.webp',
      '/images/products/cardigan-001/cardigan-001-character-tpose.webp',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    sizeChart: sizeCharts.tops,
    composition: '45% merino wool, 25% alpaca, 20% organic cotton, 10% recycled nylon',
    care: 'Ручная стирка в холодной воде. Не выкручивать. Сушить горизонтально. Хранить в сложенном виде.',
  },
  {
    slug: 'jeans',
    name: 'Thornfield Cargo Pants',
    description: 'Широкие коричневые карго с вышивкой зелёных ветвей, объёмными карманами и декоративными рельефными вставками. Хлопковый твил с лиоцеллом держит форму, но остаётся мягким и пластичным — вещь выглядит плотной, добротной и не плоской.',
    type: 'bottom',
    category: 'брюки карго',
    price: 11900,
    imageUrl: '/images/products/jeans/jeans-001-thumbnail.webp',
    modelUrl: '/models/jeans.glb',
    gallery: [
      '/images/products/jeans/jeans-001-thumbnail.webp',
      '/images/products/jeans/jeans-001-side.webp',
      '/images/products/jeans/jeans-001-side-right.webp',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeChart: sizeCharts.jeans,
    composition: '70% organic cotton, 25% lyocell, 5% elastane\nEmbroidery: viscose thread',
    care: 'Стирать наизнанку при 30°C на деликатном режиме. Не отбеливать. Не сушить в машине. Гладить с изнанки.',
  },
  {
    slug: 'shirt',
    name: 'Linden Wing Shirt',
    description: 'Светло-зелёная укороченная рубашка с широкими рукавами-крыльями и мягким отложным воротником. Смесь льна и органического хлопка дышит, красиво держит форму и со временем становится только приятнее к телу.',
    type: 'top',
    category: 'укороченная рубашка',
    price: 8900,
    imageUrl: '/images/products/shirt-001/shirt-001-thumbnail.webp',
    modelUrl: '/models/shirt-top.glb',
    gallery: [
      '/images/products/shirt-001/shirt-001-thumbnail.webp',
      '/images/products/shirt-001/shirt-001-character-front.webp',
      '/images/products/shirt-001/shirt-001-side-right.webp',
      '/images/products/shirt-001/shirt-001-character-tpose.webp',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    sizeChart: sizeCharts.tops,
    composition: '60% linen, 40% organic cotton',
    care: 'Деликатная стирка до 30°C. Сушить в расправленном виде. Гладить на средней температуре. Возможна естественная мятость ткани.',
  },
  {
    slug: 'skirt',
    name: 'Fern Plaid Skirt',
    description: 'Многоярусная юбка в приглушённую клетку с завязкой на талии и объёмными накладными карманами. Хлопок даёт плотность, а вискоза — мягкую драпировку, поэтому юбка держит объём, но не выглядит жёсткой.',
    type: 'bottom',
    category: 'юбка миди',
    price: 9900,
    imageUrl: '/images/products/skirt-001/skirt-001-front.webp',
    modelUrl: '/models/skirt-bottom.glb',
    gallery: [
      '/images/products/skirt-001/skirt-001-front.webp',
      '/images/products/skirt-001/skirt-001-character-front.webp',
      '/images/products/skirt-001/skirt-001-side-right.webp',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    sizeChart: sizeCharts.bottoms,
    composition: '65% organic cotton, 35% viscose',
    care: 'Стирать наизнанку при 30°C. Не отбеливать. Сушить естественным способом. Гладить на низкой или средней температуре.',
  },
  {
    slug: 'sweater',
    name: 'Elder Rune Sweater',
    description: 'Свободный оливковый свитер с жаккардовым орнаментом, объёмными рукавами и мягкой посадкой. Шерсть, меринос и альпака дают тепло, объём и благородную фактуру, а recycled nylon помогает изделию лучше держать форму.',
    type: 'knitwear',
    category: 'свитер',
    price: 13900,
    imageUrl: '/images/products/sweater-001/sweater-001-front.webp',
    modelUrl: '/models/sweater-top.glb',
    gallery: [
      '/images/products/sweater-001/sweater-001-front.webp',
      '/images/products/sweater-001/sweater-001-mannequin-front.webp',
      '/images/products/sweater-001/sweater-001-detail-pattern-front.webp',
      '/images/products/sweater-001/sweater-001-sleeve-detail.webp',
      '/images/products/sweater-001/sweater-001-character-tpose.webp',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    sizeChart: sizeCharts.tops,
    composition: '40% merino wool, 30% alpaca, 20% organic cotton, 10% recycled nylon',
    care: 'Ручная стирка или режим для шерсти до 30°C. Не выкручивать. Сушить горизонтально. Не использовать машинную сушку.',
  },
  {
    slug: 'top',
    name: 'Ivy Vein Top',
    description: 'Укороченный зелёный топ с контрастными рельефными линиями, напоминающими прожилки листа. Плотный трикотаж на основе TENCEL™ Modal мягко прилегает к телу, красиво тянется и ощущается гораздо приятнее обычной синтетики.',
    type: 'top',
    category: 'топ',
    price: 7900,
    imageUrl: '/images/products/top/top-001-thumbnail.webp',
    modelUrl: '/models/top-upper.glb',
    gallery: [
      '/images/products/top/top-001-thumbnail.webp',
      '/images/products/top/top-001-character-mainpose.webp',
      '/images/products/top/top-001-charaster-tpose.webp',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    sizeChart: sizeCharts.tops,
    composition: '88% TENCEL™ Modal, 12% ROICA™ elastane\nTrim: plant-based PU coating',
    care: 'Ручная стирка в холодной воде. Не отбеливать. Не сушить в машине. Сушить горизонтально. Не гладить по декоративным линиям.',
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
