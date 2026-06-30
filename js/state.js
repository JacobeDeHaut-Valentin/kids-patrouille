import {
  APP_VERSION,
  STORAGE_KEY,
  OLD_STORAGE_KEYS,
  DEFAULT_TASKS
} from './data.js';

export const store = {
  state: null
};

export function defaultState() {
  return {
    appVersion: APP_VERSION,
    childName: '',
    tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS)),
    completedToday: [],
    lastAccessDate: new Date().toDateString(),
    monsters: [],
    points: 0,
    stats: {
      totalCompleted: 0,
      failedAttempts: 0,
      perfectDays: 0,
      history: []
    },
    settings: {
      perfectQuota: 80,
      monsterDropRate: 30,
      theme: 'classic',
      soundPack: 'classic',
      parentPassword: null,
      nightMode: {
        enabled: false,
        autoSchedule: true,
        startTime: '20:30',
        endTime: '06:30'
      }
    }
  };
}

export function migrate(old) {
  const fresh = defaultState();
  const source = old || {};

  const merged = Object.assign({}, fresh, source);

  merged.settings = Object.assign(
    {},
    fresh.settings,
    source.settings || {}
  );

  merged.settings.nightMode = Object.assign(
    {},
    fresh.settings.nightMode,
    source.settings?.nightMode || {}
  );

  merged.stats = Object.assign(
    {},
    fresh.stats,
    source.stats || {}
  );

  if (!Array.isArray(merged.tasks)) merged.tasks = fresh.tasks;
  if (!Array.isArray(merged.completedToday)) merged.completedToday = [];
  if (!Array.isArray(merged.monsters)) merged.monsters = [];
  if (!Array.isArray(merged.stats.history)) merged.stats.history = [];

  if (typeof merged.stats.failedAttempts !== 'number') {
    merged.stats.failedAttempts = 0;
  }

  if (!merged.settings.theme) merged.settings.theme = 'classic';
  if (!merged.settings.soundPack) merged.settings.soundPack = 'classic';

  if (merged.settings.parentPassword === undefined) {
    merged.settings.parentPassword = null;
  }

  if (!merged.settings.nightMode) {
    merged.settings.nightMode = fresh.settings.nightMode;
  }

  merged.appVersion = APP_VERSION;

  return merged;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.appVersion === APP_VERSION ? parsed : migrate(parsed);
    }
  } catch (e) {}

  for (const oldKey of OLD_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(oldKey);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const migrated = migrate(parsed);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(oldKey);

      return migrated;
    } catch (e) {}
  }

  return defaultState();
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
  } catch (e) {}
}

export function checkDailyReset() {
  const today = new Date().toDateString();

  if (store.state.lastAccessDate !== today) {
    if (store.state.completedToday.length > 0) {
      store.state.stats.history.push({
        date: store.state.lastAccessDate,
        count: store.state.completedToday.length
      });

      if (store.state.stats.history.length > 60) {
        store.state.stats.history.shift();
      }
    }

    store.state.completedToday = [];
    store.state.lastAccessDate = today;

    saveState();

    return true;
  }

  return false;
}

export async function sha256(text) {
  try {
    const buffer = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buffer);

    return Array.from(new Uint8Array(hash))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    return 'fb:' + text;
  }
}