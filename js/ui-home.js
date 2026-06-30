import {
  store,
  saveState,
  activeChild,
  hydrateLegacyFields
} from './state.js';

import { BESTIARY } from './data.js';
import { activeTasks, escapeHtml, vibrate, hasMultipleChildren } from './helpers.js';
import { soundClick } from './audio.js';
import { openTimer } from './timer.js';

export function renderHome() {
  const child = activeChild();

  if (!child) return;

  const name = child.name || 'Champion';

  const greeting = document.getElementById('greeting');

  if (greeting) {
    const switchHint = hasMultipleChildren() ? ' 👧👦' : '';
    greeting.textContent = `Mission du jour pour ${name} ! 🚀${switchHint}`;
  }

  const active = activeTasks();

  const remaining = active.filter(task =>
    !child.completedToday.includes(task.id)
  ).length;

  document.getElementById('stat-tasks').textContent =
    `⏳ ${remaining} restante${remaining > 1 ? 's' : ''}`;

  document.getElementById('stat-monsters').textContent =
    `👾 ${child.monsters.length} / ${BESTIARY.length}`;

  document.getElementById('stat-points').textContent =
    `⭐ ${child.points} pts`;

  const grid = document.getElementById('tasks-grid');
  grid.innerHTML = '';

  active.forEach(task => {
    const done = child.completedToday.includes(task.id);

    const button = document.createElement('button');
    button.className = 'task-btn' + (done ? ' done' : '');
    button.setAttribute(
      'aria-label',
      task.name + (done ? ' (validée)' : '')
    );

    button.innerHTML = `
      <div class="task-emoji">${task.emoji}</div>
      <div class="task-name">${escapeHtml(task.name)}</div>
      <div class="task-status">${done ? '✅ Bravo !' : task.duration + ' min'}</div>
      ${done ? `<button class="task-redo" data-redo="${task.id}">🔄 Refaire</button>` : ''}
    `;

    button.addEventListener('click', event => {
      if (event.target?.dataset?.redo) {
        event.stopPropagation();

        const taskId = parseInt(event.target.dataset.redo, 10);

        child.completedToday = child.completedToday.filter(id => id !== taskId);

        hydrateLegacyFields(store.state);
        saveState();

        soundClick();
        vibrate(20);
        openTimer(taskId);

        return;
      }

      soundClick();
      vibrate(20);

      if (done) return;

      openTimer(task.id);
    });

    grid.appendChild(button);
  });
}