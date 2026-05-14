function getLabelSection(label) {
  return label.closest('section, [data-section]');
}

export function initSectionKickers(root = document) {
  const labels = [...root.querySelectorAll('.section-label')];
  if (!labels.length) return;

  const labelsBySection = new Map();

  labels.forEach(label => {
    const section = getLabelSection(label);
    if (!section) return;

    const sectionLabels = labelsBySection.get(section) || [];
    sectionLabels.push(label);
    labelsBySection.set(section, sectionLabels);
  });

  if (!labelsBySection.size) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const sectionLabels = labelsBySection.get(entry.target);
      if (!sectionLabels) return;

      sectionLabels.forEach(label => {
        label.classList.toggle('is-active', entry.isIntersecting);
      });
    });
  }, {
    root: null,
    rootMargin: '-25% 0px -45% 0px',
    threshold: 0,
  });

  labelsBySection.forEach((_, section) => observer.observe(section));
}
