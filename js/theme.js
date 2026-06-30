import { store, saveState } from './state.js';
import { THEMES } from './data.js';

let nightCheckInterval = null;

export function isWithinNightSchedule() {
  const nightMode = store.state.settings.nightMode;

  if (!nightMode.startTime || !nightMode.endTime) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = nightMode.startTime.split(':').map(Number);
  const [endHour, endMinute] = nightMode.endTime.split(':').map(Number);

  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  if (start === end) return false;

  if (start < end) {
    return currentMinutes >= start && currentMinutes < end;
  }

  return currentMinutes >= start || currentMinutes < end;
}

export function applyNightMode() {
  const nightMode = store.state.settings.nightMode;

  const isActive = nightMode.autoSchedule
    ? isWithinNightSchedule()
    : !!nightMode.enabled;

  document.body.classList.toggle('night-mode', isActive);

  const button = document.getElementById('btn-night');
  if (button) button.textContent = isActive ? '☀️' : '🌙';

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', isActive ? '#1a1a2e' : '#6c5ce7');
  }
}

export function toggleNightMode() {
  const nightMode = store.state.settings.nightMode;

  nightMode.autoSchedule = false;
  nightMode.enabled = !document.body.classList.contains('night-mode');

  saveState();
  applyNightMode();
}

export function startNightWatcher() {
  if (nightCheckInterval) clearInterval(nightCheckInterval);
  nightCheckInterval = setInterval(applyNightMode, 60000);
}

export function applyTheme(themeId) {
  const validTheme = THEMES.find(theme => theme.id === themeId)
    ? themeId
    : 'classic';

  THEMES.forEach(theme => {
    document.body.classList.remove('theme-' + theme.id);
  });

  document.body.classList.add('theme-' + validTheme);
  store.state.settings.theme = validTheme;
}