#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  generateAdNetworkHeadScript,
  generateAdNetworkInitScript,
  generateHorizontalAd,
  generateVerticalAd,
  generateHeaderBannerAd
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
  expect(html.includes('class="game-stage"'), `${page} has no responsive game stage`);
  expect(html.includes('id="reloadGameBtn"'), `${page} has no mobile-friendly restart control`);
  expect(html.includes('role="toolbar" aria-label="Game controls"'), `${page} has no accessible game toolbar`);
}

const indexHtml = read('index.html');
expect(indexHtml.includes("gtag('config', 'G-4QZLTDX504', { send_page_view: false });"), 'index.html can double-count its GA page view');
expect(!indexHtml.includes('ga_user_id'), 'index.html contains the retired parallel analytics user ID');

const adsenseHead = generateAdNetworkHeadScript(true, 'adsense');
const adsenseInit = generateAdNetworkInitScript(true, 'adsense');
const adsenseHorizontal = generateHorizontalAd(0, true, 'adsense');
const adsensePillar = generateVerticalAd(true, 'adsense', 'left');
const monumetricPillar = generateVerticalAd(true, 'monumetric', 'left');
const monumetricFallbackHead = generateAdNetworkHeadScript(true, 'monumetric', 'adsense');
const monumetricFallbackInit = generateAdNetworkInitScript(true, 'monumetric', 'adsense');
const monumetricFallbackHorizontal = generateHorizontalAd(0, true, 'monumetric', 'adsense');
const monumetricHeader = generateHeaderBannerAd(true, 'monumetric', 'adsense');

expect(adsenseHead.includes('__requestAdSenseSlot'), 'AdSense runtime has no deduplicated request helper');
expect(adsenseHead.includes('__adsReady'), 'AdSense requests are not verification-aware');
expect(adsenseHead.includes('window.__adsReady(loadAdNetwork)'), 'Ad network library can execute before verification');
expect(adsenseInit.includes('__initAdSenseSlots'), 'Server-rendered AdSense slots are not initialized');
expect(!adsenseHorizontal.includes('adsbygoogle ='), 'Horizontal AdSense markup contains a second inline request path');
expect(adsenseHorizontal.includes('data-ad-lazy="true"'), 'Below-the-fold AdSense units are not lazy loaded');
expect(adsensePillar.includes('data-ad-media="(min-width: 1280px)"'), 'Hidden AdSense pillars can auction on small screens');
expect(monumetricPillar.includes("var media=\"(min-width: 1280px)\""), 'Hidden Monumetric pillars can auction on small screens');
expect(config.adProvider === 'monumetric', 'Monumetric is not configured as the primary provider');
expect(config.fallbackAdProvider === 'adsense', 'AdSense is not configured as the fallback provider');
expect(monumetricFallbackHead.includes("window.__activateAdSenseFallback('script-error')"), 'Monumetric script errors do not activate the AdSense fallback');
expect(monumetricFallbackHead.includes('__loadAdSenseNetwork'), 'Fallback runtime cannot load AdSense');
expect(monumetricFallbackInit.includes("window.__activeAdProvider === 'adsense'"), 'Fallback slots initialize while Monumetric is active');
expect(monumetricFallbackHorizontal.includes('data-ad-provider-stack'), 'In-content inventory has no provider stack');
expect(monumetricFallbackHorizontal.includes('mmt-152f0341-dbcb-4430-ab30-d9860e3bccfa'), 'Provider stack is missing its Monumetric primary slot');
expect(monumetricFallbackHorizontal.includes('data-ad-client="ca-pub-1033412505744705"'), 'Provider stack is missing its AdSense fallback slot');
expect(!monumetricPillar.includes('adsbygoogle'), 'AdSense fallback is too close to the game window');
expect(monumetricHeader.includes('var media="(min-height: 521px), (min-width: 951px)"'), 'Header inventory can auction while hidden in a short landscape viewport');

if (failures.length) {
  console.error('Generated ad validation failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log(`Generated ad validation passed (${gamePages.length} game pages checked).`);
