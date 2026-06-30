import {
  store,
  saveState,
  activeChild,
  hydrateLegacyFields
} from './state.js';

import { showScreen, vibrate } from './helpers.js';

import {
  soundClick,
  soundValid,
  soundFail,
  soundAlarm
} from './audio.js';

import {
  drawReward,
  showConfetti,
  showMonsterReveal,
  checkPerfectDay
} from './rewards.js';

import { renderHome } from './ui-home.js';

let currentTaskId = null;
let timerInterval = null;
let timerRemaining = 0;
let timerTotal = 0;
let timerRunning = false;
let wakeLock = null;

export function isTimerRunning() {
  return timerRunning;
}

export function hasWakeLock() {
  return !!wakeLock;
}

export async function acquireWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');

      wakeLock.addEventListener('release', () => {
        if (timerRunning) acquireWakeLock();
      });
    }
  } catch (e) {}
}

export function releaseWakeLock() {
  try {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  } catch (e) {}
}

export function openTimer(taskId) {
  const child = activeChild();
  if (!child) return;

  currentTaskId = taskId;

  const task = child.tasks.find(item => item.id === taskId);
  if (!task) return;

  document.getElementById('timer-emoji').textContent = task.emoji;
  document.getElementById('timer-title').textContent = task.name;

  timerTotal = task.duration * 60;
  timerRemaining = timerTotal;
  timerRunning = false;

  updateTimerDisplay();

  document.getElementById('timer-go').classList.remove('hidden');
  document.getElementById('timer-pair').classList.remove('active');

  showScreen('screen-timer');
}

export function updateTimerDisplay() {
  const minutes = Math.floor(timerRemaining / 60);
  const seconds = timerRemaining % 60;

  document.getElementById('timer-display').textContent =
    minutes + ':' + String(seconds).padStart(2, '0');

  const circle = document.getElementById('timer-fg');
  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  circle.setAttribute('stroke-dasharray', circumference);

  const ratio = timerTotal > 0 ? timerRemaining / timerTotal : 0;
  circle.setAttribute('stroke-dashoffset', circumference * (1 - ratio));

  let color = '#fff';

  if (timerRunning) {
    if (timerRemaining <= 60) color = '#e74c3c';
    else if (ratio < 0.5) color = '#fdcb6e';
    else color = '#2ecc71';
  }

  circle.style.stroke = color;
}

export function adjustTimer(delta) {
  if (timerRunning) return;

  const newSeconds = Math.max(
    60,
    Math.min(30 * 60, timerTotal + delta * 60)
  );

  timerTotal = newSeconds;
  timerRemaining = newSeconds;

  updateTimerDisplay();
  soundClick();
  vibrate(15);
}

export function startTimer() {
  if (timerRunning) return;

  timerRunning = true;

  acquireWakeLock();
  soundClick();
  vibrate(30);

  document.getElementById('timer-go').classList.add('hidden');
  document.getElementById('timer-pair').classList.add('active');

  timerInterval = setInterval(() => {
    timerRemaining--;

    if (timerRemaining <= 0) {
      timerRemaining = 0;
      stopTimer();

      vibrate([400, 200, 400, 200, 400, 200, 800]);
      soundAlarm();
      updateTimerDisplay();

      return;
    }

    if (timerRemaining === 60) vibrate(50);

    updateTimerDisplay();
  }, 1000);
}

export function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  timerRunning = false;
  releaseWakeLock();
}

export function exitTimer() {
  stopTimer();
  showScreen('screen-home');
  renderHome();
}

export function succeedTask() {
  stopTimer();

  const child = activeChild();
  if (!child) return;

  const taskId = currentTaskId;
  if (taskId == null) return;

  if (!child.completedToday.includes(taskId)) {
    child.completedToday.push(taskId);
    child.stats.totalCompleted++;
    child.points += 10;
  }

  hydrateLegacyFields(store.state);

  vibrate([100, 50, 100, 50, 200]);
  soundValid();
  showConfetti();

  const reward = drawReward();

  hydrateLegacyFields(store.state);
  saveState();

  setTimeout(() => {
    if (reward) {
      showMonsterReveal(reward);
    } else {
      checkPerfectDay();
      showScreen('screen-home');
      renderHome();
    }
  }, 1400);
}

export function failTask() {
  stopTimer();

  const child = activeChild();
  if (!child) return;

  child.stats.failedAttempts = (child.stats.failedAttempts || 0) + 1;
  child.points += 1;

  hydrateLegacyFields(store.state);
  saveState();

  vibrate([50, 30, 50]);
  soundFail();

  setTimeout(() => {
    showScreen('screen-home');
    renderHome();
  }, 700);
}