import {
  APP_VERSION,
  STORAGE_KEY,
  OLD_STORAGE_KEYS,
  DEFAULT_TASKS
} from './data.js';

export const STATE_SCHEMA_VERSION = '4.1.0';

export const store = {
  state: null
};

export function createId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultStats() {
  return {
    totalCompleted: 0,
    failedAttempts: 0,
    perfectDays: 0,
    history: []
  };
}

export function defaultChildSettings() {
  return {
    perfectQuota: 80,
    monsterDropRate: 30
  };
}

export function defaultRewards() {
  return [
    {
      id: 1,
      emoji: '🎮',
      name: '15 min de jeu',
      cost: 30,
      active: true,
      claimed: 0
    },
    {
      id: 2,
      emoji: '📺',
      name: '1 dessin animé',
      cost: 40,
      active: true,
      claimed: 0
    },
    {
      id: 3,
      emoji: '📚',
      name: 'Une histoire bonus',
      cost: 25,
      active: true,
      claimed: 0
    }
  ];
}

export function createChild({
  id = createId('child'),
  name = 'Champion',
  emoji = '🦸',
  tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS)),
  completedToday = [],
  lastAccessDate = new Date().toDateString(),
  monsters = [],
  points = 0,
  stats = defaultStats(),
  rewards = defaultRewards(),
  settings = defaultChildSettings()
} = {}) {
  return {
    id,
    name,
    emoji,
    tasks: Array.isArray(tasks) ? tasks : JSON.parse(JSON.stringify(DEFAULT_TASKS)),
    completedToday: Array.isArray(completedToday) ? completedToday : [],
    lastAccessDate,
    monsters: Array.isArray(monsters) ? monsters : [],
    points: typeof points === 'number' ? points : 0,
    stats: Object.assign(defaultStats(), stats || {}),
    rewards: Array.isArray(rewards) ? rewards : defaultRewards(),
    settings: Object.assign(defaultChildSettings(), settings || {})
  };
}

export function defaultSharedSettings() {
  return {
    theme: 'classic',
    soundPack: 'classic',
    parentPassword: null,
    nightMode: {
      enabled: false,
      autoSchedule: true,
      startTime: '20:30',
      endTime: '06:30'
    }
  };
}

export function defaultState() {
  const firstChild = createChild({
    name: '',
    emoji: '🦸'
  });

  const state = {
    appVersion: APP_VERSION,
    schemaVersion: STATE_SCHEMA_VERSION,

    activeChildId: firstChild.id,
    children: [firstChild],

    sharedSettings: defaultSharedSettings()
  };

  hydrateLegacyFields(state);

  return state;
}

/**
 * Retourne l'enfant actif.
 * Si aucun enfant actif n'est valide, répare automatiquement l'état.
 */
export function activeChild() {
  if (!store.state) return null;

  if (!Array.isArray(store.state.children) || store.state.children.length === 0) {
    const child = createChild({
      name: store.state.childName || 'Champion'
    });

    store.state.children = [child];
    store.state.activeChildId = child.id;
  }

  let child = store.state.children.find(item => item.id === store.state.activeChildId);

  if (!child) {
    child = store.state.children[0];
    store.state.activeChildId = child.id;
  }

  return child;
}

export function activeChildIndex() {
  if (!store.state || !Array.isArray(store.state.children)) return -1;
  return store.state.children.findIndex(child => child.id === store.state.activeChildId);
}

/**
 * Copie les données de l'enfant actif vers les anciens champs V4.
 * Cela permet aux anciens fichiers JS de continuer à fonctionner.
 */
export function hydrateLegacyFields(state = store.state) {
  if (!state) return;

  if (!Array.isArray(state.children) || state.children.length === 0) {
    const child = createChild({
      name: state.childName || 'Champion',
      tasks: state.tasks,
      completedToday: state.completedToday,
      lastAccessDate: state.lastAccessDate,
      monsters: state.monsters,
      points: state.points,
      stats: state.stats,
      settings: {
        perfectQuota: state.settings?.perfectQuota ?? 80,
        monsterDropRate: state.settings?.monsterDropRate ?? 30
      }
    });

    state.children = [child];
    state.activeChildId = child.id;
  }

  let child = state.children.find(item => item.id === state.activeChildId);

  if (!child) {
    child = state.children[0];
    state.activeChildId = child.id;
  }

  state.childName = child.name;
  state.tasks = child.tasks;
  state.completedToday = child.completedToday;
  state.lastAccessDate = child.lastAccessDate;
  state.monsters = child.monsters;
  state.points = child.points;
  state.stats = child.stats;

  const shared = Object.assign(defaultSharedSettings(), state.sharedSettings || {});

  state.settings = Object.assign({}, shared, {
    perfectQuota: child.settings?.perfectQuota ?? 80,
    monsterDropRate: child.settings?.monsterDropRate ?? 30
  });

  state.sharedSettings = shared;
}

/**
 * Copie les anciens champs V4 vers l'enfant actif.
 * Utilisé avant chaque sauvegarde, pour compatibilité avec les anciens modules.
 */
export function syncActiveChildFromLegacy() {
  if (!store.state) return;

  const child = activeChild();
  if (!child) return;

  child.name = store.state.childName ?? child.name;
  child.tasks = Array.isArray(store.state.tasks) ? store.state.tasks : child.tasks;
  child.completedToday = Array.isArray(store.state.completedToday) ? store.state.completedToday : child.completedToday;
  child.lastAccessDate = store.state.lastAccessDate || child.lastAccessDate;
  child.monsters = Array.isArray(store.state.monsters) ? store.state.monsters : child.monsters;
  child.points = typeof store.state.points === 'number' ? store.state.points : child.points;
  child.stats = store.state.stats || child.stats;

  child.settings = Object.assign(defaultChildSettings(), child.settings || {}, {
    perfectQuota: store.state.settings?.perfectQuota ?? child.settings?.perfectQuota ?? 80,
    monsterDropRate: store.state.settings?.monsterDropRate ?? child.settings?.monsterDropRate ?? 30
  });

  store.state.sharedSettings = Object.assign(
    defaultSharedSettings(),
    store.state.sharedSettings || {},
    {
      theme: store.state.settings?.theme ?? store.state.sharedSettings?.theme ?? 'classic',
      soundPack: store.state.settings?.soundPack ?? store.state.sharedSettings?.soundPack ?? 'classic',
      parentPassword: store.state.settings?.parentPassword ?? store.state.sharedSettings?.parentPassword ?? null,
      nightMode: Object.assign(
        defaultSharedSettings().nightMode,
        store.state.sharedSettings?.nightMode || {},
        store.state.settings?.nightMode || {}
      )
    }
  );
}

export function setActiveChild(childId) {
  if (!store.state?.children?.some(child => child.id === childId)) return false;

  syncActiveChildFromLegacy();

  store.state.activeChildId = childId;

  hydrateLegacyFields(store.state);
  saveState();

  return true;
}

export function addChild({ name, emoji = '🦸' }) {
  const child = createChild({
    name: (name || 'Nouvel enfant').trim().slice(0, 20),
    emoji: emoji || '🦸'
  });

  store.state.children.push(child);
  store.state.activeChildId = child.id;

  hydrateLegacyFields(store.state);
  saveState();

  return child;
}

export function updateChild(childId, updates = {}) {
  const child = store.state.children.find(item => item.id === childId);
  if (!child) return null;

  if (updates.name !== undefined) {
    child.name = String(updates.name || '').trim().slice(0, 20) || child.name;
  }

  if (updates.emoji !== undefined) {
    child.emoji = String(updates.emoji || '').trim().slice(0, 4) || child.emoji;
  }

  hydrateLegacyFields(store.state);
  saveState();

  return child;
}

export function deleteChild(childId) {
  if (!store.state || !Array.isArray(store.state.children)) return false;

  if (store.state.children.length <= 1) {
    return false;
  }

  const index = store.state.children.findIndex(child => child.id === childId);
  if (index < 0) return false;

  store.state.children.splice(index, 1);

  if (store.state.activeChildId === childId) {
    store.state.activeChildId = store.state.children[0].id;
  }

  hydrateLegacyFields(store.state);
  saveState();

  return true;
}

export function migrate(old) {
  const fresh = defaultState();
  const source = old || {};

  // Cas déjà en modèle V4.1
  if (Array.isArray(source.children)) {
    const migrated = Object.assign({}, fresh, source);

    migrated.children = source.children.map(child => createChild(child));

    if (!migrated.activeChildId || !migrated.children.some(child => child.id === migrated.activeChildId)) {
      migrated.activeChildId = migrated.children[0]?.id;
    }

    migrated.sharedSettings = Object.assign(
      defaultSharedSettings(),
      source.sharedSettings || {},
      {
        theme: source.settings?.theme ?? source.sharedSettings?.theme ?? 'classic',
        soundPack: source.settings?.soundPack ?? source.sharedSettings?.soundPack ?? 'classic',
        parentPassword: source.settings?.parentPassword ?? source.sharedSettings?.parentPassword ?? null,
        nightMode: Object.assign(
          defaultSharedSettings().nightMode,
          source.sharedSettings?.nightMode || {},
          source.settings?.nightMode || {}
        )
      }
    );

    migrated.appVersion = APP_VERSION;
    migrated.schemaVersion = STATE_SCHEMA_VERSION;

    hydrateLegacyFields(migrated);

    return migrated;
  }

  // Migration depuis modèle V3/V4 enfant unique
  const child = createChild({
    name: source.childName || 'Champion',
    emoji: '🦸',
    tasks: source.tasks || JSON.parse(JSON.stringify(DEFAULT_TASKS)),
    completedToday: source.completedToday || [],
    lastAccessDate: source.lastAccessDate || new Date().toDateString(),
    monsters: source.monsters || [],
    points: typeof source.points === 'number' ? source.points : 0,
    stats: source.stats || defaultStats(),
    settings: {
      perfectQuota: source.settings?.perfectQuota ?? 80,
      monsterDropRate: source.settings?.monsterDropRate ?? 30
    }
  });

  const migrated = {
    appVersion: APP_VERSION,
    schemaVersion: STATE_SCHEMA_VERSION,

    activeChildId: child.id,
    children: [child],

    sharedSettings: Object.assign(defaultSharedSettings(), {
      theme: source.settings?.theme ?? 'classic',
      soundPack: source.settings?.soundPack ?? 'classic',
      parentPassword: source.settings?.parentPassword ?? null,
      nightMode: Object.assign(
        defaultSharedSettings().nightMode,
        source.settings?.nightMode || {}
      )
    })
  };

  hydrateLegacyFields(migrated);

  return migrated;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);

      if (parsed.schemaVersion === STATE_SCHEMA_VERSION) {
        hydrateLegacyFields(parsed);
        return parsed;
      }

      return migrate(parsed);
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
    syncActiveChildFromLegacy();
    hydrateLegacyFields(store.state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
  } catch (e) {}
}

export function checkDailyReset() {
  const today = new Date().toDateString();
  let changed = false;

  if (!store.state?.children) return false;

  store.state.children.forEach(child => {
    if (child.lastAccessDate !== today) {
      if (child.completedToday.length > 0) {
        child.stats.history.push({
          date: child.lastAccessDate,
          count: child.completedToday.length
        });

        if (child.stats.history.length > 60) {
          child.stats.history.shift();
        }
      }

      child.completedToday = [];
      child.lastAccessDate = today;
      changed = true;
    }
  });

  if (changed) {
    hydrateLegacyFields(store.state);
    saveState();
  }

  return changed;
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