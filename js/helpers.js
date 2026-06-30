import { store, activeChild as getActiveChild } from './state.js';

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

export function activeChild() {
  return getActiveChild();
}

export function activeTasks() {
  const child = getActiveChild();

  if (!child || !Array.isArray(child.tasks)) return [];

  return child.tasks.filter(task => task.active);
}

export function childSettings() {
  const child = getActiveChild();

  return child?.settings || {
    perfectQuota: 80,
    monsterDropRate: 30
  };
}

export function sharedSettings() {
  return store.state?.sharedSettings || store.state?.settings || {};
}

export function getChildren() {
  return Array.isArray(store.state?.children) ? store.state.children : [];
}

export function hasMultipleChildren() {
  return getChildren().length > 1;
}