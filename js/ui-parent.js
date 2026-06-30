import {
  store,
  saveState,
  defaultState,
  migrate,
  sha256,
  activeChild,
  hydrateLegacyFields,
  addChild,
  updateChild,
  deleteChild,
  setActiveChild
} from './state.js';

import { BESTIARY, EMOJI_CHOICES } from './data.js';
import { escapeHtml, showScreen, vibrate } from './helpers.js';
import { soundClick, soundError } from './audio.js';
import { showModal } from './modal.js';
import { applyNightMode, applyTheme } from './theme.js';
import { resetPerfectShownToday } from './rewards.js';
import { openCustomScreen } from './ui-custom.js';

let parentChallenge = null;

/* =========================================================
   Sécurité zone parent
   ========================================================= */

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
    title: '🔐 Zone Parent',
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

/* =========================================================
   Ouverture / rendu parent
   ========================================================= */

export function openParentZone() {
  renderParent();
  showScreen('screen-parent');
}

function buildLast7DaysData(child) {
  const output = [];
  const today = new Date();
  const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dateString = date.toDateString();
    let count = 0;

    if (i === 0) {
      count = child.completedToday.length;
    } else {
      const history = child.stats.history.filter(item => item.date === dateString);
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

function renderMiniChart(child) {
  const data = buildLast7DaysData(child);
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

function computeLast7Days(child) {
  return buildLast7DaysData(child).reduce((sum, day) => sum + day.count, 0);
}

export function renderParent() {
  const child = activeChild();
  if (!child) return;

  const container = document.getElementById('parent-content');

  const settings = store.state.settings;
  const nightMode = settings.nightMode;
  const hasPassword = !!settings.parentPassword;
  const last7 = computeLast7Days(child);

  container.innerHTML = `
    ${renderChildrenSection(child)}

    <div class="p-section">
      <h3>👦 Enfant actif</h3>
      <label>Prénom</label>
      <input type="text" id="p-name" value="${escapeHtml(child.name)}" maxlength="20">
      <label>Emoji</label>
      <input type="text" id="p-emoji" value="${escapeHtml(child.emoji || '🦸')}" maxlength="4">
      <div class="p-actions-center">
        <button class="p-btn success" id="p-save-child">Enregistrer</button>
      </div>
    </div>

    <div class="p-section">
      <h3>📋 Missions de ${escapeHtml(child.name || 'Champion')}</h3>
      <div id="p-tasks-list"></div>
      <div class="p-actions-center">
        <button class="p-btn" id="p-add-task">➕ Nouvelle mission</button>
        <button class="p-btn warn" id="p-reset-missions">♻️ Reset missions du jour</button>
      </div>
    </div>

    ${renderRewardsSection(child)}

    <div class="p-section">
      <h3>🎁 Réglages récompenses</h3>
      <label>Quota Journée Parfaite : <b id="p-quota-val">${child.settings.perfectQuota}%</b></label>
      <input type="range" id="p-quota" min="50" max="100" step="5" value="${child.settings.perfectQuota}">

      <label style="margin-top:10px">Probabilité monstre : <b id="p-drop-val">${child.settings.monsterDropRate}%</b></label>
      <input type="range" id="p-drop" min="5" max="100" step="5" value="${child.settings.monsterDropRate}">

      <div class="p-actions-center">
        <button class="p-btn success" id="p-save-rewards-settings">Enregistrer</button>
      </div>
    </div>

    <div class="p-section">
      <h3>👾 Monstres</h3>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="v">${child.monsters.length}/${BESTIARY.length}</div>
          <div class="l">Collection</div>
        </div>
        <div class="stat-box">
          <div class="v">${Math.round((child.monsters.length / BESTIARY.length) * 100)}%</div>
          <div class="l">Complétée</div>
        </div>
      </div>
      <div class="p-actions-center" style="margin-top:10px">
        <button class="p-btn warn" id="p-reset-collection">Reset collection</button>
      </div>
    </div>

    <div class="p-section">
      <h3>📊 Statistiques de ${escapeHtml(child.name || 'Champion')}</h3>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="v">${child.stats.totalCompleted}</div>
          <div class="l">Réussies totales</div>
        </div>
        <div class="stat-box">
          <div class="v">${last7}</div>
          <div class="l">7 derniers jours</div>
        </div>
        <div class="stat-box">
          <div class="v">${child.stats.perfectDays}</div>
          <div class="l">Journées parfaites</div>
        </div>
        <div class="stat-box">
          <div class="v">${child.stats.failedAttempts || 0}</div>
          <div class="l">Tentatives échouées</div>
        </div>
      </div>
      <div style="margin-top:8px;font-size:13px;color:#bdc3c7;text-align:center">
        Points : ${child.points} ⭐
      </div>
      <div style="margin-top:10px;font-size:13px;color:#fdcb6e;text-align:center">
        📈 7 derniers jours
      </div>
      ${renderMiniChart(child)}
    </div>

    <div class="p-section">
      <h3>🌙 Préférences globales</h3>
      <div class="night-row">
        <input type="checkbox" id="p-nm-enabled" ${nightMode.enabled ? 'checked' : ''}>
        <label for="p-nm-enabled" style="margin:0">Mode nuit manuel</label>
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
      <h3>🔒 Sécurité</h3>
      <div style="text-align:center;font-size:13px;color:#bdc3c7;margin-bottom:8px">
        ${hasPassword ? '✅ Code parent défini' : '⚠️ Calcul mental uniquement'}
      </div>
      <div class="p-actions-center">
        <button class="p-btn" id="p-change-pwd">${hasPassword ? 'Changer' : 'Définir'} le code</button>
        ${hasPassword ? '<button class="p-btn warn" id="p-remove-pwd">Supprimer le code</button>' : ''}
      </div>
    </div>

    <div class="p-section">
      <h3>💾 Sauvegarde</h3>
      <div class="p-actions-center">
        <button class="p-btn" id="p-export">📤 Exporter</button>
        <button class="p-btn" id="p-import">📥 Importer</button>
      </div>
    </div>

    <div class="p-section">
      <h3>♻️ Réinitialisation avancée</h3>
      <div class="p-actions-center">
        <button class="p-btn warn" id="p-reset-child">Reset enfant actif</button>
        <button class="p-btn danger" id="p-reset-all">⚠️ Reset application complète</button>
      </div>
    </div>
  `;

  renderParentTasks();
  bindParentEvents();
}

/* =========================================================
   Section enfants
   ========================================================= */

function renderChildrenSection(active) {
  const children = store.state.children || [];

  let html = `
    <div class="p-section">
      <h3>👧👦 Enfants</h3>
      <div style="display:flex;flex-direction:column;gap:8px">
  `;

  children.forEach(child => {
    const selected = child.id === active.id;

    html += `
      <div class="child-row" style="
        display:flex;
        gap:8px;
        align-items:center;
        justify-content:space-between;
        background:${selected ? '#243b55' : '#2c3e50'};
        border:${selected ? '2px solid #00b894' : '1px solid #4a5d6e'};
        border-radius:10px;
        padding:10px;
        flex-wrap:wrap;
      ">
        <div style="font-weight:800">
          <span style="font-size:24px">${escapeHtml(child.emoji || '🦸')}</span>
          ${escapeHtml(child.name || 'Champion')}
          ${selected ? ' ✅' : ''}
        </div>
        <div class="p-actions-center">
          ${selected ? '' : `<button class="p-btn" data-child-act="select" data-child-id="${child.id}">Choisir</button>`}
          <button class="p-btn" data-child-act="edit" data-child-id="${child.id}">Modifier</button>
          <button class="p-btn danger" data-child-act="delete" data-child-id="${child.id}">Supprimer</button>
        </div>
      </div>
    `;
  });

  html += `
      </div>
      <div class="p-actions-center" style="margin-top:10px">
        <button class="p-btn success" id="p-add-child">➕ Ajouter un enfant</button>
      </div>
    </div>
  `;

  return html;
}

/* =========================================================
   Missions
   ========================================================= */

function renderParentTasks() {
  const child = activeChild();
  const list = document.getElementById('p-tasks-list');

  if (!child || !list) return;

  list.innerHTML = '';

  child.tasks.forEach(task => {
    const row = document.createElement('div');
    row.className = 'task-row';

    row.innerHTML = `
      <input class="tr-emoji" type="text" value="${escapeHtml(task.emoji)}" maxlength="4" data-id="${task.id}" data-field="emoji">
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
      const task = child.tasks.find(item => item.id === id);

      if (!task) return;

      let value = event.target.value;

      if (field === 'duration') {
        value = Math.max(1, Math.min(30, parseInt(value, 10) || 1));
        event.target.value = value;
      }

      task[field] = value;

      hydrateLegacyFields(store.state);
      saveState();
    });
  });

  list.querySelectorAll('.icon-btn').forEach(button => {
    button.addEventListener('click', () => {
      handleTaskAction(
        parseInt(button.dataset.id, 10),
        button.dataset.act
      );
    });
  });
}

function handleTaskAction(id, action) {
  const child = activeChild();
  if (!child) return;

  const index = child.tasks.findIndex(task => task.id === id);
  if (index < 0) return;

  if (action === 'up' && index > 0) {
    [child.tasks[index - 1], child.tasks[index]] =
      [child.tasks[index], child.tasks[index - 1]];
  } else if (action === 'down' && index < child.tasks.length - 1) {
    [child.tasks[index + 1], child.tasks[index]] =
      [child.tasks[index], child.tasks[index + 1]];
  } else if (action === 'toggle') {
    child.tasks[index].active = !child.tasks[index].active;
  } else if (action === 'delete') {
    if (!confirm('Supprimer cette mission ?')) return;
    child.tasks.splice(index, 1);
  }

  hydrateLegacyFields(store.state);
  saveState();
  renderParentTasks();
}

function addTaskFlow() {
  const child = activeChild();
  if (!child) return;

  const choices = EMOJI_CHOICES
    .map(emoji => `<button class="icon-btn" data-emoji="${emoji}" style="font-size:24px;margin:2px">${emoji}</button>`)
    .join('');

  showModal({
    title: '➕ Nouvelle mission',
    message: `
      <label style="text-align:left;display:block">Nom</label>
      <input type="text" id="nt-name" maxlength="40" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px">

      <label style="text-align:left;display:block">Emoji</label>
      <input type="text" id="nt-emoji" maxlength="4" value="⭐" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px;text-align:center">

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

      const id = Math.max(0, ...child.tasks.map(task => task.id)) + 1;

      child.tasks.push({
        id,
        emoji,
        name,
        duration,
        active: true
      });

      hydrateLegacyFields(store.state);
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

/* =========================================================
   Récompenses personnalisées
   ========================================================= */

function renderRewardsSection(child) {
  const rewards = Array.isArray(child.rewards) ? child.rewards : [];

  let html = `
    <div class="p-section">
      <h3>🎁 Récompenses personnalisées</h3>
      <div style="text-align:center;font-size:13px;color:#bdc3c7;margin-bottom:8px">
        Points disponibles : <b>${child.points} ⭐</b>
      </div>
      <div id="p-rewards-list">
  `;

  if (rewards.length === 0) {
    html += `
      <div style="text-align:center;color:#bdc3c7;font-size:13px;margin:10px 0">
        Aucune récompense personnalisée pour le moment.
      </div>
    `;
  }

  rewards.forEach(reward => {
    html += `
      <div class="task-row" style="${reward.active ? '' : 'opacity:.55'}">
        <input class="tr-emoji" type="text" value="${escapeHtml(reward.emoji)}" maxlength="4" data-reward-id="${reward.id}" data-reward-field="emoji">
        <input class="tr-name" type="text" value="${escapeHtml(reward.name)}" maxlength="40" data-reward-id="${reward.id}" data-reward-field="name">
        <input class="tr-dur" type="number" min="1" max="999" value="${reward.cost}" data-reward-id="${reward.id}" data-reward-field="cost">
        <div class="tr-actions">
          <button class="icon-btn" data-reward-act="claim" data-reward-id="${reward.id}">⭐</button>
          <button class="icon-btn" data-reward-act="toggle" data-reward-id="${reward.id}">${reward.active ? '👁️' : '🚫'}</button>
          <button class="icon-btn" data-reward-act="delete" data-reward-id="${reward.id}">🗑️</button>
        </div>
        <div style="width:100%;font-size:12px;color:#bdc3c7;text-align:center">
          Coût : ${reward.cost} pts — Utilisée ${reward.claimed || 0} fois
        </div>
      </div>
    `;
  });

  html += `
      </div>
      <div class="p-actions-center">
        <button class="p-btn success" id="p-add-reward">➕ Ajouter une récompense</button>
      </div>
    </div>
  `;

  return html;
}

function bindRewardEvents() {
  const child = activeChild();
  if (!child) return;

  document.querySelectorAll('[data-reward-field]').forEach(input => {
    input.addEventListener('change', event => {
      const id = parseInt(event.target.dataset.rewardId, 10);
      const field = event.target.dataset.rewardField;

      const reward = child.rewards.find(item => item.id === id);
      if (!reward) return;

      let value = event.target.value;

      if (field === 'cost') {
        value = Math.max(1, Math.min(999, parseInt(value, 10) || 1));
        event.target.value = value;
      }

      reward[field] = value;

      hydrateLegacyFields(store.state);
      saveState();
    });
  });

  document.querySelectorAll('[data-reward-act]').forEach(button => {
    button.addEventListener('click', () => {
      const id = parseInt(button.dataset.rewardId, 10);
      handleRewardAction(id, button.dataset.rewardAct);
    });
  });
}

function handleRewardAction(id, action) {
  const child = activeChild();
  if (!child) return;

  const index = child.rewards.findIndex(reward => reward.id === id);
  if (index < 0) return;

  const reward = child.rewards[index];

  if (action === 'toggle') {
    reward.active = !reward.active;
  }

  if (action === 'delete') {
    if (!confirm('Supprimer cette récompense ?')) return;
    child.rewards.splice(index, 1);
  }

  if (action === 'claim') {
    if (!reward.active) {
      alert('Cette récompense est désactivée.');
      return;
    }

    if (child.points < reward.cost) {
      alert(`Pas assez de points. Il manque ${reward.cost - child.points} ⭐.`);
      return;
    }

    if (!confirm(`Utiliser ${reward.cost} ⭐ pour : ${reward.name} ?`)) return;

    child.points -= reward.cost;
    reward.claimed = (reward.claimed || 0) + 1;
  }

  hydrateLegacyFields(store.state);
  saveState();
  renderParent();
}

function addRewardFlow() {
  const child = activeChild();
  if (!child) return;

  showModal({
    title: '🎁 Nouvelle récompense',
    message: `
      <label style="text-align:left;display:block">Nom</label>
      <input type="text" id="nr-name" maxlength="40" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px">

      <label style="text-align:left;display:block">Emoji</label>
      <input type="text" id="nr-emoji" maxlength="4" value="🎁" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px;text-align:center">

      <label style="text-align:left;display:block">Coût en points</label>
      <input type="number" id="nr-cost" min="1" max="999" value="30" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px;text-align:center">
    `,
    inputType: null,
    onValidate() {
      const name = document.getElementById('nr-name').value.trim();
      const emoji = document.getElementById('nr-emoji').value.trim() || '🎁';
      const cost = Math.max(
        1,
        Math.min(999, parseInt(document.getElementById('nr-cost').value, 10) || 30)
      );

      if (!name) return 'Donne un nom à la récompense';

      const id = Math.max(0, ...child.rewards.map(reward => reward.id)) + 1;

      child.rewards.push({
        id,
        emoji,
        name,
        cost,
        active: true,
        claimed: 0
      });

      hydrateLegacyFields(store.state);
      saveState();
      renderParent();

      return true;
    }
  });
}

/* =========================================================
   Enfants
   ========================================================= */

function addChildFlow() {
  showModal({
    title: '👧👦 Nouvel enfant',
    message: `
      <label style="text-align:left;display:block">Prénom</label>
      <input type="text" id="nc-name" maxlength="20" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px">

      <label style="text-align:left;display:block">Emoji</label>
      <input type="text" id="nc-emoji" maxlength="4" value="🦸" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px;text-align:center">
    `,
    inputType: null,
    onValidate() {
      const name = document.getElementById('nc-name').value.trim();
      const emoji = document.getElementById('nc-emoji').value.trim() || '🦸';

      if (!name) return 'Donne un prénom';

      addChild({ name, emoji });
      renderParent();

      return true;
    }
  });
}

function editChildFlow(childId) {
  const child = store.state.children.find(item => item.id === childId);
  if (!child) return;

  showModal({
    title: '✏️ Modifier enfant',
    message: `
      <label style="text-align:left;display:block">Prénom</label>
      <input type="text" id="ec-name" maxlength="20" value="${escapeHtml(child.name)}" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px">

      <label style="text-align:left;display:block">Emoji</label>
      <input type="text" id="ec-emoji" maxlength="4" value="${escapeHtml(child.emoji || '🦸')}" style="width:100%;padding:8px;margin:6px 0;border:1px solid #ccc;border-radius:6px;font-size:16px;text-align:center">
    `,
    inputType: null,
    onValidate() {
      const name = document.getElementById('ec-name').value.trim();
      const emoji = document.getElementById('ec-emoji').value.trim() || '🦸';

      if (!name) return 'Donne un prénom';

      updateChild(childId, { name, emoji });
      renderParent();

      return true;
    }
  });
}

function bindChildrenEvents() {
  const addButton = document.getElementById('p-add-child');

  if (addButton) {
    addButton.addEventListener('click', addChildFlow);
  }

  document.querySelectorAll('[data-child-act]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.childAct;
      const childId = button.dataset.childId;

      if (action === 'select') {
        setActiveChild(childId);
        renderParent();
      }

      if (action === 'edit') {
        editChildFlow(childId);
      }

      if (action === 'delete') {
        if (store.state.children.length <= 1) {
          alert('Il faut garder au moins un enfant.');
          return;
        }

        const child = store.state.children.find(item => item.id === childId);

        if (!confirm(`Supprimer ${child?.name || 'cet enfant'} ? Cette action est irréversible.`)) {
          return;
        }

        deleteChild(childId);
        renderParent();
      }
    });
  });
}

/* =========================================================
   Bind global parent
   ========================================================= */

function bindParentEvents() {
  bindChildrenEvents();
  bindRewardEvents();

  document.getElementById('p-save-child').addEventListener('click', () => {
    const child = activeChild();
    if (!child) return;

    child.name = document.getElementById('p-name').value.trim().slice(0, 20) || child.name;
    child.emoji = document.getElementById('p-emoji').value.trim().slice(0, 4) || child.emoji;

    hydrateLegacyFields(store.state);
    saveState();

    flashSaved('p-save-child');
  });

  document.getElementById('p-add-task').addEventListener('click', addTaskFlow);

  document.getElementById('p-reset-missions').addEventListener('click', () => {
    const child = activeChild();
    if (!child) return;

    if (confirm(`Réinitialiser uniquement les missions du jour de ${child.name || 'cet enfant'} ?`)) {
      child.completedToday = [];
      resetPerfectShownToday();

      hydrateLegacyFields(store.state);
      saveState();
      renderParent();
    }
  });

  const addRewardButton = document.getElementById('p-add-reward');

  if (addRewardButton) {
    addRewardButton.addEventListener('click', addRewardFlow);
  }

  const quotaSlider = document.getElementById('p-quota');
  const dropSlider = document.getElementById('p-drop');

  quotaSlider.addEventListener('input', event => {
    document.getElementById('p-quota-val').textContent = event.target.value + '%';
  });

  dropSlider.addEventListener('input', event => {
    document.getElementById('p-drop-val').textContent = event.target.value + '%';
  });

  document.getElementById('p-save-rewards-settings').addEventListener('click', () => {
    const child = activeChild();
    if (!child) return;

    child.settings.perfectQuota = parseInt(quotaSlider.value, 10);
    child.settings.monsterDropRate = parseInt(dropSlider.value, 10);

    hydrateLegacyFields(store.state);
    saveState();

    flashSaved('p-save-rewards-settings');
  });

  document.getElementById('p-reset-collection').addEventListener('click', () => {
    const child = activeChild();
    if (!child) return;

    if (confirm(`Effacer la collection de ${child.name || 'cet enfant'} ?`)) {
      child.monsters = [];

      hydrateLegacyFields(store.state);
      saveState();
      renderParent();
    }
  });

  document.getElementById('p-save-night').addEventListener('click', () => {
    const nightMode = store.state.settings.nightMode;

    nightMode.enabled = document.getElementById('p-nm-enabled').checked;
    nightMode.autoSchedule = document.getElementById('p-nm-auto').checked;
    nightMode.startTime = document.getElementById('p-nm-start').value || '20:30';
    nightMode.endTime = document.getElementById('p-nm-end').value || '06:30';

    store.state.sharedSettings.nightMode = nightMode;

    saveState();
    applyNightMode();

    flashSaved('p-save-night');
  });

  document.getElementById('p-change-pwd').addEventListener('click', () => {
    showSetPasswordModal(() => renderParent());
  });

  const removePasswordButton = document.getElementById('p-remove-pwd');

  if (removePasswordButton) {
    removePasswordButton.addEventListener('click', () => {
      if (!confirm('Supprimer le code ? Tu reviendras au calcul mental.')) return;

      store.state.settings.parentPassword = null;
      store.state.sharedSettings.parentPassword = null;

      saveState();
      renderParent();
    });
  }

  document.getElementById('p-export').addEventListener('click', exportConfig);
  document.getElementById('p-import').addEventListener('click', importConfig);

  document.getElementById('p-reset-child').addEventListener('click', () => {
    const child = activeChild();
    if (!child) return;

    if (!confirm(`Réinitialiser entièrement ${child.name || 'cet enfant'} ?`)) return;
    if (!confirm('Cela effacera missions validées, points, monstres, stats et récompenses personnalisées. Confirmer ?')) return;

    const childId = child.id;
    const childName = child.name;
    const childEmoji = child.emoji;

    const fresh = defaultState().children[0];

    fresh.id = childId;
    fresh.name = childName;
    fresh.emoji = childEmoji;

    const index = store.state.children.findIndex(item => item.id === childId);
    store.state.children[index] = fresh;

    hydrateLegacyFields(store.state);
    saveState();
    renderParent();
  });

  document.getElementById('p-reset-all').addEventListener('click', () => {
    if (!confirm('⚠️ Tout effacer ?')) return;
    if (!confirm('Vraiment ? Cette action est irréversible.')) return;

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

/* =========================================================
   Export / Import
   ========================================================= */

function exportConfig() {
  try {
    hydrateLegacyFields(store.state);

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

        hydrateLegacyFields(store.state);
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

/* =========================================================
   Boutons flottants
   ========================================================= */

export function setupLockButton() {
  const button = document.getElementById('lock-btn');

  if (!button) return;

  button.addEventListener('click', () => {
    soundClick();
    vibrate(40);
    requestParentAccess();
  });
}

export function setupCustomButton() {
  document.getElementById('custom-btn').addEventListener('click', () => {
    soundClick();
    vibrate(20);
    openCustomScreen();
  });
}