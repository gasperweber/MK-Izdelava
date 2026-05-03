import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');

if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';

// Find next available index
const existing = fs.readdirSync(screenshotDir).filter(f => f.startsWith('screenshot-'));
const indices = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const nextIndex = indices.length ? Math.max(...indices) + 1 : 1;

const filename = `screenshot-${nextIndex}${label}.png`;
const filepath = path.join(screenshotDir, filename);

const CHROME_PATHS = [
  'C:\\Users\\Gasper\\AppData\\Local\\ms-playwright\\chromium-1217\\chrome-win64\\chrome.exe',
  'C:\\Users\\nateh\\AppData\\Local\\ms-playwright\\chromium-1217\\chrome-win64\\chrome.exe',
];
const executablePath = CHROME_PATHS.find(p => fs.existsSync(p));

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: executablePath || undefined,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
// Scroll slowly to trigger lazy-loading images and IntersectionObservers
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
const step = 200;
for (let pos = 0; pos < pageHeight; pos += step) {
  await page.evaluate((y) => window.scrollTo(0, y), pos);
  await new Promise(r => setTimeout(r, 60));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 1000));
// Force all scroll-reveal animations visible
await page.evaluate(() => {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
});
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: filepath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: temporary screenshots/${filename}`);
