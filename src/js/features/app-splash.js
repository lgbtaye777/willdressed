let splashRoot = null;
let primaryAction = null;

function renderMeta(metaRoot, meta = []) {
  if (!metaRoot) return;

  metaRoot.replaceChildren();
  metaRoot.hidden = !meta.length;

  meta.forEach(item => {
    const row = document.createElement('div');
    row.className = 'app-splash__meta-row';

    const label = document.createElement('span');
    label.textContent = item.label;

    const value = document.createElement('strong');
    value.textContent = item.value;

    row.append(label, value);
    metaRoot.appendChild(row);
  });
}

export function closeAppSplash() {
  if (!splashRoot) return;

  splashRoot.hidden = true;
  document.body.classList.remove('is-app-splash-open');
  primaryAction = null;
}

export function showAppSplash({
  type = 'success',
  kicker = 'Готово',
  title = 'Готово',
  message = '',
  meta = [],
  primaryText = 'ОК',
  onPrimary = null,
} = {}) {
  if (!splashRoot) return;

  const kickerEl = splashRoot.querySelector('[data-app-splash-kicker]');
  const titleEl = splashRoot.querySelector('[data-app-splash-title]');
  const messageEl = splashRoot.querySelector('[data-app-splash-message]');
  const metaRoot = splashRoot.querySelector('[data-app-splash-meta]');
  const primary = splashRoot.querySelector('[data-app-splash-primary]');

  splashRoot.dataset.type = type;
  if (kickerEl) kickerEl.textContent = kicker;
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (primary) primary.textContent = primaryText;
  primaryAction = onPrimary;
  renderMeta(metaRoot, meta);

  splashRoot.hidden = false;
  document.body.classList.add('is-app-splash-open');
  window.requestAnimationFrame(() => {
    primary?.focus({ preventScroll: true });
  });
}

export function initAppSplash(root = document) {
  splashRoot = root.querySelector('[data-app-splash]');
  if (!splashRoot) return;

  splashRoot.querySelectorAll('[data-app-splash-close]').forEach(button => {
    button.addEventListener('click', closeAppSplash);
  });

  splashRoot.querySelector('[data-app-splash-primary]')?.addEventListener('click', () => {
    if (typeof primaryAction === 'function') {
      primaryAction();
      return;
    }

    closeAppSplash();
  });

  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !splashRoot.hidden) {
      closeAppSplash();
    }
  });
}
