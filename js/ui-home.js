import { store, saveState } from './state.js';
import { BESTIARY } from './data.js';
import { activeTasks, escapeHtml, vibrate } from './helpers.js';
import { soundClick } from './audio.js';
import { openTimer } from './timer.js';

export function renderHome() {
  const name = store.state.childName || 'Champion';

  document.getElementById('greeting').textContent =
    `Mission du jour pour ${name} ! 🚀`;

  const active = activeTasks();

  const remaining = active.filter(task =>
    !store.state.completedToday.includes(task.id)
  ).length;

  document.getElementById('stat-tasks').textContent =
    `⏳ ${remaining} restante${remaining > 1 ? 's' : ''}`;

  document.getElementById('stat-monsters').textContent =
    `👾 ${store.state.monsters.length} / ${BESTIARY.length}`;

  document.getElementById('stat-points').textContent =
    `⭐ ${store.state.points} pts`;

  const grid = document.getElementById('tasks-grid');
  grid.innerHTML = '';

  active.forEach(task => {
    const done = store.state.completedToday.includes(task.id);

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

        store.state.completedToday =
          store.state.completedToday.filter(id => id !== taskId);

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