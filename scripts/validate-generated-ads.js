#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  ADSENSE_CLIENT,
  ADSENSE_HORIZONTAL_SLOT,
  ADSENSE_VERTICAL_SLOT,
  ADSENSE_SCRIPT_SRC,
  generateAdNetworkHeadHints,
  generateAdNetworkHeadScript,
  generateHorizontalAd,
  generateVerticalAd,
  generateHeaderBannerAd,
  generateBottomLeaderboardAd,
} = require('../src/utils/adProviders');
const { ADSENSE_DIRECT_RECORD, normalizeAdsTxt } = require('../src/utils/adsTxt');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const config = JSON.parse(fs.readFileSync(path.join(root, 'ads-config.json'), 'utf8'));
const failures = [];
const forbiddenMonumetricPattern = /monu\.delivery|monumetric|\$MMT|mmt-|__registerMonumetricSlot/i;

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function occurrences(content, needle) {
  return content.split(needle).length - 1;
}

function validatePage(page, html, isGamePage) {
  if (config.botVerificationEnabled !== false) {
    expect(html.includes('<script src="assets/bot-detector.js"></script>'), `${page} has an invalid bot-detector asset path`);
    expect(!html.includes('<script src="../assets/bot-detector.js"></script>'), `${page} still points outside the site for bot-detector.js`);
  }
  expect(html.includes("gtag('config', 'G-4QZLTDX504', { send_page_view: false });"), `${page} can double-count its GA page view`);
  expect(!html.includes('ga_user_id'), `${page} contains the retired parallel analytics user ID`);
  expect(occurrences(html, ADSENSE_SCRIPT_SRC) === 1, `${page} must load the AdSense library exactly once`);
  expect(html.includes(`data-ad-client="${ADSENSE_CLIENT}"`), `${page} does not contain the AdSense publisher ID`);
  expect(html.includes(`data-ad-slot="${ADSENSE_HORIZONTAL_SLOT}"`), `${page} does not contain the horizontal AdSense slot`);
  expect(html.includes('window.__initAdSenseSlots'), `${page} does not initialize AdSense slots through the shared runtime`);
  expect(html.includes("script.setAttribute('data-overlays', 'bottom')"), `${page} does not enable Google's native bottom anchor`);
  expect(!html.includes('footer-inscreen-ad'), `${page} still contains the custom floating ad`);
  expect(html.includes('ins.adsbygoogle[data-ad-status="unfilled"]'), `${page} does not hide explicitly unfilled AdSense units`);
  expect(html.includes('.horizontal-ad-row:has(> ins.adsbygoogle[data-ad-status="unfilled"])'), `${page} does not collapse unfilled in-content ad rows`);
  expect(!forbiddenMonumetricPattern.test(html), `${page} still contains Monumetric code or markup`);

  if (isGamePage) {
    expect(html.includes('class="game-stage"'), `${page} has no responsive game stage`);
    expect(!html.includes('id="reloadGameBtn"'), `${page} still contains the restart control`);
    expect(!html.includes('function reloadGame()'), `${page} still contains restart behavior`);
    expect(html.includes('id="fullscreenBtn"'), `${page} has no fullscreen control`);
    expect(html.includes('role="toolbar" aria-label="Game controls"'), `${page} has no accessible game toolbar`);
    expect(occurrences(html, `data-ad-slot="${ADSENSE_VERTICAL_SLOT}"`) >= 2, `${page} does not contain both vertical AdSense pillars`);
  }
}

const gamePages = fs.readdirSync(dataDir)
  .filter((name) => name.endsWith('.json'))
  .map((name) => `${path.basename(name, '.json')}.html`);

expect(fs.existsSync(path.join(root, 'index.html')), 'index.html was not generated');
if (fs.existsSync(path.join(root, 'index.html'))) validatePage('index.html', read('index.html'), false);

for (const page of gamePages) {
  const pagePath = path.join(root, page);
  expect(fs.existsSync(pagePath), `${page} was not generated`);
  if (fs.existsSync(pagePath)) validatePage(page, fs.readFileSync(pagePath, 'utf8'), true);
}

const headHints = generateAdNetworkHeadHints(true);
const headScript = generateAdNetworkHeadScript(true);
const horizontal = generateHorizontalAd(0, true);
const leftPillar = generateVerticalAd(true, 'left');
const rightPillar = generateVerticalAd(true, 'right');
const header = generateHeaderBannerAd(true);
const bottom = generateBottomLeaderboardAd(true);
const placements = `${horizontal}${leftPillar}${rightPillar}${header}${bottom}`;

expect(config.adProvider === 'adsense', 'AdSense is not the configured provider');
expect(!Object.prototype.hasOwnProperty.call(config, 'fallbackAdProvider'), 'A fallback provider remains in ads-config.json');
expect(headHints.includes('pagead2.googlesyndication.com'), 'AdSense connection hint is missing');
expect(headHints.includes(`name="google-adsense-account" content="${ADSENSE_CLIENT}"`), 'AdSense account verification meta tag is missing');
expect(occurrences(headScript, ADSENSE_SCRIPT_SRC) === 1, 'The shared head markup must load AdSense exactly once');
expect(headScript.includes("window.__activeAdProvider = 'adsense'"), 'Runtime does not lock the active provider to AdSense');
expect(headScript.includes('window.__adsReady(window.__loadAdSenseScript)'), 'AdSense library can load before verification');
expect(headScript.includes("script.setAttribute('data-overlays', 'bottom')"), 'Google native bottom anchor is not enabled');
expect(!headScript.includes(`<script async src="${ADSENSE_SCRIPT_SRC}"`), 'AdSense library is still loaded before verification');
expect(headScript.includes('__requestAdSenseSlot'), 'AdSense request deduplication is missing');
expect(headScript.includes('__initAdSenseSlots'), 'AdSense slot initialization is missing');
expect(headScript.includes('window.__adsReady'), 'AdSense requests do not use the verification gate');
expect(headScript.includes("rootMargin: '600px 0px'"), 'Below-the-fold AdSense units are not proximity-loaded');
expect(headScript.includes('__getAdFillStatus'), 'AdSense fill status is not inspectable');
expect(headScript.includes("'ad_fill_result'"), 'AdSense fill results are not sent to analytics');
expect(horizontal.includes(`data-ad-slot="${ADSENSE_HORIZONTAL_SLOT}"`), 'In-content horizontal slot is missing');
expect(horizontal.includes('data-ad-lazy="true"'), 'In-content horizontal slot is not proximity-loaded');
expect(horizontal.includes('data-ad-placement="in_content"'), 'In-content placement reporting is missing');
expect(leftPillar.includes(`data-ad-slot="${ADSENSE_VERTICAL_SLOT}"`), 'Left vertical slot is missing');
expect(rightPillar.includes(`data-ad-slot="${ADSENSE_VERTICAL_SLOT}"`), 'Right vertical slot is missing');
expect(leftPillar.includes('data-ad-media="(min-width: 1280px)"'), 'Hidden vertical inventory can auction on small screens');
expect(header.includes('data-ad-media="(min-height: 521px), (min-width: 951px)"'), 'Header inventory can auction while its placement is hidden');
expect(bottom.includes(`data-ad-slot="${ADSENSE_HORIZONTAL_SLOT}"`), 'Bottom horizontal slot is missing');
expect(!placements.includes('\n+'), 'AdSense placement markup contains an invalid generated attribute prefix');
expect(!forbiddenMonumetricPattern.test(`${headScript}${placements}`), 'Ad provider helpers still contain Monumetric code or markup');

const adsTxt = normalizeAdsTxt(read('ads.txt'));
expect(adsTxt === ADSENSE_DIRECT_RECORD, 'ads.txt must contain only the direct AdSense publisher record');
expect(normalizeAdsTxt(config.adsTxtContent) === ADSENSE_DIRECT_RECORD, 'ads-config.json adsTxtContent does not match the AdSense record');

if (failures.length) {
  console.error('Generated ad validation failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log(`Generated AdSense validation passed (${gamePages.length} game pages checked).`);
