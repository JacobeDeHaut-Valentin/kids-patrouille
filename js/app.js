import {
  store,
  loadState,
  saveState,
  checkDailyReset
} from './state.js';

import {
  applyNightMode,
  applyTheme,
  startNightWatcher,
  toggleNightMode
} from './theme.js';

import { renderHome } from './ui-home.js';
import { renderGallery } from './ui-gallery.js';

import {
  setupCustomButton,
  setupLockButton
} from './ui-parent.js';

import {
  acquireWakeLock,
  adjustTimer,
  exitTimer,
  failTask,
  hasWakeLock,
  isTimerRunning,
  releaseWakeLock,
  startTimer,
  succeedTask
} from './timer.js';

import { showScreen, vibrate } from './helpers.js';
import { soundClick } from './audio.js';
import { showModal } from './modal.js';

function askNameIfNeeded() {
  if (store.state.childName) return;

  showModal({
    title: '👋 Bienvenue dans Kids Patrouille !',
    message: "Comment t'appelles-tu, jeune aventurier ?",
    inputType: 'text',
    defaultValue: '',
    okText: "C'est parti ! 🚀",
    cancelText: 'Plus tard',
    onValidate(value) {
      const name = (value || '').trim().slice(0, 20);

      if (!name) return 'Donne ton prénom 😊';

      store.state.childName = name;

      saveState();
      renderHome();

      return true;
    }
  });
}

function setupPWA() {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }
  } catch (e) {}
}

function bindGlobalEvents() {
  document.getElementById('btn-gallery').addEventListener('click', () => {
    soundClick();
    vibrate(20);
    renderGallery();
    showScreen('screen-gallery');
  });

  document.getElementById('btn-night').addEventListener('click', () => {
    soundClick();
    vibrate(15);
    toggleNightMode();
  });

  document.getElementById('gallery-back').addEventListener('click', () => {
    soundClick();
    showScreen('screen-home');
  });

  document.getElementById('custom-back').addEventListener('click', () => {
    soundClick();
    showScreen('screen-home');
    renderHome();
  });

  document.getElementById('parent-back').addEventListener('click', () => {
    soundClick();
    showScreen('screen-home');
    renderHome();
  });

  document.getElementById('timer-back').addEventListener('click', () => {
    soundClick();
    exitTimer();
  });

  document.getElementById('timer-minus').addEventListener('click', () => {
    adjustTimer(-1);
  });

  document.getElementById('timer-plus').addEventListener('click', () => {
    adjustTimer(1);
  });

  document.getElementById('timer-go').addEventListener('click', startTimer);
  document.getElementById('timer-success').addEventListener('click', succeedTask);
  document.getElementById('timer-fail').addEventListener('click', failTask);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkDailyReset();
      applyNightMode();

      if (document.getElementById('screen-home').classList.contains('active')) {
        renderHome();
      }

      if (isTimerRunning() && !hasWakeLock()) {
        acquireWakeLock();
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    releaseWakeLock();
  });
}

function init() {
  store.state = loadState();

  checkDailyReset();
  applyTheme(store.state.settings.theme);

  setupPWA();
  bindGlobalEvents();
  setupLockButton();
  setupCustomButton();

  applyNightMode();
  startNightWatcher();

  renderHome();
  askNameIfNeeded();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}