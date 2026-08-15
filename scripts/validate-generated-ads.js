#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  generateAdNetworkHeadScript,
  generateAdNetworkInitScript,
  generateHorizontalAd,
  generateVerticalAd
} = require('../src/utils/adProviders');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const config = JSON.parse(fs.readFileSync(path.join(root, 'ads-config.json'), 'utf8'));
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const gamePages = fs.readdirSync(dataDir)
  .filter((name) => name.endsWith('.json'))
  .map((name) => `${path.basename(name, '.json')}.html`);

expect(fs.existsSync(path.join(root, 'index.html')), 'index.html was not generated');

for (const page of gamePages) {
  const pagePath = path.join(root, page);
  expect(fs.existsSync(pagePath), `${page} was not generated`);
  if (!fs.existsSync(pagePath)) continue;

  const html = fs.readFileSync(pagePath, 'utf8');
  if (config.botVerificationEnabled !== false) {
    expect(html.includes('<script src="assets/bot-detector.js"></script>'), `${page} has an invalid bot-detector asset path`);
    expect(!html.includes('<script src="../assets/bot-detector.js"></script>'), `${page} still points outside the site for bot-detector.js`);
  }
  expect(html.includes("gtag('config', 'G-4QZLTDX504', { send_page_view: false });"), `${page} can double-count its GA page view`);
  expect(!html.includes('ga_user_id'), `${page} contains the retired parallel analytics user ID`);
}

const indexHtml = read('index.html');
expect(indexHtml.includes("gtag('config', 'G-4QZLTDX504', { send_page_view: false });"), 'index.html can double-count its GA page view');
expect(!indexHtml.includes('ga_user_id'), 'index.html contains the retired parallel analytics user ID');

const adsenseHead = generateAdNetworkHeadScript(true, 'adsense');
const adsenseInit = generateAdNetworkInitScript(true, 'adsense');
const adsenseHorizontal = generateHorizontalAd(0, true, 'adsense');
const adsensePillar = generateVerticalAd(true, 'adsense', 'left');
const monumetricPillar = generateVerticalAd(true, 'monumetric', 'left');

expect(adsenseHead.includes('__requestAdSenseSlot'), 'AdSense runtime has no deduplicated request helper');
expect(adsenseHead.includes('__adsReady'), 'AdSense requests are not verification-aware');
expect(adsenseHead.includes('window.__adsReady(loadAdNetwork)'), 'Ad network library can execute before verification');
expect(adsenseInit.includes('__initAdSenseSlots'), 'Server-rendered AdSense slots are not initialized');
expect(!adsenseHorizontal.includes('adsbygoogle ='), 'Horizontal AdSense markup contains a second inline request path');
expect(adsenseHorizontal.includes('data-ad-lazy="true"'), 'Below-the-fold AdSense units are not lazy loaded');
expect(adsensePillar.includes('data-ad-media="(min-width: 1280px)"'), 'Hidden AdSense pillars can auction on small screens');
expect(monumetricPillar.includes("var media=\"(min-width: 1280px)\""), 'Hidden Monumetric pillars can auction on small screens');

if (failures.length) {
  console.error('Generated ad validation failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log(`Generated ad validation passed (${gamePages.length} game pages checked).`);
