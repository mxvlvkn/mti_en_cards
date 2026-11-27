/**
 * Необязательная синхронизация прогресса с Supabase.
 *
 * Модуль подключается только если в config.js заполнены URL и anon key.
 * Библиотека supabase-js грузится с CDN уже после этого — локальный режим
 * не делает ни одного сетевого запроса.
 */

import { CONFIG, SYNC_ENABLED } from './config.js';
import { state, saveNow } from './store.js';

const SUPABASE_ESM = 'https://esm.sh/@supabase/supabase-js@2.45.4';
const PUSH_DEBOUNCE = 1500;
const CHUNK = 400;

let client = null;
let user = null;
let ready = false;
let pulling = false;
let pushTimer = null;

const listeners = new Set();

export function isSyncEnabled() {
  return SYNC_ENABLED;
}

export function isReady() {
  return ready;
}

export function currentUser() {
  return user;
}

export function onSyncChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) {
    try {
      fn(user);
    } catch (error) {
      console.warn(error);
    }
  }
}

export async function initSync() {
  if (!SYNC_ENABLED || client) return user;

  try {
    const mod = await import(SUPABASE_ESM);
    client = mod.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    const { data } = await client.auth.getSession();
    user = data?.session?.user ?? null;

    client.auth.onAuthStateChange((event, session) => {
      user = session?.user ?? null;
      emit();
      if (user && event === 'SIGNED_IN') {
        pullAndMerge().catch((error) => console.warn('[wordly] merge failed', error));
      }
    });

    window.addEventListener('wordly:changed', (event) => {
      if (event.detail?.reason === 'save' && user) schedulePush();
    });

    ready = true;
    if (user) await pullAndMerge();
  } catch (error) {
    console.warn('[wordly] синхронизация недоступна', error);
    ready = false;
  }

  emit();
  return user;
}

export async function signIn(email, password) {
  if (!client) throw new Error('Синхронизация не настроена');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translate(error.message));
  user = data.user ?? null;
  emit();
  await pullAndMerge();
  return user;
}

export async function signUp(email, password) {
  if (!client) throw new Error('Синхронизация не настроена');
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(translate(error.message));
  user = data.session?.user ?? null;
  emit();
  if (user) await pullAndMerge();
  return { user, needsConfirm: !data.session };
}

export async function signOut() {
  if (!client) return;
  await client.auth.signOut();
  user = null;
  emit();
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushNow().catch((error) => console.warn('[wordly] push failed', error));
  }, PUSH_DEBOUNCE);
}

async function pushNow() {
  if (!client || !user) return;
  const rows = Object.entries(state.progress).map(([cardId, entry]) => ({
    user_id: user.id,
    card_id: cardId,
    box: entry.box,
    due_at: new Date(entry.due).toISOString(),
    seen: entry.seen || 0,
    correct: entry.correct || 0,
    wrong: entry.wrong || 0,
    updated_at: new Date(entry.u || Date.now()).toISOString()
  }));

  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await client
      .from(CONFIG.tables.progress)
      .upsert(rows.slice(i, i + CHUNK), { onConflict: 'user_id,card_id' });
    if (error) throw error;
  }
}

export async function pullAndMerge() {
  if (!client || !user || pulling) return;
  pulling = true;
  try {
    const { data, error } = await client
      .from(CONFIG.tables.progress)
      .select('card_id, box, due_at, seen, correct, wrong, updated_at');
    if (error) throw error;

    let changed = false;
    for (const row of data || []) {
      const remoteUpdated = Date.parse(row.updated_at) || 0;
      const local = state.progress[row.card_id];
      if (!local || remoteUpdated > (local.u || 0)) {
        state.progress[row.card_id] = {
          box: Number(row.box) || 0,
          due: Date.parse(row.due_at) || Date.now(),
          seen: Number(row.seen) || 0,
          correct: Number(row.correct) || 0,
          wrong: Number(row.wrong) || 0,
          u: remoteUpdated
        };
        changed = true;
      }
    }
    if (changed) saveNow();
    await pushNow();
  } finally {
    pulling = false;
  }
}

function translate(message = '') {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Неверный email или пароль';
  if (lower.includes('email not confirmed')) return 'Подтвердите email — письмо уже отправлено';
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'Такой email уже зарегистрирован';
  }
  if (lower.includes('password should be') || lower.includes('password must be')) {
    return 'Слишком короткий пароль (минимум 6 символов)';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Слишком много попыток, подождите минуту';
  }
  if (lower.includes('fetch')) return 'Нет связи с сервером';
  return message;
}
