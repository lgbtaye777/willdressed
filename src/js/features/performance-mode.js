export function getPerformanceMode() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const lowCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

  return {
    reducedMotion,
    coarsePointer,
    mobile,
    lowCpu,
    lowPower: reducedMotion || coarsePointer || mobile || lowCpu,
  };
}

export function applyPerformanceMode(mode) {
  document.documentElement.classList.toggle('is-low-power', mode.lowPower);
  document.documentElement.classList.toggle('is-mobile', mode.mobile);
  document.documentElement.classList.toggle('is-reduced-motion', mode.reducedMotion);
}
