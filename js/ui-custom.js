import { store, saveState } from './state.js';
import { SOUND_PACKS, THEMES } from './data.js';
import { showScreen, vibrate } from './helpers.js';
import { applyTheme } from './theme.js';
import { soundClick, soundValid } from './audio.js';

export function openCustomScreen() {
  renderCustomScreen();
  showScreen('screen-custom');
}

export function renderCustomScreen() {
  const container = document.getElementById('custom-content');

  const currentTheme = store.state.settings.theme;
  const currentPack = store.state.settings.soundPack;

  let html = `
    <div class="custom-section">
      <h3>🎨 Choisis ton univers</h3>
      <div class="theme-grid">
  `;

  THEMES.forEach(theme => {
    const selected = theme.id === currentTheme ? ' selected' : '';
    const background = `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`;

    html += `
      <div class="theme-card${selected}" data-theme="${theme.id}" style="background:${background}">
        ${selected ? '<span class="check">✅</span>' : ''}
        <div class="tc-emoji">${theme.emoji}</div>
        <div>${theme.name}</div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
    <div class="custom-section">
      <h3>🔊 Choisis tes sons</h3>
      <div class="sound-list">
  `;

  SOUND_PACKS.forEach(pack => {
    const selected = pack.id === currentPack ? ' selected' : '';

    html += `
      <div class="sound-card${selected}" data-pack="${pack.id}">
        <div class="sc-emoji">${pack.emoji}</div>
        <div class="sc-name">${pack.name}</div>
        <button class="sc-play" data-play="${pack.id}">🔈 Écouter</button>
        ${selected ? '<span style="color:#00b894;font-size:22px;margin-left:6px">✅</span>' : ''}
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('[data-theme]').forEach(element => {
    element.addEventListener('click', () => {
      applyTheme(element.dataset.theme);
      saveState();
      soundClick();
      vibrate(20);
      renderCustomScreen();
    });
  });

  container.querySelectorAll('[data-pack]').forEach(element => {
    element.addEventListener('click', event => {
      if (event.target.dataset.play) return;

      store.state.settings.soundPack = element.dataset.pack;
      saveState();

      soundClick();
      vibrate(20);
      renderCustomScreen();
    });
  });

  container.querySelectorAll('[data-play]').forEach(element => {
    element.addEventListener('click', event => {
      event.stopPropagation();

      const previousPack = store.state.settings.soundPack;
      store.state.settings.soundPack = element.dataset.play;

      soundClick();
      setTimeout(() => soundValid(), 200);

      setTimeout(() => {
        store.state.settings.soundPack = previousPack;
      }, 1500);
    });
  });
}