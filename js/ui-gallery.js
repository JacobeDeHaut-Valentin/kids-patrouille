import { activeChild } from './state.js';
import { BESTIARY, RARITY_LABEL } from './data.js';
import { escapeHtml, vibrate } from './helpers.js';
import { soundClick } from './audio.js';
import { showMonsterReveal } from './rewards.js';

export function renderGallery() {
  const child = activeChild();
  if (!child) return;

  document.getElementById('gallery-counter').textContent =
    `${child.monsters.length} / ${BESTIARY.length} monstres`;

  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = '';

  BESTIARY.forEach(monster => {
    const owned = child.monsters.includes(monster.id);

    const card = document.createElement('div');
    card.className = 'monster-card' + (owned ? '' : ' locked');

    card.innerHTML = `
      <div class="monster-emoji">${owned ? monster.emoji : '❓'}</div>
      <div class="monster-name">${owned ? escapeHtml(monster.name) : '???'}</div>
      <span class="monster-rarity rarity-${monster.rarity}">
        ${RARITY_LABEL[monster.rarity]}
      </span>
    `;

    if (owned) {
      card.style.cursor = 'pointer';
      card.setAttribute('aria-label', `Voir ${monster.name}`);

      card.addEventListener('click', () => {
        soundClick();
        vibrate(20);
        showMonsterReveal(monster, { replay: true });
      });
    }

    grid.appendChild(card);
  });
}