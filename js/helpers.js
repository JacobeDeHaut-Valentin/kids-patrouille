import { store } from './state.js';

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  const element = document.getElementById(id);
  if (element) element.classList.add('active');

  window.scrollTo(0, 0);
}

export function escapeHtml(value) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return String(value).replace(/[&<>"']/g, character => map[character]);
}

export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) {}
}

export function activeTasks() {
  return store.state.tasks.filter(task => task.active);
}