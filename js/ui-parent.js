import {
  store,
  saveState,
  defaultState,
  migrate,
  sha256
} from './state.js';
import { BESTIARY, EMOJI_CHOICES } from './data.js';
import { escapeHtml, showScreen, vibrate } from './helpers.js';
import { soundClick, soundError } from './audio.js';
import { showModal } from './modal.js';
import { applyNightMode, applyTheme } from './theme.js';
import { resetPerfectShownToday } from './rewards.js';
import { openCustomScreen } from './ui-custom.js';

let parentChallenge = null;
let lockPressTimer = null;

export function getParentLockInfo() {
  const until = parseInt(sessionStorage.getItem('parentLockUntil') || '0', 10);
  const fails = parseInt(sessionStorage.getItem('parentFails') || '0', 10);

  return {
    until,
    fails,
    locked: Date.now() < until
  };
}

function genChallenge() {
  const a = 6 + Math.floor(Math.random() * 7);
  const b = 6 + Math.floor(Math.random() * 7);
  const c = 10 + Math.floor(Math.random() * 41);

  return {
    a,
    b,
    c,
    answer: a * b + c
  };
}

export function requestParentAccess() {
  const info = getParentLockInfo();

  if (info.locked) {
    const seconds = Math.ceil((info.until - Date.now()) / 1000);

    showModal({
      title: '⛔ Bloqué',
      message: `Trop d'erreurs.<br>Réessayez dans ${seconds}s.`,
      inputType: null
    });

    return;
  }

  if (store.state.settings.parentPassword) {
    showPasswordModal();
  } else {
    parentChallenge = genChallenge();
    showMathModal();
  }
}

function showMathModal() {
  const challenge = parentChallenge;

  showModal({
    title: '🔐 Zone Parent (1ère fois)',
    message: `
      Calcule :<br>
      <b style="font-size:28px">
        (${challenge.a} × ${challenge.b}) + ${challenge.c} = ?
      </b>
    `,
    inputType: 'number',
    onValidate(value) {
      const answer = parseInt(value, 10);

      if (answer === challenge.answer) {
        sessionStorage.setItem('parentFails', '0');
        showSetPasswordModal();
        return true;
      }

      const failures = getParentLockInfo().fails + 1;
      sessionStorage.setItem('parentFails', String(failures));

      if (failures >= 3) {
        sessionStorage.setItem('parentLockUntil', String(Date.now() + 60000));
        sessionStorage.setItem('parentFails', '0');
        return 'Bloqué 60 secondes';
      }

      soundError();

      return `Faux ! (${3 - failures} essai${3 - failures > 1 ? 's' : ''} restant${3 - failures > 1 ? 's' : ''})`;
    }
  });
}

function showSetPasswordModal(afterDefine) {
  showModal({
    title: '🔑 Code à 4 chiffres',
    message: 'Choisis un code pour remplacer le calcul.',
    inputType: 'tel',
    onValidate(value) {
      if (!/^\d{4}$/.test(value)) {
        return 'Doit contenir exactement 4 chiffres';
      }

      const first = value;

      setTimeout(() => {
        showModal({
          title: '🔁 Confirme le code',
          message: 'Retape le même code.',
          inputType: 'tel',
          async onValidate(confirmValue) {
            if (confirmValue !== first) {
              return 'Les codes ne correspondent pas';
            }

            store.state.settings.parentPassword = await sha256(first);
            saveState();

            if (afterDefine) afterDefine();
            else openParentZone();

            return true;
          }
        });
      }, 80);

      return true;
    }
  });
}

function showPasswordModal() {
  showModal({
    title: '🔑 Code parent',
    message: 'Entre ton code à 4 chiffres.',
    inputType: 'tel',
    async onValidate(value) {
      if (!/^\d{4}$/.test(value)) {
        return 'Doit contenir 4 chiffres';
      }

      const hash = await sha256(value);

      if (hash === store.state.settings.parentPassword) {
        sessionStorage.setItem('parentFails', '0');
        openParentZone();
        return true;
      }

      const failures = getParentLockInfo().fails + 1;
      sessionStorage.setItem('parentFails', String(failures));

      if (failures >= 3) {
        sessionStorage.setItem('parentLockUntil', String(Date.now() + 60000));
        sessionStorage.setItem('parentFails', '0');
        return 'Bloqué 60 secondes';
      }

      soundError();

      return `Code faux (${3 - failures} essai${3 - failures > 1 ? 's' : ''} restant${3 - failures > 1 ? 's' : ''})`;
    }
  });
}

export function openParentZone() {
  renderParent();
  showScreen('screen-parent');
}

function buildLast7DaysData() {
  const output = [];
  const today = new Date();
  const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dateString = date.toDateString();

    let count = 0;

    if (i === 0) {
      count = store.state.completedToday.length;
    } else {
      const history = store.state.stats.history.filter(item => item.date === dateString);
      count = history.reduce((sum, item) => sum + (item.count || 0), 0);
    }

    output.push({
      label: dayLabels[date.getDay()],
      count,
      isToday: i === 0
    });
  }

  return output;
}

function renderMiniChart() {
  const data = buildLast7DaysData();
  const max = Math.max(1, ...data.map(day => day.count));

  let html = '<div class="mini-chart">';

  data.forEach(day => {
    const height = Math.round((day.count / max) * 90);

    html += `
      <div class="mini-bar-col">
        <div class="mini-bar-wrap">
          <div class="mini-bar${day.isToday ? ' today' : ''}" style="height:${height}%">
            ${day.count > 0 ? `<span class="mini-bar-val">${day.count}</span>` : ''}
          </div>
        </div>
        <div class="mini-bar-label">${day.label}</div>
      </div>
    `;
  });

  html += '</div>';

  return html;
}

function computeLast7Days() {
  return buildLast7DaysData().reduce((sum, day) => sum + day.count, 0);
}

export function renderParent() {
  const container = document.getElementById('parent-content');

  const settings = store.state.settings;
  const stats = store.state.stats;
  const nightMode = settings.nightMode;
  const hasPassword = !!settings.parentPassword;
  const last7 = computeLast7Days();

  container.innerHTML = `
    <div class="p-section">
      <h3>👦 Identité</h3>
      <label>Prénom</label>
      <input type="text" id="p-name" value="${escapeHtml(store.state.childName)}" maxlength="20">
      <div class="p-actions-center">
        <button class="p-btn success" id="p-save-name">Enregistrer</button>
      </div>
    </div>

    <div class="p-section">
      <h3>🔒 Sécurité</h3>
      <div style="text-align:center;font-size:13px;color:#bdc3c7;margin-bottom:8px">
        ${hasPassword ? '✅ Code défini' : '⚠️ Calcul mental uniquement'}
      </div>
      <div class="p-actions-center">
        <button class="p-btn" id="p-change-pwd">${hasPassword ? 'Changer' : 'Définir'} le code</button>
        ${hasPassword ? '<button class="p-btn warn" id="p-remove-pwd">Supprimer le code</button>' : ''}
      </div>
    </div>

    <div class="p-section">
      <h3>🌙 Mode Nuit</h3>
      <div class="night-row">
        <input type="checkbox" id="p-nm-enabled" ${nightMode.enabled ? 'checked' : ''}>
        <label for="p-nm-enabled" style="margin:0">Activé manuellement</label>
      </div>
      <div class="night-row">
        <input type="checkbox" id="p-nm-auto" ${nightMode.autoSchedule ? 'checked' : ''}>
        <label for="p-nm-auto" style="margin:0">Activation automatique selon l'heure</label>
      </div>
      <div class="time-row">
        <label>Début :</label>
        <input type="time" id="p-nm-start" value="${nightMode.startTime}">
        <label>Fin :</label>
        <input type="time" id="p-nm-end" value="${nightMode.endTime}">
      </div>
      <div class="p-actions-center">
        <button class="p-btn success" id="p-save-night">Enregistrer</button>
      </div>
    </div>

    <div class="p-section">
      <h3>📋 Tâches</h3>
      <div id="p-tasks-list"></div>
      <div class="p-actions-center">
        <button class="p-btn" id="p-add-task">➕ Nouvelle tâche</button>
      </div>
    </div>

    <div class="p-section">
      <h3>🎁 Récompenses</h3>
      <label>Quota Journée Parfaite : <b id="p-quota-val">${settings.perfectQuota}%</b></label>
      <input type="range" id="p-quota" min="50" max="100" step="5" value="${settings.perfectQuota}">
      <label style="margin-top:10px">Probabilité monstre : <b id="p-drop-val">${settings.monsterDropRate}%</b></label>
      <input type="range" id="p-drop" min="5" max="100" step="5" value="${settings.monsterDropRate}">
      <div class="p-actions-center">
        <button class="p-btn success" id="p-save-rewards">Enregistrer</button>
      </div>
    </div>

    <div class="p-section">
      <h3>📊 Statistiques</h3>
      <div class="stat-grid">
        <div class="stat-box"><div class="v">${stats.totalCompleted}</div><div class="l">Réussies totales</div></div>
        <div class="stat-box"><div class="v">${last7}</div><div class="l">7 derniers jours</div></div>
        <div class="stat-box"><div class="v">${stats.perfectDays}</div><div class="l">Journées parfaites</div></div>
        <div class="stat-box"><div class="v">${stats.failedAttempts || 0}</div><div class="l">Tentatives échouées</div></div>
      </div>
      <div style="margin-top:8px;font-size:13px;color:#bdc3c7;text-align:center">
        Points : ${store.state.points} ⭐ — Monstres : ${store.state.monsters.length}/${BESTIARY.length}
      </div>
      <div style="margin-top:10px;font-size:13px;color:#fdcb6e;text-align:center">📈 7 derniers jours</div>
      ${renderMiniChart()}
    </div>

    <div class="p-section">
      <h3>💾 Sauvegarde</h3>
      <div class="p-actions-center">
        <button class="p-btn" id="p-export">📤 Exporter</button>
        <button class="p-btn" id="p-import">📥 Importer</button>
      </div>
    </div>

    <div class="p-section">
      <h3>♻️ Réinitialisation</h3>
      <div class="p-actions-center">
        <button class="p-btn warn" id="p-reset-day">Reset du jour</button>
        <button class="p-btn warn" id="p-reset-collection">Reset collection</button>
        <button class="p-btn danger" id="p-reset-all">⚠️ Reset complet</button>
      </div>
    </div>
  `;

  renderParentTasks();
  bindParentEvents();
}

function renderParentTasks() {
  const list = document.getElementById('p-tasks-list');
  list.innerHTML = '';

  store.state.tasks.forEach(task => {
    const row = document.createElement('div');
    row.className = 'task-row';

    row.innerHTML = `
      <input class="tr-emoji" type="text" value="${escapeHtml(task.emoji)}" maxlength="2" data-id="${task.id}" data-field="emoji">
      <input class="tr-name" type="text" value="${escapeHtml(task.name)}" maxlength="40" data-id="${task.id}" data-field="name">
      <input class="tr-dur" type="number" min="1" max="30" value="${task.duration}" data-id="${task.id}" data-field="duration">
      <div class="tr-actions">
        <button class="icon-btn" data-act="up" data-id="${task.id}">↑</button>
        <button class="icon-btn" data-act="down" data-id="${task.id}">↓</button>
        <button class="icon-btn" data-act="toggle" data-id="${task.id}">${task.active ? '👁️' : '🚫'}</button>
        <button class="icon-btn" data-act="delete" data-id="${task.id}">🗑️</button>
      </div>
    `;

    list.appendChild(row);
  });

  list.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', event => {
      const id = parseInt(event.target.dataset.id, 10);
      const field = event.target.dataset.field;
      const task = store.state.tasks.find(item => item.id === id);

      if (!task) return;

      let value = event.target.value;

      if (field === 'duration') {
        value = Math.max(1, Math.min(30, parseInt(value, 10) || 1));
        event.target.value = value;
      }

      task[field] = value;
      saveState();
    });
  });

  list.querySelectorAll('.icon-btn').forEach(button => {
    button.addEventListener('click', () => {
      handleTaskAction(parseInt(button.dataset.id, 10), button.dataset.act);
    });
  });
}

function handleTaskAction(id, action) {
  const index = store.state.tasks.findIndex(task => task.id === id);

  if (index < 0) return;

  if (action === 'up' && index > 0) {
    [store.state.tasks[index - 1], store.state.tasks[index]] =
      [store.state.tasks[index], store.state.tasks[index - 1]];
  } else if (action === 'down' && index < store.state.tasks.length - 1) {
    [store.state.tasks[index + 1], store.state.tasks[index]] =
      [store.state.tasks[index], store.state.tasks[index + 1]];
  } else if (action === 'toggle') {
    store.state.tasks[index].active = !store.state.tasks[index].active;
  } else if (action === 'delete') {
    if (!confirm('Supprimer cette tâche ?')) return;
    store.state.tasks.splice(index, 1);
  }

  saveState();
  renderParentTasks();
}

function bindParentEvents() {
  document.getElementById('p-save-name').addEventListener('click', () => {
    store.state.childName = document.getElementById('p-name').value.trim().slice(0, 20);
    saveState();
    flashSaved('p-save-name');
  });

  document.getElementById('p-change-pwd').addEventListener('click', () => {
    showSetPasswordModal(() => renderParent());
  });

  const removePasswordButton = document.getElementById('p-remove-pwd');

  if (removePasswordButton) {
    removePasswordButton.addEventListener('click', () => {
      if (!confirm('Supprimer le code ? Tu reviendras au calcul mental.')) return;

      store.state.settings.parentPassword = null;
      saveState();
      renderParent();
    });
  }

  document.getElementById('p-save-night').addEventListener('click', () => {
    const nightMode = store.state.settings.nightMode;

    nightMode.enabled = document.getElementById('p-nm-enabled').checked;
    nightMode.autoSchedule = document.getElementById('p-nm-auto').checked;
    nightMode.startTime = document.getElementById('p-nm-start').value || '20:30';
    nightMode.endTime = document.getElementById('p-nm-end').value || '06:30';

    saveState();
    applyNightMode();
    flashSaved('p-save-night');
  });

  const quotaSlider = document.getElementById('p-quota');
  const dropSlider = document.getElementById('p-drop');

  quotaSlider.addEventListener('input', event => {
    document.getElementById('p-quota-val').textContent = event.target.value + '%';
  });

  dropSlider.addEventListener('input', event => {
    document.getElementById('p-drop-val').textContent = event.target.value + '%';
  });

  document.getElementById('p-save-rewards').addEventListener('click', () => {
    store.state.settings.perfectQuota = parseInt(quotaSlider.value, 10);
    store.state.settings.monsterDropRate = parseInt(dropSlider.value, 10);

    saveState();
    flashSaved('p-save-rewards');
  });

  document.getElementById('p-add-task').addEventListener('click', addTaskFlow);
  document.getElementById('p-export').addEventListener('click', exportConfig);
  document.getElementById('p-import').addEventListener('click', importConfig);

  document.getElementById('p-reset-day').addEventListener('click', () => {
    if (confirm('Réinitialiser la progression du jour ?')) {
      store.state.completedToday = [];
      resetPerfectShownToday();
      saveState();
      renderParent();
    }
  });

  document.getElementById('p-reset-collection').addEventListener('click', () => {
    if (confirm('Effacer la collection ?')) {
      store.state.monsters = [];
      saveState();
      renderParent();
    }
  });

  document.getElementById('p-reset-all').addEventListener('click', () => {
    if (!confirm('⚠️ Tout effacer ?')) return;
    if (!confirm('Vraiment ? (dernière confirmation)')) return;

    store.state = defaultState();
    saveState();

    applyTheme(store.state.settings.theme);
    applyNightMode();

    renderParent();
  });
}

function flashSaved(id) {
  const button = document.getElementById(id);
  if (!button) return;

  const original = button.textContent;
  button.textContent = '✅ Enregistré';

  setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

function addTaskFlow() {
  const choices = EMOJI_CHOICES
    .map(emoji => `<button class="icon-btn" data-emoji="${emoji}" style="font-size:24px;margin:2px">${emoji}</button>`)
    .join('');

  showModal({
    title: '➕ Nouvelle tâche',
    message: `
      <label style="text-align:left;display:block">Nom</label>
      <input type="text" id="nt-name" maxlength="40" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px">
      <label style="text-align:left;display:block">Emoji</label>
      <input type="text" id="nt-emoji" maxlength="2" value="⭐" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px;text-align:center">
      <div style="display:flex;flex-wrap:wrap;max-height:120px;overflow-y:auto;margin:6px 0;justify-content:center">
        ${choices}
      </div>
      <label style="text-align:left;display:block">Durée (min)</label>
      <input type="number" id="nt-dur" min="1" max="30" value="5" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px;text-align:center">
    `,
    inputType: null,
    onValidate() {
      const name = document.getElementById('nt-name').value.trim();
      const emoji = document.getElementById('nt-emoji').value.trim() || '⭐';
      const duration = Math.max(
        1,
        Math.min(30, parseInt(document.getElementById('nt-dur').value, 10) || 5)
      );

      if (!name) return 'Donne un nom';

      const id = Math.max(0, ...store.state.tasks.map(task => task.id)) + 1;

      store.state.tasks.push({
        id,
        emoji,
        name,
        duration,
        active: true
      });

      saveState();
      renderParentTasks();

      return true;
    }
  });

  setTimeout(() => {
    document.querySelectorAll('[data-emoji]').forEach(button => {
      button.addEventListener('click', () => {
        document.getElementById('nt-emoji').value = button.dataset.emoji;
      });
    });
  }, 100);
}

function exportConfig() {
  try {
    const data = JSON.stringify(store.state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'kids-patrouille-' + new Date().toISOString().slice(0, 10) + '.json';

    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      anchor.remove();
    }, 100);
  } catch (e) {
    alert('Export impossible');
  }
}

function importConfig() {
  const input = document.createElement('input');

  input.type = 'file';
  input.accept = 'application/json,.json';

  input.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = eventReader => {
      try {
        const data = JSON.parse(eventReader.target.result);

        if (!data || typeof data !== 'object') {
          throw new Error('Format invalide');
        }

        store.state = migrate(data);
        saveState();

        applyTheme(store.state.settings.theme);
        applyNightMode();
        renderParent();

        alert('✅ Import réussi !');
      } catch (error) {
        alert('❌ Fichier invalide : ' + error.message);
      }
    };

    reader.readAsText(file);
  });

  input.click();
}

export function setupLockButton() {
  const button = document.getElementById('lock-btn');

  const start = event => {
    event.preventDefault();

    lockPressTimer = setTimeout(() => {
      vibrate(80);
      requestParentAccess();
    }, 2000);
  };

  const cancel = () => {
    if (lockPressTimer) {
      clearTimeout(lockPressTimer);
      lockPressTimer = null;
    }
  };

  button.addEventListener('touchstart', start, { passive: false });
  button.addEventListener('touchend', cancel);
  button.addEventListener('touchcancel', cancel);
  button.addEventListener('mousedown', start);
  button.addEventListener('mouseup', cancel);
  button.addEventListener('mouseleave', cancel);
}

export function setupCustomButton() {
  document.getElementById('custom-btn').addEventListener('click', () => {
    soundClick();
    vibrate(20);
    openCustomScreen();
  });
}