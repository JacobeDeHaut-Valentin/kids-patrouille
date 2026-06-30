import { store, saveState } from './state.js';
import { BESTIARY, RARITY_LABEL } from './data.js';
import { activeTasks, escapeHtml, showScreen, vibrate } from './helpers.js';
import { soundClick, soundUnlock, soundVictory } from './audio.js';
import { renderHome } from './ui-home.js';

let perfectShownToday = false;

export function resetPerfectShownToday() {
  perfectShownToday = false;
}

export function drawReward() {
  const rate = store.state.settings.monsterDropRate / 100;

  if (Math.random() >= rate) return null;

  const roll = Math.random();

  let targetRarity;
  if (roll < 0.70) targetRarity = 'common';
  else if (roll < 0.95) targetRarity = 'rare';
  else targetRarity = 'epic';

  let candidate = pickUncollected(targetRarity);

  if (!candidate && targetRarity === 'epic') {
    candidate = pickUncollected('rare');
  }

  if (!candidate) {
    candidate = pickUncollected('common');
  }

  if (!candidate) {
    store.state.points += 20;
    return null;
  }

  store.state.monsters.push(candidate.id);

  return candidate;
}

export function pickUncollected(rarity) {
  const pool = BESTIARY.filter(monster =>
    monster.rarity === rarity &&
    !store.state.monsters.includes(monster.id)
  );

  if (pool.length === 0) return null;

  return pool[Math.floor(Math.random() * pool.length)];
}

export function showConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';

  const colors = [
    '#fdcb6e',
    '#fd79a8',
    '#6c5ce7',
    '#00b894',
    '#74b9ff',
    '#e17055',
    '#ffeaa7'
  ];

  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';

    confetti.style.left = (Math.random() * 100) + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
    confetti.style.animationDelay = (Math.random() * 0.3) + 's';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';

    container.appendChild(confetti);
  }

  document.body.appendChild(container);

  setTimeout(() => container.remove(), 4000);
}

export function showMonsterReveal(monster) {
  soundUnlock();
  vibrate([50, 30, 50, 30, 150]);

  const background = document.createElement('div');
  background.className = 'card-reveal-bg';

  background.innerHTML = `
    <div class="title">Nouveau Monstre Débloqué !</div>
    <div class="card-flip">
      <div class="card-inner">
        <div class="card-face card-back">❓</div>
        <div class="card-face card-front">
          <div class="ce">${monster.emoji}</div>
          <div class="cn">${escapeHtml(monster.name)}</div>
          <span class="monster-rarity rarity-${monster.rarity}">
            ${RARITY_LABEL[monster.rarity]}
          </span>
        </div>
      </div>
    </div>
    <button class="closebtn">Super ! ✨</button>
  `;

  document.body.appendChild(background);

  background.querySelector('.closebtn').addEventListener('click', () => {
    soundClick();
    vibrate(20);
    background.remove();
    checkPerfectDay();
    showScreen('screen-home');
    renderHome();
  });
}

export function checkPerfectDay() {
  const active = activeTasks();

  if (active.length === 0) return;

  const done = active.filter(task =>
    store.state.completedToday.includes(task.id)
  ).length;

  const percent = (done / active.length) * 100;

  if (percent >= store.state.settings.perfectQuota && !perfectShownToday) {
    perfectShownToday = true;

    const today = new Date().toDateString();

    if (!store.state.stats.history.some(item => item.date === today && item.perfect)) {
      store.state.stats.perfectDays++;
      store.state.stats.history.push({
        date: today,
        perfect: true,
        count: done
      });
    }

    saveState();

    setTimeout(showUltimateReward, 300);
  }
}

export function showUltimateReward() {
  const name = store.state.childName || 'Champion';

  const overlay = document.createElement('div');
  overlay.className = 'victory-overlay';

  overlay.innerHTML = `
    <h1>BRAVO ${escapeHtml(name).toUpperCase()} ! 🎉</h1>
    <p>Tu as terminé toutes tes missions !<br>Journée Parfaite ⭐</p>
    <button class="closebtn">Continuer 🚀</button>
  `;

  document.body.appendChild(overlay);

  spawnFireworks(overlay);
  soundVictory();
  vibrate([100, 50, 100, 50, 100, 50, 300]);

  overlay.querySelector('.closebtn').addEventListener('click', () => {
    soundClick();
    overlay.remove();
  });
}

export function spawnFireworks(parent) {
  const colors = [
    '#ffeaa7',
    '#fab1a0',
    '#ff7675',
    '#fd79a8',
    '#a29bfe',
    '#74b9ff',
    '#55efc4'
  ];

  for (let burst = 0; burst < 8; burst++) {
    setTimeout(() => {
      const centerX = 20 + Math.random() * 60;
      const centerY = 20 + Math.random() * 50;

      for (let i = 0; i < 16; i++) {
        const firework = document.createElement('div');
        firework.className = 'firework';

        firework.style.left = centerX + '%';
        firework.style.top = centerY + '%';
        firework.style.background = colors[Math.floor(Math.random() * colors.length)];

        const angle = (i / 16) * Math.PI * 2;
        const distance = 60 + Math.random() * 60;

        firework.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
        firework.style.setProperty('--dy', Math.sin(angle) * distance + 'px');

        parent.appendChild(firework);

        setTimeout(() => firework.remove(), 1600);
      }
    }, burst * 350);
  }
}