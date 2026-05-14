import { APP_CONFIG } from './config.js';
import { initCursor } from './features/cursor.js';
import { initAccountUi } from './features/account-ui.js';
import { initAppSplash } from './features/app-splash.js';
import { initBrandStory } from './features/brand-story.js';
import { initCatalog3DHover } from './features/catalog-3d-hover.js';
import { initCatalog } from './features/catalog.js';
import { initCartDrawer } from './features/cart-drawer.js';
import { initCheckout } from './features/checkout.js';
import { initFitFinder } from './features/fit-finder.js';
import { initFx } from './features/fx.js';
import { initHeroVideo } from './features/hero-video.js';
import { initLatestDropsShowcase } from './features/latest-drops-showcase.js';
import { initNewsletter } from './features/newsletter.js';
import { applyPerformanceMode, getPerformanceMode } from './features/performance-mode.js';
import { initDynamicHeader } from './features/dynamic-header.js';
import { initProductModal } from './features/product-modal.js';
import { initSectionKickers } from './features/section-kickers.js';
import { initMeasurementsStore } from './state/measurements.store.js';
import { initCartStore } from './state/cart.store.js';
import { initAuthStore } from './state/auth.store.js';
import { initProfileStore } from './state/profile.store.js';

export async function initApp() {
  const mode = getPerformanceMode();
  applyPerformanceMode(mode);

  initHeroVideo({ breakpoint: APP_CONFIG.breakpoint });
  initProfileStore();
  await initAuthStore();
  initMeasurementsStore();
  initCartStore();
  initAppSplash();
  initAccountUi();
  initBrandStory();
  initFitFinder();
  initLatestDropsShowcase();
  initCatalog();
  initNewsletter();
  initProductModal();
  initCartDrawer();
  initCheckout();
  initCatalog3DHover();
  initDynamicHeader();
  initSectionKickers();

  if (!mode.lowPower) {
    initCursor();
  }

  initFx({ lowPower: mode.lowPower });

  import('../3d/initModelViewers.js')
    .then(({ initModelViewers }) => initModelViewers())
    .catch(error => {
      console.warn('[3D] Could not load model viewers module.', error);
    });
}
