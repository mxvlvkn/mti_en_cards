/**
 * Проверка service worker (офлайн) и сохранения темы.
 * Запуск: node scripts/offline-check.mjs (нужен сервер на 127.0.0.1:8123)
 */
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:8123/';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-first-run', '--disable-extensions']
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto(`${BASE}#/`, { waitUntil: 'load' });
await sleep(1200);

await page.waitForFunction(() => navigator.serviceWorker.controller !== null, { timeout: 10000 });
console.log('service worker: контролирует страницу');

const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click('[data-theme-toggle]');
await sleep(300);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
await page.reload({ waitUntil: 'load' });
await sleep(500);
const themeReload = await page.evaluate(() => document.documentElement.dataset.theme);
console.log(`тема: ${themeBefore} → ${themeAfter} → после перезагрузки ${themeReload}`);
if (themeAfter === themeBefore) console.log('ОШИБКА: тема не переключилась');
if (themeReload !== themeAfter) console.log('ОШИБКА: тема не сохранилась');

await page.setOfflineMode(true);
let offlineOk = false;
try {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(900);
  offlineOk = await page.evaluate(() => Boolean(document.querySelector('.daily')));
} catch (error) {
  console.log('офлайн-перезагрузка не удалась:', error.message);
}
console.log(`офлайн-режим: ${offlineOk ? 'страница отдана из кэша' : 'НЕ РАБОТАЕТ'}`);
await page.setOfflineMode(false);

await browser.close();
