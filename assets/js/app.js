import {
  ALL_CARDS,
  DECKS,
  getDeck,
  deckCards,
  getCard
} from './data.js';
import * as store from './store.js';
import {
  isSyncEnabled,
  initSync,
  onSyncChange,
  currentUser,
  signIn,
  signUp,
  signOut
} from './sync.js';

/* ------------------------------------------------------------------ */
/* Утилиты                                                             */
/* ------------------------------------------------------------------ */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);

const icon = (name, className = '') =>
  `<svg${className ? ` class="${className}"` : ''} aria-hidden="true"><use href="#${name}"/></svg>`;

function plural(n, forms) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function todayLabel() {
  return new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

let cleanups = [];
function onCleanup(fn) {
  cleanups.push(fn);
}
function runCleanups() {
  for (const fn of cleanups) {
    try {
      fn();
    } catch (error) {
      console.warn(error);
    }
  }
  cleanups = [];
}

function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

/* ------------------------------------------------------------------ */
/* Тема                                                                */
/* ------------------------------------------------------------------ */

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function resolvedTheme() {
  const setting = store.state.settings.theme;
  if (setting === 'dark' || setting === 'light') return setting;
  return darkQuery.matches ? 'dark' : 'light';
}

function applyTheme() {
  const theme = resolvedTheme();
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  $$('[data-theme-icon] use').forEach((node) => {
    node.setAttribute('href', dark ? '#i-sun' : '#i-moon');
  });
  $$('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
  });
}

darkQuery.addEventListener('change', () => {
  if (store.state.settings.theme === 'auto') applyTheme();
});

/* ------------------------------------------------------------------ */
/* Звук                                                                */
/* ------------------------------------------------------------------ */

function canSpeak() {
  return 'speechSynthesis' in window;
}

function speak(text) {
  if (!canSpeak() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.92;
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((item) => item.lang === 'en-GB') ||
      voices.find((item) => item.lang === 'en-US') ||
      voices.find((item) => item.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn(error);
  }
}

/* ------------------------------------------------------------------ */
/* Тосты и модальные окна                                              */
/* ------------------------------------------------------------------ */

function toast(message, iconName = 'i-check') {
  const root = $('#toast-root');
  if (!root) return;
  const node = document.createElement('div');
  node.className = 'toast';
  node.innerHTML = `${icon(iconName)}<span>${esc(message)}</span>`;
  root.appendChild(node);
  setTimeout(() => {
    node.classList.add('is-out');
    setTimeout(() => node.remove(), 220);
  }, 2600);
}

function openModal({ title, body = '', actions = '' }) {
  const root = $('#modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
      <h2 id="modal-title">${title}</h2>
      ${body}
      ${actions ? `<div class="modal-actions">${actions}</div>` : ''}
    </div>`;
  root.classList.add('is-open');
  const modal = $('.modal', root);
  modal.focus({ preventScroll: true });
  modal.addEventListener('click', (event) => {
    if (event.target.closest('[data-close]')) closeModal();
  });
  return modal;
}

function closeModal() {
  const root = $('#modal-root');
  root.classList.remove('is-open');
  root.innerHTML = '';
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});

/* ------------------------------------------------------------------ */
/* Шапка / навигация                                                   */
/* ------------------------------------------------------------------ */

function syncChrome() {
  const streak = store.streak();
  $$('[data-streak]').forEach((node) => {
    node.textContent = String(streak);
  });
  $$('[data-streak-label]').forEach((node) => {
    node.textContent = plural(streak, ['день подряд', 'дня подряд', 'дней подряд']);
  });

  const user = currentUser();
  const name = user?.email ? user.email.split('@')[0] : 'Гость';
  const initial = name.trim().charAt(0).toUpperCase() || 'Г';

  $$('[data-user-name]').forEach((node) => {
    node.textContent = name;
  });
  $$('[data-avatar]').forEach((node) => {
    node.textContent = initial;
  });
  $$('[data-user-state]').forEach((node) => {
    node.textContent = user ? 'синхронизация включена' : 'локальный режим';
  });
}

function setActiveNav(name) {
  $$('[data-nav]').forEach((node) => {
    node.classList.toggle('is-active', node.dataset.nav === name);
  });
}

/* ------------------------------------------------------------------ */
/* Роутер                                                              */
/* ------------------------------------------------------------------ */

const routes = [
  { re: /^\/?$/, nav: 'home', view: viewHome },
  { re: /^\/deck\/([\w-]+)$/, nav: 'home', view: viewDeck },
  { re: /^\/study\/([\w-]+)$/, nav: 'home', view: viewStudy },
  { re: /^\/quiz(?:\/([\w-]+))?$/, nav: 'quiz', view: viewQuiz },
  { re: /^\/stats$/, nav: 'stats', view: viewStats },
  { re: /^\/settings$/, nav: 'settings', view: viewSettings }
];

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, queryString = ''] = raw.split('?');
  return { path: path || '/', query: new URLSearchParams(queryString) };
}

/** Supabase после подтверждения email возвращает токены в hash — не показываем 404. */
function isAuthRedirect() {
  return /(?:^|[#&])(access_token|refresh_token|error_description|error_code)=/.test(location.hash);
}

function render() {
  runCleanups();
  const { path, query } = parseHash();
  const route = routes.find((item) => item.re.test(path));
  const view = $('#view');
  setActiveNav(route?.nav || 'home');

  if (isAuthRedirect()) {
    if (!isSyncEnabled()) {
      history.replaceState(null, '', `${location.pathname}${location.search}#/`);
      render();
      return;
    }
    view.innerHTML = `
      <div class="empty">
        ${icon('i-info')}
        <h3>Завершаем вход…</h3>
        <p>Ещё секунда — и вы вернётесь к карточкам.</p>
      </div>`;
    setTimeout(() => {
      if (!isAuthRedirect()) return;
      history.replaceState(null, '', `${location.pathname}${location.search}#/`);
      render();
    }, 4000);
    return;
  }

  if (!route) {
    view.innerHTML = `
      <div class="empty">
        ${icon('i-info')}
        <h3>Страница не найдена</h3>
        <p>Возможно, ссылка устарела.</p>
        <a class="btn btn-primary" href="#/">На главную</a>
      </div>`;
    return;
  }

  const params = route.re.exec(path)?.slice(1) || [];
  view.innerHTML = '';
  route.view(view, params, query);
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------------ */
/* Главная                                                             */
/* ------------------------------------------------------------------ */

function viewHome(view) {
  const now = Date.now();
  const due = store.countDue(ALL_CARDS, now);
  const fresh = store.countNew(ALL_CARDS);
  const today = store.reviewsToday();
  const goal = store.state.settings.dailyGoal || 20;
  const pct = Math.min(100, Math.round((today / goal) * 100));
  const global = store.globalStats();
  const streak = store.streak();
  const days = store.recentDays(7);

  let title;
  let subtitle;
  if (due > 0) {
    title = `${due} ${plural(due, ['карточка', 'карточки', 'карточек'])} к повторению`;
    subtitle = 'Повторите их сейчас — это займёт пару минут и удержит слова в памяти.';
  } else if (fresh > 0) {
    title = 'Пора учить новые слова';
    subtitle = `В колодах ещё ${fresh} ${plural(fresh, ['новое слово', 'новых слова', 'новых слов'])}. Начните с любого набора.`;
  } else {
    title = 'На сегодня всё готово';
    subtitle = 'Все карточки повторены. Можно закрепить материал тестом или добавить свои слова.';
  }

  const ringLength = 2 * Math.PI * 52;

  view.innerHTML = `
    <div class="page-head">
      <div>
        <p class="eyebrow">${esc(greeting())} · ${esc(todayLabel())}</p>
        <h1 class="page-title">Английский по карточкам</h1>
      </div>
    </div>

    <section class="daily" aria-label="Задача на сегодня">
      <div>
        <h2>${esc(title)}</h2>
        <p>${esc(subtitle)}</p>
        <div class="daily-actions">
          <a class="btn btn-primary btn-lg" href="#/study/all">${icon('i-play')}Учить</a>
          <a class="btn btn-ghost btn-lg" href="#/quiz">${icon('i-bolt')}Тест</a>
        </div>
      </div>
      <div class="ring" role="img" aria-label="Цель дня выполнена на ${pct}%">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle class="ring-bg" cx="60" cy="60" r="52"></circle>
          <circle class="ring-fg" cx="60" cy="60" r="52"
            stroke-dasharray="${ringLength.toFixed(1)}"
            stroke-dashoffset="${(ringLength * (1 - pct / 100)).toFixed(1)}"></circle>
        </svg>
        <div class="ring-label">
          <strong>${pct}%</strong>
          <small>${today} из ${goal}</small>
        </div>
      </div>
    </section>

    <div class="stat-row">
      <div class="stat-pill"><strong>${streak}</strong><small>${plural(streak, ['день подряд', 'дня подряд', 'дней подряд'])}</small></div>
      <div class="stat-pill"><strong>${global.learned} / ${ALL_CARDS.length}</strong><small>выучено</small></div>
      <div class="stat-pill"><strong>${global.accuracy}%</strong><small>точность ответов</small></div>
    </div>

    <h2 class="section-title">Колоды <a href="#/stats">прогресс ${icon('i-arrow')}</a></h2>
    <div class="deck-grid">
      ${DECKS.map((deck) => deckCard(deck)).join('')}
    </div>

    <h2 class="section-title">Последние 7 дней</h2>
    <div class="week">
      ${days
        .map((day) => {
          const classes = ['day'];
          if (day.count > 0) classes.push('is-done');
          if (day.count >= 10) classes.push('is-strong');
          if (day.isToday) classes.push('is-today');
          return `<div class="${classes.join(' ')}">
            <span>${esc(day.label)}</span>
            <i>${day.count || ''}</i>
          </div>`;
        })
        .join('')}
    </div>
  `;
}

function deckCard(deck) {
  const stats = store.deckStats(deck);
  return `
    <a class="deck-card" href="#/deck/${deck.id}" style="--deck:${deck.color}">
      <div class="deck-top">
        <span class="deck-icon">${icon(deck.icon)}</span>
        <span class="deck-level">${esc(deck.level)}</span>
      </div>
      <div>
        <h3>${esc(deck.title)}</h3>
        <p>${esc(deck.subtitle)}</p>
      </div>
      <div class="bar"><i style="width:${stats.pct}%"></i></div>
      <div class="deck-meta">
        <span><b>${stats.learned}</b> / ${stats.total} слов</span>
        <span>${stats.due ? `${stats.due} к повтору` : '—'}</span>
      </div>
    </a>`;
}

/* ------------------------------------------------------------------ */
/* Колода                                                              */
/* ------------------------------------------------------------------ */

function viewDeck(view, params) {
  const deck = getDeck(params[0]);
  if (!deck) {
    view.innerHTML = notFound();
    return;
  }
  const cards = deckCards(deck.id);
  const stats = store.deckStats(deck);

  view.innerHTML = `
    <a class="back-link" href="#/">${icon('i-back')}Все колоды</a>
    <div class="deck-hero" style="--deck:${deck.color}">
      <span class="deck-icon">${icon(deck.icon)}</span>
      <div>
        <h1>${esc(deck.title)}</h1>
        <p class="page-sub">${esc(deck.subtitle)} · уровень ${esc(deck.level)} · ${cards.length} ${plural(cards.length, ['карточка', 'карточки', 'карточек'])}</p>
      </div>
      <div class="deck-actions">
        <a class="btn btn-primary" href="#/study/${deck.id}">${icon('i-play')}Учить</a>
        <a class="btn btn-ghost" href="#/quiz/${deck.id}">${icon('i-bolt')}Тест</a>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Освоено ${stats.pct}%</h2>
        <span>${stats.learned} из ${stats.total} · к повтору ${stats.due}</span>
      </div>
      <div class="bar"><i style="width:${stats.pct}%"></i></div>
    </div>

    <label class="field" for="word-search">
      ${icon('i-search')}
      <input id="word-search" type="search" placeholder="Найти слово или перевод" autocomplete="off">
    </label>

    <div class="word-list" id="word-list"></div>
  `;

  const list = $('#word-list', view);
  const input = $('#word-search', view);

  const row = (card) => {
    const status = store.cardStatus(card.id);
    const label = status === 'known' ? 'Знаю' : status === 'learning' ? 'Учу' : 'Новое';
    return `
      <div class="word-row" data-say="${esc(card.en)}">
        <div class="word-main">
          <div class="word-en">${esc(card.en)}${card.ipa ? ` <span class="word-ipa">/${esc(card.ipa)}/</span>` : ''}</div>
          <div class="word-ru">${esc(card.ru)}</div>
        </div>
        <span class="chip is-${status}">${label}</span>
      </div>`;
  };

  const paint = (filter = '') => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle
      ? cards.filter(
          (card) =>
            card.en.toLowerCase().includes(needle) || card.ru.toLowerCase().includes(needle)
        )
      : cards;
    list.innerHTML = filtered.length
      ? filtered.map(row).join('')
      : `<div class="empty" style="border:0;padding:32px 16px">
           <h3>Ничего не найдено</h3>
           <p>Попробуйте другое слово.</p>
         </div>`;
  };

  paint();
  input.addEventListener('input', () => paint(input.value));

  list.addEventListener('click', (event) => {
    const rowNode = event.target.closest('[data-say]');
    if (!rowNode) return;
    speak(rowNode.dataset.say);
  });
}

/* ------------------------------------------------------------------ */
/* Обучение                                                            */
/* ------------------------------------------------------------------ */

function viewStudy(view, params, query) {
  const deckId = params[0];
  const deck = deckId === 'all' ? null : getDeck(deckId);
  if (deckId !== 'all' && !deck) {
    view.innerHTML = notFound();
    return;
  }

  const cards = deck ? deckCards(deck.id) : ALL_CARDS;
  const backHref = deck ? `#/deck/${deck.id}` : '#/';
  const title = deck ? deck.title : 'Все колоды';
  const practice = query.has('practice');
  const limit = practice
    ? cards.length
    : Math.min(cards.length, Math.max(10, store.state.settings.dailyGoal || 20));
  const queue = store.buildQueue(cards, { limit, includeAhead: practice });

  if (!queue.length) {
    renderSessionEmpty(view, { deckId, backHref, title });
    return;
  }

  const direction = store.state.settings.direction;
  const isEnFront = direction !== 'ru-en';
  const results = [];
  let index = 0;
  let flipped = false;
  let busy = false;

  const progressPercent = () => Math.round((index / queue.length) * 100);

  view.innerHTML = `
    <div class="study">
      <div class="study-top">
        <a class="icon-btn" href="${backHref}" aria-label="Назад">${icon('i-back')}</a>
        <div class="study-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="study-bar">
          <i style="width:0%"></i>
        </div>
        <span class="study-deck">${esc(title)}</span>
        <span class="study-counter" id="study-counter" aria-live="polite">1 / ${queue.length}</span>
      </div>

      <div class="fc-wrap" id="fc-wrap">
        <div class="flashcard" id="flashcard" role="button" tabindex="0" aria-label="Карточка. Нажмите, чтобы перевернуть">
          <div class="fc-inner">
            <div class="fc-face fc-front">
              <button class="icon-btn fc-audio" type="button" data-say aria-label="Произнести слово">${icon('i-volume')}</button>
              <span class="fc-pos" data-pos hidden></span>
              <h2 class="fc-word" data-word></h2>
              <span class="fc-ipa" data-ipa></span>
              <span class="fc-hint">${icon('i-info')}Нажмите, чтобы увидеть перевод</span>
              <span class="fc-swipe-hint left">Не знаю</span>
              <span class="fc-swipe-hint right">Знаю</span>
            </div>
            <div class="fc-face fc-back">
              <h2 class="fc-translation" data-translation></h2>
              <span class="fc-ipa" data-back-ipa></span>
              <p class="fc-example" data-example></p>
              <p class="fc-example-ru" data-example-ru></p>
            </div>
          </div>
        </div>
      </div>

      <div class="rate-row">
        <button class="btn btn-again" type="button" data-rate="0" hidden>${icon('i-x')}Не знаю</button>
        <button class="btn btn-know" type="button" data-rate="1" hidden>${icon('i-check')}Знаю</button>
        <button class="btn btn-primary btn-lg btn-reveal" type="button" data-reveal>Показать ответ</button>
      </div>

      <div class="kbd-row">
        <span><kbd>Пробел</kbd> перевернуть</span>
        <span><kbd>1</kbd> не знаю</span>
        <span><kbd>2</kbd> знаю</span>
      </div>
    </div>
  `;

  const flashcard = $('#flashcard', view);
  const wrap = $('#fc-wrap', view);
  const counter = $('#study-counter', view);
  const bar = $('#study-bar', view);
  const barFill = $('i', bar);
  const revealButton = $('[data-reveal]', view);
  const againButton = $('[data-rate="0"]', view);
  const knowButton = $('[data-rate="1"]', view);

  const frontWord = $('[data-word]', view);
  const frontIpa = $('[data-ipa]', view);
  const frontPos = $('[data-pos]', view);
  const backTranslation = $('[data-translation]', view);
  const backIpa = $('[data-back-ipa]', view);
  const example = $('[data-example]', view);
  const exampleRu = $('[data-example-ru]', view);
  const sayButton = $('[data-say]', view);

  function currentCard() {
    return queue[index];
  }

  function paintCard() {
    const card = currentCard();
    flipped = false;
    busy = false;
    flashcard.classList.remove('is-flipped');
    flashcard.setAttribute('aria-label', 'Карточка. Нажмите, чтобы перевернуть');

    frontWord.textContent = isEnFront ? card.en : card.ru;
    frontPos.textContent = card.pos || '';
    frontPos.hidden = !card.pos;
    frontIpa.textContent = isEnFront && card.ipa ? `/${card.ipa}/` : '';
    frontIpa.hidden = !(isEnFront && card.ipa);
    sayButton.hidden = !isEnFront;

    backTranslation.textContent = isEnFront ? card.ru : card.en;
    backIpa.textContent = !isEnFront && card.ipa ? `/${card.ipa}/` : '';
    backIpa.hidden = !(!isEnFront && card.ipa);
    example.textContent = card.example || '';
    example.hidden = !card.example;
    exampleRu.textContent = card.exampleRu || '';
    exampleRu.hidden = !card.exampleRu;

    revealButton.hidden = false;
    againButton.hidden = true;
    knowButton.hidden = true;

    counter.textContent = `${index + 1} / ${queue.length}`;
    bar.setAttribute('aria-valuenow', String(progressPercent()));
    barFill.style.width = `${progressPercent()}%`;

    wrap.classList.remove('is-enter');
    void wrap.offsetWidth;
    wrap.classList.add('is-enter');

    if (store.state.settings.autoSpeak && isEnFront) {
      setTimeout(() => speak(card.en), 220);
    }
  }

  function flip() {
    if (flipped || busy) return;
    flipped = true;
    flashcard.classList.add('is-flipped');
    flashcard.setAttribute('aria-label', 'Перевод показан. Оцените, знали ли вы слово');
    revealButton.hidden = true;
    againButton.hidden = false;
    knowButton.hidden = false;
    if (!isEnFront) setTimeout(() => speak(currentCard().en), 200);
  }

  function rate(known) {
    if (busy) return;
    if (!flipped) {
      flip();
      return;
    }
    busy = true;
    const card = currentCard();
    store.rateCard(card.id, known);
    results.push(known);

    wrap.style.transition = 'opacity .16s ease, transform .16s ease';
    wrap.style.opacity = '0';
    wrap.style.transform = `translateX(${known ? 28 : -28}px)`;

    setTimeout(() => {
      index += 1;
      if (index >= queue.length) {
        finish();
        return;
      }
      paintCard();
      wrap.style.transition = 'none';
      wrap.style.opacity = '1';
      wrap.style.transform = '';
      requestAnimationFrame(() => {
        wrap.style.transition = '';
      });
    }, 160);
  }

  function finish() {
    const known = results.filter(Boolean).length;
    const total = results.length;
    const accuracy = total ? Math.round((known / total) * 100) : 0;
    const deckQuery = deck ? deck.id : 'all';
    const headline = accuracy >= 80 ? 'Отличная работа' : accuracy >= 50 ? 'Неплохой подход' : 'Слова ещё в работе';
    const text =
      accuracy >= 80
        ? `Вы уверенно прошли ${total} ${plural(total, ['карточку', 'карточки', 'карточек'])}. Следующая партия появится по расписанию.`
        : `Вы прошли ${total} ${plural(total, ['карточку', 'карточки', 'карточек'])}. Сложные слова вернутся уже через несколько минут.`;

    view.innerHTML = `
      <div class="study">
        <div class="study-summary">
          <div class="summary-mark">${icon('i-check')}</div>
          <h1>${headline}</h1>
          <p>${text}</p>
          <div class="summary-grid">
            <div><strong>${known}</strong><small>знаю</small></div>
            <div><strong>${total - known}</strong><small>повторить</small></div>
            <div><strong>${accuracy}%</strong><small>точность</small></div>
          </div>
          <div class="summary-actions">
            <button class="btn btn-primary btn-lg" type="button" id="again-btn">Ещё подход</button>
            <a class="btn btn-ghost" href="#/quiz/${deckQuery}">Пройти тест</a>
            <a class="btn btn-ghost" href="#/">На главную</a>
          </div>
        </div>
      </div>`;

    $('#again-btn', view)?.addEventListener('click', () => {
      navigate(`#/study/${deckQuery}?practice=1`);
    });
    syncChrome();
  }

  revealButton.addEventListener('click', (event) => {
    event.stopPropagation();
    flip();
  });
  againButton.addEventListener('click', () => rate(false));
  knowButton.addEventListener('click', () => rate(true));
  sayButton.addEventListener('click', (event) => {
    event.stopPropagation();
    speak(currentCard().en);
  });

  flashcard.addEventListener('click', (event) => {
    if (event.target.closest('[data-say]')) return;
    flip();
  });
  flashcard.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      flip();
    }
  });

  /* Свайпы: влево — «не знаю», вправо — «знаю» (после переворота). */
  let startX = 0;
  let startY = 0;
  let tracking = false;

  flashcard.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') return;
    tracking = true;
    startX = event.clientX;
    startY = event.clientY;
  });

  flashcard.addEventListener('pointermove', (event) => {
    if (!tracking || !flipped) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) < Math.abs(dy)) return;
    flashcard.style.transform = `translateX(${dx * 0.35}px)`;
  });

  const endSwipe = (event) => {
    if (!tracking) return;
    tracking = false;
    flashcard.style.transform = '';
    if (!flipped) return;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 80) rate(dx > 0);
  };

  flashcard.addEventListener('pointerup', endSwipe);
  flashcard.addEventListener('pointercancel', () => {
    tracking = false;
    flashcard.style.transform = '';
  });

  const onKey = (event) => {
    if (event.target.closest('input, textarea, select')) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      flip();
      return;
    }
    if (event.key === '1') {
      event.preventDefault();
      rate(false);
      return;
    }
    if (event.key === '2') {
      event.preventDefault();
      rate(true);
      return;
    }
    if (event.key === 'ArrowLeft' && flipped) {
      event.preventDefault();
      rate(false);
    }
    if (event.key === 'ArrowRight' && flipped) {
      event.preventDefault();
      rate(true);
    }
  };

  window.addEventListener('keydown', onKey);
  onCleanup(() => window.removeEventListener('keydown', onKey));

  paintCard();
}

function renderSessionEmpty(view, { deckId, backHref, title }) {
  view.innerHTML = `
    <div class="study">
      <div class="study-summary">
        <div class="summary-mark">${icon('i-check')}</div>
        <h1>На сегодня всё</h1>
        <p>В колоде «${esc(title)}» нет карточек, которые пора повторить. Возвращайтесь позже или потренируйтесь заранее.</p>
        <div class="summary-actions">
          <button class="btn btn-primary btn-lg" type="button" id="practice-btn">Повторить всё равно</button>
          <a class="btn btn-ghost" href="#/quiz/${deckId}">Пройти тест</a>
          <a class="btn btn-ghost" href="${backHref}">Назад</a>
        </div>
      </div>
    </div>`;

  $('#practice-btn', view)?.addEventListener('click', () => {
    navigate(`#/study/${deckId}?practice=1`);
  });
}

/* ------------------------------------------------------------------ */
/* Тест                                                                */
/* ------------------------------------------------------------------ */

function viewQuiz(view, params) {
  const deckId = params[0] || 'all';
  const deck = deckId === 'all' ? null : getDeck(deckId);
  if (deckId !== 'all' && !deck) {
    view.innerHTML = notFound();
    return;
  }

  const pool = deck ? deckCards(deck.id) : ALL_CARDS;
  const questions = shuffle(pool).slice(0, Math.min(10, pool.length));
  const direction = store.state.settings.direction;
  const isEnFront = direction !== 'ru-en';
  const backHref = deck ? `#/deck/${deck.id}` : '#/';

  let index = 0;
  let score = 0;
  let answered = false;
  let timer = null;

  onCleanup(() => clearTimeout(timer));

  view.innerHTML = `<div class="quiz" id="quiz"></div>`;
  const root = $('#quiz', view);

  function finish() {
    const total = questions.length;
    const accuracy = total ? Math.round((score / total) * 100) : 0;
    const headline =
      accuracy >= 80 ? 'Тест пройден отлично' : accuracy >= 50 ? 'Есть над чем поработать' : 'Стоит повторить слова';
    root.innerHTML = `
      <div class="study-summary" style="margin:auto">
        <div class="summary-mark">${icon(accuracy >= 50 ? 'i-check' : 'i-info')}</div>
        <h1>${headline}</h1>
        <p>${score} из ${total} правильных ответов. Ошибки уже вернулись в очередь повторения.</p>
        <div class="summary-grid">
          <div><strong>${score}</strong><small>верно</small></div>
          <div><strong>${total - score}</strong><small>ошибок</small></div>
          <div><strong>${accuracy}%</strong><small>точность</small></div>
        </div>
        <div class="summary-actions">
          <button class="btn btn-primary btn-lg" type="button" id="retry">Ещё тест</button>
          <a class="btn btn-ghost" href="#/study/${deckId}">К карточкам</a>
          <a class="btn btn-ghost" href="#/">На главную</a>
        </div>
      </div>`;
    $('#retry', view)?.addEventListener('click', () => navigate(`#/quiz/${deckId}`));
    syncChrome();
  }

  function paint() {
    if (index >= questions.length) {
      finish();
      return;
    }
    answered = false;
    const card = questions[index];
    const prompt = isEnFront ? card.en : card.ru;
    const correct = isEnFront ? card.ru : card.en;

    const distractors = shuffle(pool.filter((item) => item.id !== card.id))
      .slice(0, 3)
      .map((item) => (isEnFront ? item.ru : item.en))
      .filter((value) => value !== correct);

    const options = shuffle([correct, ...distractors]);
    const ipa = isEnFront && card.ipa ? `/${card.ipa}/` : '';

    root.innerHTML = `
      <div class="study-top">
        <a class="icon-btn" href="${backHref}" aria-label="Назад">${icon('i-back')}</a>
        <div class="study-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round((index / questions.length) * 100)}">
          <i style="width:${Math.round((index / questions.length) * 100)}%"></i>
        </div>
        <span class="study-counter">${index + 1} / ${questions.length}</span>
      </div>
      <div class="quiz-prompt">
        <p class="quiz-question">${isEnFront ? 'Выберите перевод' : 'Выберите слово'}</p>
        <h2 class="fc-word">${esc(prompt)}</h2>
        ${ipa ? `<span class="fc-ipa">${esc(ipa)}</span>` : ''}
      </div>
      <div class="quiz-options" id="options">
        ${options
          .map(
            (option, i) =>
              `<button class="option" type="button" data-option="${esc(option)}" data-i="${i}">${esc(option)}</button>`
          )
          .join('')}
      </div>
      <p class="quiz-feedback" id="feedback" aria-live="polite"></p>
    `;

    const optionButtons = $$('.option', root);
    const feedback = $('#feedback', root);

    optionButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const value = button.dataset.option;
        const ok = value === correct;
        if (ok) score += 1;
        store.rateCard(card.id, ok);

        optionButtons.forEach((item) => {
          item.disabled = true;
          if (item.dataset.option === correct) item.classList.add('is-correct');
          else if (item === button) item.classList.add('is-wrong');
          else item.classList.add('is-dim');
        });

        feedback.textContent = ok ? 'Верно' : `Правильно: ${correct}`;
        feedback.className = `quiz-feedback ${ok ? 'ok' : 'bad'}`;

        timer = setTimeout(() => {
          index += 1;
          paint();
        }, ok ? 750 : 1400);
      });
    });
  }

  paint();
}

/* ------------------------------------------------------------------ */
/* Статистика                                                          */
/* ------------------------------------------------------------------ */

function viewStats(view) {
  const global = store.globalStats();
  const streak = store.streak();
  const total = ALL_CARDS.length;
  const answeredTotal = Object.values(store.state.progress).reduce(
    (sum, entry) => sum + (entry.seen || 0),
    0
  );

  const days = [];
  for (let i = 29; i >= 0; i -= 1) {
    const date = store.shiftDay(new Date(), -i);
    const key = store.dayKey(date);
    const count = store.state.days[key]?.r || 0;
    days.push({ key, date, count });
  }
  const maxCount = Math.max(10, ...days.map((day) => day.count));

  const heatColor = (count) => {
    if (!count) return 'var(--surface-2)';
    const strength = Math.min(80, 18 + Math.round((count / maxCount) * 62));
    return `color-mix(in srgb, var(--accent) ${strength}%, var(--surface-2))`;
  };

  view.innerHTML = `
    <div class="page-head">
      <div>
        <p class="eyebrow">Прогресс</p>
        <h1 class="page-title">Ваша статистика</h1>
      </div>
    </div>

    <div class="tiles">
      <div class="tile"><strong>${streak}<span>дн.</span></strong><small>серия подряд</small></div>
      <div class="tile"><strong>${global.learned}<span>/ ${total}</span></strong><small>выучено слов</small></div>
      <div class="tile"><strong>${global.accuracy}%</strong><small>точность</small></div>
      <div class="tile"><strong>${answeredTotal}</strong><small>всего ответов</small></div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Активность за 30 дней</h2>
        <span>${days.reduce((sum, day) => sum + day.count, 0)} повторений</span>
      </div>
      <div class="heat" role="img" aria-label="Календарь повторений за 30 дней">
        ${days
          .map(
            (day) =>
              `<i style="background:${heatColor(day.count)}" title="${esc(
                day.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
              )}: ${day.count}"></i>`
          )
          .join('')}
      </div>
      <div class="heat-legend">
        <span>меньше</span>
        ${[0, 0.25, 0.5, 0.75, 1]
          .map(
            (level) =>
              `<i style="background:${
                level === 0
                  ? 'var(--surface-2)'
                  : `color-mix(in srgb, var(--accent) ${Math.round(18 + level * 62)}%, var(--surface-2))`
              }"></i>`
          )
          .join('')}
        <span>больше</span>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>По колодам</h2>
        <span>${global.learning} в процессе</span>
      </div>
      ${DECKS.map((deck) => {
        const stats = store.deckStats(deck);
        return `
          <div class="deck-stat">
            <h3>${esc(deck.title)} <span>${esc(deck.level)}</span></h3>
            <b>${stats.learned} / ${stats.total}</b>
            <div class="bar"><i style="width:${stats.pct}%"></i></div>
          </div>`;
      }).join('')}
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* Настройки                                                           */
/* ------------------------------------------------------------------ */

function viewSettings(view) {
  const settings = store.state.settings;
  const user = currentUser();

  view.innerHTML = `
    <div class="page-head">
      <div>
        <p class="eyebrow">Настройки</p>
        <h1 class="page-title">Как вам удобнее</h1>
      </div>
    </div>

    <div class="settings">
      <div class="group">
        <div class="row">
          <div class="row-text">
            <strong>Аккаунт</strong>
            <small>${
              isSyncEnabled()
                ? user
                  ? esc(user.email)
                  : 'Вы не вошли: прогресс хранится локально на этом устройстве. Войдите, чтобы синхронизировать его.'
                : 'Прогресс хранится локально на этом устройстве — синхронизация не настроена.'
            }</small>
          </div>
          ${
            isSyncEnabled()
              ? user
                ? `<button class="btn btn-ghost btn-sm" type="button" data-logout>Выйти</button>`
                : `<button class="btn btn-primary btn-sm" type="button" data-login>Войти</button>`
              : `<button class="btn btn-ghost btn-sm" type="button" data-sync-info>Подробнее</button>`
          }
        </div>
      </div>

      <div class="group">
        <div class="row">
          <div class="row-text">
            <strong>Тема</strong>
            <small>Светлая, тёмная или как в системе</small>
          </div>
          <div class="segmented" role="group" aria-label="Тема">
            ${['auto', 'light', 'dark']
              .map(
                (value) =>
                  `<button type="button" data-setting="theme" data-value="${value}" class="${
                    settings.theme === value ? 'is-active' : ''
                  }">${value === 'auto' ? 'Авто' : value === 'light' ? 'Светлая' : 'Тёмная'}</button>`
              )
              .join('')}
          </div>
        </div>

        <div class="row">
          <div class="row-text">
            <strong>Направление</strong>
            <small>Что показывать на лицевой стороне карточки</small>
          </div>
          <div class="segmented" role="group" aria-label="Направление">
            <button type="button" data-setting="direction" data-value="en-ru" class="${
              settings.direction === 'en-ru' ? 'is-active' : ''
            }">EN → RU</button>
            <button type="button" data-setting="direction" data-value="ru-en" class="${
              settings.direction === 'ru-en' ? 'is-active' : ''
            }">RU → EN</button>
          </div>
        </div>

        <div class="row">
          <div class="row-text">
            <strong>Цель на день</strong>
            <small>Сколько карточек проходить за подход</small>
          </div>
          <div class="segmented" role="group" aria-label="Цель на день">
            ${[10, 20, 30, 50]
              .map(
                (value) =>
                  `<button type="button" data-setting="dailyGoal" data-value="${value}" class="${
                    settings.dailyGoal === value ? 'is-active' : ''
                  }">${value}</button>`
              )
              .join('')}
          </div>
        </div>

        <div class="row">
          <div class="row-text">
            <strong>Озвучивать слова</strong>
            <small>Автоматически произносить английское слово на карточке</small>
          </div>
          <button class="switch ${settings.autoSpeak ? 'is-on' : ''}" type="button" role="switch"
            aria-checked="${settings.autoSpeak}" aria-label="Озвучивать слова" data-toggle-speak></button>
        </div>
      </div>

      <div class="group">
        <div class="row">
          <div class="row-text">
            <strong>Сбросить прогресс</strong>
            <small>Удалить все оценки и статистику. Слова останутся.</small>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" data-reset>${icon('i-trash')}Сбросить</button>
        </div>
      </div>

      <div class="group">
        <div class="row row-stack">
          <div class="row-text">
            <strong>О приложении</strong>
            <small>MTIEN · статический сайт для GitHub Pages. Без авторизации прогресс хранится локально на этом устройстве; после входа — синхронизируется между устройствами.</small>
          </div>
        </div>
      </div>
    </div>
  `;

  const settingsRoot = $('.settings', view);

  settingsRoot.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-setting], [data-login], [data-logout], [data-sync-info], [data-toggle-speak], [data-reset]');
    if (!target) return;

    if (target.dataset.setting) {
      const key = target.dataset.setting;
      const raw = target.dataset.value;
      const value = key === 'dailyGoal' ? Number(raw) : raw;
      store.updateSettings({ [key]: value });
      if (key === 'theme') applyTheme();
      syncChrome();
      $$(`[data-setting="${key}"]`, settingsRoot).forEach((button) => {
        button.classList.toggle('is-active', button.dataset.value === raw);
      });
      return;
    }

    if (target.hasAttribute('data-login')) {
      openAuthModal();
      return;
    }

    if (target.hasAttribute('data-logout')) {
      await signOut();
      syncChrome();
      toast('Вы вышли из аккаунта');
      render();
      return;
    }

    if (target.hasAttribute('data-sync-info')) {
      openSyncInfo();
      return;
    }

    if (target.hasAttribute('data-toggle-speak')) {
      const next = !store.state.settings.autoSpeak;
      store.updateSettings({ autoSpeak: next });
      target.classList.toggle('is-on', next);
      target.setAttribute('aria-checked', String(next));
      return;
    }

    if (target.hasAttribute('data-reset')) {
      openModal({
        title: 'Сбросить прогресс?',
        body: '<p>Все оценки карточек и статистика будут удалены. Отменить это действие нельзя.</p>',
        actions: `
          <button class="btn btn-ghost" type="button" data-close>Отмена</button>
          <button class="btn btn-danger" type="button" id="confirm-reset">Сбросить</button>`
      });
      $('#confirm-reset')?.addEventListener('click', () => {
        store.resetProgress();
        closeModal();
        toast('Прогресс сброшен');
        render();
      });
    }
  });
}

/* ------------------------------------------------------------------ */
/* Аккаунт и синхронизация                                             */
/* ------------------------------------------------------------------ */

function openSyncInfo() {
  openModal({
    title: 'Синхронизация',
    body: `
      <p>Сейчас приложение работает локально: прогресс лежит в localStorage и никуда не отправляется.</p>
      <p style="margin-top:10px">Чтобы включить аккаунты и синхронизацию между устройствами, создайте проект Supabase, выполните <code>sql/schema.sql</code> и впишите URL и anon key в <code>assets/js/config.js</code>. Подробная инструкция — в README.</p>
      <p style="margin-top:10px">Anon key публичный, доступ к данным ограничивают RLS-политики из schema.sql.</p>`,
    actions: `<button class="btn btn-primary" type="button" data-close>Понятно</button>`
  });
}

function openAuthModal() {
  const modal = openModal({
    title: 'Вход',
    body: `
      <p>Один аккаунт — один прогресс на всех устройствах.</p>
      <form class="form" id="auth-form" novalidate>
        <label for="auth-email">Email</label>
        <input id="auth-email" type="email" autocomplete="email" placeholder="you@example.com" required>
        <label for="auth-password">Пароль</label>
        <input id="auth-password" type="password" autocomplete="current-password" minlength="6" placeholder="Минимум 6 символов" required>
        <p class="form-error" id="auth-error"></p>
        <button class="btn btn-primary" type="submit">Войти</button>
        <button class="btn btn-ghost" type="button" id="auth-signup">Создать аккаунт</button>
      </form>`
  });

  const form = $('#auth-form', modal);
  const email = $('#auth-email', modal);
  const password = $('#auth-password', modal);
  const errorNode = $('#auth-error', modal);
  const submit = $('button[type="submit"]', form);
  const signupButton = $('#auth-signup', modal);

  const setError = (message = '') => {
    errorNode.textContent = message;
  };

  const readForm = () => {
    const emailValue = email.value.trim();
    const passwordValue = password.value;
    if (!emailValue || !passwordValue) {
      setError('Заполните email и пароль');
      return null;
    }
    if (passwordValue.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return null;
    }
    return { emailValue, passwordValue };
  };

  const setBusy = (busy) => {
    submit.disabled = busy;
    signupButton.disabled = busy;
    submit.textContent = busy ? 'Подождите…' : 'Войти';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm();
    if (!values) return;
    setError('');
    setBusy(true);
    try {
      await signIn(values.emailValue, values.passwordValue);
      closeModal();
      toast('Вы вошли, прогресс синхронизирован');
      syncChrome();
      render();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  });

  signupButton.addEventListener('click', async () => {
    const values = readForm();
    if (!values) return;
    setError('');
    setBusy(true);
    try {
      const result = await signUp(values.emailValue, values.passwordValue);
      if (result.needsConfirm) {
        closeModal();
        toast('Проверьте почту и подтвердите регистрацию', 'i-info');
      } else {
        closeModal();
        toast('Аккаунт создан');
        syncChrome();
        render();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  });

  email.focus();
}

function openAccount() {
  const user = currentUser();
  if (!isSyncEnabled()) {
    openSyncInfo();
    return;
  }
  if (!user) {
    openAuthModal();
    return;
  }
  const modal = openModal({
    title: 'Аккаунт',
    body: `<p>${esc(user.email)}</p><p style="margin-top:8px">Прогресс сохраняется в облаке и подтягивается при входе на другом устройстве.</p>`,
    actions: `
      <button class="btn btn-ghost" type="button" data-close>Закрыть</button>
      <button class="btn btn-danger" type="button" id="modal-logout">Выйти</button>`
  });
  $('#modal-logout', modal)?.addEventListener('click', async () => {
    await signOut();
    closeModal();
    toast('Вы вышли из аккаунта');
    syncChrome();
    render();
  });
}

/* ------------------------------------------------------------------ */
/* Запуск                                                              */
/* ------------------------------------------------------------------ */

function notFound() {
  return `
    <div class="empty">
      ${icon('i-info')}
      <h3>Такой колоды нет</h3>
      <p>Проверьте ссылку или вернитесь на главную.</p>
      <a class="btn btn-primary" href="#/">На главную</a>
    </div>`;
}

function bindGlobalUi() {
  $$('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = resolvedTheme() === 'dark' ? 'light' : 'dark';
      store.updateSettings({ theme: next });
      applyTheme();
      $$('[data-setting="theme"]').forEach((item) => {
        item.classList.toggle('is-active', item.dataset.value === next);
      });
    });
  });

  $$('[data-account]').forEach((button) => {
    button.addEventListener('click', openAccount);
  });
}

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (!location.protocol.startsWith('http')) return;
  window.addEventListener('load', () => {
    const swUrl = new URL('../../sw.js', import.meta.url);
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn('[wordly] service worker не зарегистрирован', error);
    });
  });
}

function init() {
  applyTheme();
  bindGlobalUi();
  syncChrome();

  window.addEventListener('hashchange', render);
  window.addEventListener('wordly:changed', () => syncChrome());

  onSyncChange(() => {
    syncChrome();
    if (isAuthRedirect()) {
      history.replaceState(null, '', `${location.pathname}${location.search}#/`);
      render();
      return;
    }
    const { path } = parseHash();
    if (path === '/' || path === '/stats' || path === '/settings') render();
  });

  render();
  initServiceWorker();

  if (isSyncEnabled()) {
    initSync()
      .then(() => {
        syncChrome();
        const { path } = parseHash();
        if (path === '/' || path === '/settings') render();
      })
      .catch((error) => console.warn('[wordly] init sync', error));
  }
}

init();
