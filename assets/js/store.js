/**
 * Хранилище прогресса и упрощённый SRS (интервальные повторения).
 *
 * Коробки 0..5. Ответ «знаю» поднимает карточку на коробку выше,
 * «не знаю» возвращает в нулевую. Интервалы растут: 10 минут, 1, 2, 4, 8, 16 дней.
 */

const STORAGE_KEY = 'wordly.v1';

const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/** Интервал до следующего показа для каждой коробки (в днях). */
export const INTERVALS = [10 * MINUTE, 1 * DAY, 2 * DAY, 4 * DAY, 8 * DAY, 16 * DAY];

const MAX_BOX = 5;

const DEFAULT_SETTINGS = {
  theme: 'auto',
  direction: 'en-ru',
  dailyGoal: 20,
  autoSpeak: false
};

function freshState() {
  return {
    v: 1,
    createdAt: Date.now(),
    settings: { ...DEFAULT_SETTINGS },
    progress: {},
    days: {}
  };
}

function safeParse(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.progress) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadState() {
  const base = freshState();
  let stored = null;
  try {
    stored = safeParse(localStorage.getItem(STORAGE_KEY));
  } catch {
    stored = null;
  }
  if (!stored) return base;

  return {
    ...base,
    ...stored,
    settings: { ...DEFAULT_SETTINGS, ...(stored.settings || {}) },
    progress: stored.progress || {},
    days: stored.days || {}
  };
}

export const state = loadState();

let saveTimer = null;

export function save({ silent = false } = {}) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persist();
    if (!silent) {
      window.dispatchEvent(new CustomEvent('wordly:changed', { detail: { reason: 'save' } }));
    }
  }, 0);
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Не удалось сохранить прогресс локально', error);
  }
}

export function saveNow() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  persist();
}

/** Дата в локальном часовом поясе: YYYY-MM-DD. */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftDay(date, delta) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + delta);
  return copy;
}

export function getProgress(cardId) {
  return state.progress[cardId] || null;
}

export function isDue(cardId, now = Date.now()) {
  const entry = state.progress[cardId];
  if (!entry) return true;
  return entry.due <= now;
}

/**
 * Оценка карточки. known=true — «знаю», false — «не знаю».
 * Возвращает обновлённую запись прогресса.
 */
export function rateCard(cardId, known) {
  const now = Date.now();
  const entry = state.progress[cardId] || {
    box: 0,
    due: now,
    seen: 0,
    correct: 0,
    wrong: 0,
    u: now
  };

  entry.seen += 1;
  if (known) {
    entry.correct += 1;
    entry.box = Math.min(entry.box + 1, MAX_BOX);
  } else {
    entry.wrong += 1;
    entry.box = 0;
  }
  entry.due = now + INTERVALS[entry.box];
  entry.last = now;
  entry.u = now;

  state.progress[cardId] = entry;

  const key = dayKey(new Date(now));
  const day = state.days[key] || (state.days[key] = { r: 0, c: 0 });
  day.r += 1;
  if (known) day.c += 1;

  save();
  return entry;
}

/** Сколько карточек готово к повторению (без новых). */
export function countDue(cards, now = Date.now()) {
  return cards.reduce((sum, card) => {
    const entry = state.progress[card.id];
    return entry && entry.due <= now ? sum + 1 : sum;
  }, 0);
}

export function countNew(cards) {
  return cards.reduce((sum, card) => (state.progress[card.id] ? sum : sum + 1), 0);
}

/**
 * Собирает очередь на занятие: сначала просроченные, затем новые.
 * Если всего меньше лимита — добирает карточки «на будущее» (по возрастанию due).
 */
export function buildQueue(cards, { limit = 20, includeAhead = false, now = Date.now() } = {}) {
  const due = [];
  const fresh = [];
  const ahead = [];

  for (const card of cards) {
    const entry = state.progress[card.id];
    if (!entry) fresh.push(card);
    else if (entry.due <= now) due.push({ card, due: entry.due });
    else ahead.push({ card, due: entry.due });
  }

  due.sort((a, b) => a.due - b.due);
  ahead.sort((a, b) => a.due - b.due);

  const queue = due.map((item) => item.card).slice(0, limit);
  for (const card of fresh) {
    if (queue.length >= limit) break;
    queue.push(card);
  }
  if (includeAhead) {
    for (const item of ahead) {
      if (queue.length >= limit) break;
      queue.push(item.card);
    }
  }
  return queue;
}

export function reviewsToday() {
  const day = state.days[dayKey()];
  return day ? day.r : 0;
}

export function correctToday() {
  const day = state.days[dayKey()];
  return day ? day.c : 0;
}

/** Длина серии: сегодня или вчера были повторения. */
export function streak() {
  const today = new Date();
  let cursor = today;
  if (!state.days[dayKey(today)]) {
    cursor = shiftDay(today, -1);
    if (!state.days[dayKey(cursor)]) return 0;
  }
  let count = 0;
  while (state.days[dayKey(cursor)] && state.days[dayKey(cursor)].r > 0) {
    count += 1;
    cursor = shiftDay(cursor, -1);
  }
  return count;
}

export function cardStatus(cardId) {
  const entry = state.progress[cardId];
  if (!entry) return 'new';
  return entry.box >= 3 ? 'known' : 'learning';
}

export function deckStats(deck) {
  let learned = 0;
  let learning = 0;
  let due = 0;
  const now = Date.now();
  for (const card of deck.cards) {
    const entry = state.progress[card.id];
    if (!entry) continue;
    if (entry.box >= 3) learned += 1;
    else learning += 1;
    if (entry.due <= now) due += 1;
  }
  const total = deck.cards.length;
  return {
    total,
    learned,
    learning,
    fresh: total - learned - learning,
    due,
    pct: total ? Math.round((learned / total) * 100) : 0
  };
}

export function globalStats() {
  let learned = 0;
  let learning = 0;
  let reviews = 0;
  let correct = 0;
  let wrong = 0;
  for (const entry of Object.values(state.progress)) {
    if (entry.box >= 3) learned += 1;
    else learning += 1;
    reviews += entry.seen || 0;
    correct += entry.correct || 0;
    wrong += entry.wrong || 0;
  }
  const answered = correct + wrong;
  return {
    learned,
    learning,
    fresh: Math.max(0, (Object.keys(state.progress).length ? 0 : 0)),
    reviews,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    answered
  };
}

/** Последние N дней для мини-графика: [{ key, label, count, isToday }] */
export function recentDays(n = 7) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const date = shiftDay(today, -i);
    const key = dayKey(date);
    out.push({
      key,
      label: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
      count: state.days[key]?.r || 0,
      isToday: i === 0
    });
  }
  return out;
}

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  save();
  return state.settings;
}

export function resetProgress() {
  state.progress = {};
  state.days = {};
  save();
}

export function exportProgress() {
  return {
    app: 'mtien',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    progress: state.progress,
    days: state.days
  };
}

export function importProgress(payload) {
  if (!payload || typeof payload !== 'object' || !payload.progress) {
    throw new Error('Файл не похож на резервную копию MTIEN');
  }
  const progress = {};
  for (const [cardId, entry] of Object.entries(payload.progress)) {
    if (!entry || typeof entry !== 'object') continue;
    progress[cardId] = {
      box: clampInt(entry.box, 0, MAX_BOX, 0),
      due: Number(entry.due) || Date.now(),
      seen: Math.max(0, Number(entry.seen) || 0),
      correct: Math.max(0, Number(entry.correct) || 0),
      wrong: Math.max(0, Number(entry.wrong) || 0),
      last: Number(entry.last) || 0,
      u: Number(entry.u) || Date.now()
    };
  }
  state.progress = progress;
  state.days = payload.days && typeof payload.days === 'object' ? payload.days : {};
  if (payload.settings) state.settings = { ...state.settings, ...payload.settings };
  save();
}

function clampInt(value, min, max, fallback) {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}
