/**
 * Визуальная проверка в реальном Chrome: скриншоты + сбор ошибок консоли.
 * Запуск: node scripts/visual-check.mjs
 * Требует puppeteer-core и локальный сервер на 127.0.0.1:8123.
 */
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const CHROME =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:8123/';
const OUT = resolve(process.env.SHOTS || '_shots');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-first-run', '--disable-extensions', '--force-device-scale-factor=1', '--hide-scrollbars']
});

const errors = [];
const page = await browser.newPage();
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('requestfailed', (request) =>
  errors.push(`requestfailed: ${request.url()} — ${request.failure()?.errorText}`)
);

async function shot(name, { full = false } = {}) {
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: full });
  console.log(`shot: ${name}`);
}

async function overflow(label) {
  const value = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth
  }));
  const diff = value.scroll - value.inner;
  console.log(`overflow ${label}: ${diff}px (${value.scroll} vs ${value.inner})`);
  if (diff > 1) errors.push(`overflow ${label}: ${diff}px`);
}

/* ---------- Мобильный ---------- */
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(`${BASE}#/`, { waitUntil: 'load' });
await sleep(700);
await overflow('mobile home');
await shot('m-home', { full: true });

await page.goto(`${BASE}#/deck/everyday`, { waitUntil: 'load' });
await sleep(500);
await overflow('mobile deck');
await shot('m-deck', { full: true });

await page.goto(`${BASE}#/study/everyday`, { waitUntil: 'load' });
await sleep(600);
await shot('m-study-front');
await page.click('#flashcard');
await sleep(750);
await shot('m-study-back');

const counterBefore = await page.$eval('#study-counter', (node) => node.textContent);
await page.click('[data-rate="1"]');
await sleep(500);
const counterAfter = await page.$eval('#study-counter', (node) => node.textContent);
console.log(`study counter: ${counterBefore} → ${counterAfter}`);
if (counterBefore === counterAfter) errors.push('rating did not advance the card');

/* Прогоняем сессию до конца */
for (let i = 0; i < 30; i += 1) {
  const reveal = await page.$('[data-reveal]');
  if (!reveal) break;
  await reveal.click();
  await sleep(120);
  const know = await page.$('[data-rate="1"]');
  if (!know) break;
  await know.click();
  await sleep(320);
}
await sleep(300);
await shot('m-study-summary', { full: true });

await page.goto(`${BASE}#/quiz`, { waitUntil: 'load' });
await sleep(500);
await shot('m-quiz', { full: true });
await page.click('.option');
await sleep(400);
await shot('m-quiz-answered', { full: true });

/* Проходим тест до конца */
for (let i = 0; i < 12; i += 1) {
  const option = await page.$('.option:not([disabled])');
  if (!option) break;
  await option.click();
  await sleep(950);
}
await sleep(400);
await shot('m-quiz-result', { full: true });

await page.goto(`${BASE}#/stats`, { waitUntil: 'load' });
await sleep(500);
await overflow('mobile stats');
await shot('m-stats', { full: true });

await page.goto(`${BASE}#/settings`, { waitUntil: 'load' });
await sleep(500);
await overflow('mobile settings');
await shot('m-settings', { full: true });

/* ---------- Узкий экран ---------- */
await page.setViewport({ width: 320, height: 700, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(`${BASE}#/`, { waitUntil: 'load' });
await sleep(600);
await overflow('320 home');
await shot('xs-home', { full: true });

/* ---------- Планшет ---------- */
await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1 });
await page.goto(`${BASE}#/`, { waitUntil: 'load' });
await sleep(600);
await overflow('tablet home');
await shot('t-home');

/* ---------- Десктоп ---------- */
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(`${BASE}#/`, { waitUntil: 'load' });
await sleep(600);
await overflow('desktop home');
await shot('d-home');

await page.goto(`${BASE}#/deck/travel`, { waitUntil: 'load' });
await sleep(500);
await shot('d-deck');

await page.goto(`${BASE}#/study/all`, { waitUntil: 'load' });
await sleep(600);
await page.click('#flashcard');
await sleep(750);
await shot('d-study-back');

await page.goto(`${BASE}#/stats`, { waitUntil: 'load' });
await sleep(500);
await shot('d-stats');

await page.goto(`${BASE}#/settings`, { waitUntil: 'load' });
await sleep(500);
await shot('d-settings');

/* Настройки: тема и поиск по колоде */
await page.click('[data-setting="theme"][data-value="dark"]');
await sleep(300);
const themeSetting = await page.evaluate(() => ({
  theme: document.documentElement.dataset.theme,
  active: document.querySelector('[data-setting="theme"][data-value="dark"]').classList.contains('is-active')
}));
if (themeSetting.theme !== 'dark' || !themeSetting.active) {
  errors.push('переключатель темы не сработал');
}
await page.click('[data-setting="theme"][data-value="auto"]');
await sleep(200);

await page.goto(`${BASE}#/deck/travel`, { waitUntil: 'load' });
await sleep(400);
await page.type('#word-search', 'lug');
await sleep(250);
const filtered = await page.$$eval('.word-row', (nodes) => nodes.length);
if (filtered !== 1) errors.push(`поиск вернул ${filtered} строк вместо 1`);
await shot('d-deck-filtered');

/* ---------- Тёмная тема ---------- */
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
await page.goto(`${BASE}#/`, { waitUntil: 'load' });
await sleep(600);
const theme = await page.evaluate(() => document.documentElement.dataset.theme);
console.log(`dark theme attribute: ${theme}`);
if (theme !== 'dark') errors.push('dark theme was not applied');
await shot('d-home-dark');

await page.goto(`${BASE}#/study/everyday?practice=1`, { waitUntil: 'load' });
await sleep(600);
await page.click('#flashcard');
await sleep(750);
await shot('d-study-dark');

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(`${BASE}#/stats`, { waitUntil: 'load' });
await sleep(500);
await shot('m-stats-dark');

/* ---------- Модальное окно ---------- */
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
await page.goto(`${BASE}#/settings`, { waitUntil: 'load' });
await sleep(500);
await page.click('[data-sync-info]');
await sleep(300);
await shot('m-modal');
await page.keyboard.press('Escape');
await sleep(200);
const modalOpen = await page.evaluate(() => document.querySelector('#modal-root').classList.contains('is-open'));
if (modalOpen) errors.push('modal did not close on Escape');

console.log('\n=== Ошибки ===');
console.log(errors.length ? errors.join('\n') : 'нет');

await browser.close();
