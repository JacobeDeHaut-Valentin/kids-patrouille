import { store } from './state.js';
import { BESTIARY, RARITY_LABEL } from './data.js';
import { escapeHtml } from './helpers.js';

export function renderGallery() {
  document.getElementById('gallery-counter').textContent =
    `${store.state.monsters.length} / ${BESTIARY.length} monstres`;

  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = '';

  BESTIARY.forEach(monster => {
    const owned = store.state.monsters.includes(monster.id);

    const card = document.createElement('div');
    card.className = 'monster-card' + (owned ? '' : ' locked');

    card.innerHTML = `
      <div class="monster-emoji">${owned ? monster.emoji : '❓'}</div>
      <div class="monster-name">${owned ? escapeHtml(monster.name) : '???'}</div>
      <span class="monster-rarity rarity-${monster.rarity}">
        ${RARITY_LABEL[monster.rarity]}
      </span>
    `;

    grid.appendChild(card);
  });
}