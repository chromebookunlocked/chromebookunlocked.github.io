#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  REQUIRED_RECORDS,
  ensureRequiredAdsTxtRecords,
  normalizeAdsTxt,
} = require('../src/utils/adsTxt');

const projectRoot = path.join(__dirname, '..');
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const syncConfig = args.includes('--sync-config');
const fileArgument = args.find((arg) => !arg.startsWith('--'));
const adsTxtPath = path.resolve(projectRoot, fileArgument || 'ads.txt');
const configPath = path.join(projectRoot, 'ads-config.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (config.adsEnabled === false && !fileArgument) {
  console.log('ads.txt enforcement skipped because ads are disabled.');
  process.exit(0);
}

if (!fs.existsSync(adsTxtPath)) {
  console.error(`ads.txt source not found: ${adsTxtPath}`);
  process.exit(1);
}

const originalContent = normalizeAdsTxt(fs.readFileSync(adsTxtPath, 'utf8'));
const ensuredContent = ensureRequiredAdsTxtRecords(originalContent);
let hasChanges = originalContent !== ensuredContent;

if (checkOnly && hasChanges) {
  console.error(`${path.basename(adsTxtPath)} is missing or duplicates a required ad-network record.`);
}

if (!checkOnly && hasChanges) {
  fs.writeFileSync(adsTxtPath, `${ensuredContent}\n`, 'utf8');
  console.log(`Updated ${path.basename(adsTxtPath)} with the required AdSense record.`);
}

if (syncConfig && !fileArgument) {
  const configContent = normalizeAdsTxt(config.adsTxtContent);
  const configMatches = configContent === ensuredContent;

  if (checkOnly && !configMatches) {
    hasChanges = true;
    console.error('ads-config.json adsTxtContent does not match ads.txt.');
  } else if (!checkOnly && !configMatches) {
    config.adsTxtContent = ensuredContent;
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    console.log('Synced ads-config.json adsTxtContent with ads.txt.');
  }
}

if (checkOnly && hasChanges) process.exit(1);

for (const record of REQUIRED_RECORDS) {
  console.log(`Verified: ${record}`);
}
