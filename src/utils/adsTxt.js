const ADSENSE_DIRECT_RECORD = 'google.com, pub-1033412505744705, DIRECT, f08c47fec0942fa0';
const REQUIRED_RECORDS = [ADSENSE_DIRECT_RECORD];

function normalizeAdsTxt(content) {
  return String(content || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\s+$/, '');
}

function recordKey(record) {
  return record
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .join(',');
}

function ensureRequiredAdsTxtRecords(content) {
  const lines = normalizeAdsTxt(content)
    .split('\n')
    .filter((line) => line.trim());
  const requiredKey = recordKey(ADSENSE_DIRECT_RECORD);
  const withoutDuplicates = lines.filter((line, index) => {
    if (recordKey(line) !== requiredKey) return true;
    return !lines.slice(0, index).some((earlier) => recordKey(earlier) === requiredKey);
  });

  if (!withoutDuplicates.some((line) => recordKey(line) === requiredKey)) {
    withoutDuplicates.unshift(ADSENSE_DIRECT_RECORD);
  }

  return normalizeAdsTxt(withoutDuplicates.join('\n'));
}

module.exports = {
  ADSENSE_DIRECT_RECORD,
  REQUIRED_RECORDS,
  ensureRequiredAdsTxtRecords,
  normalizeAdsTxt,
};
