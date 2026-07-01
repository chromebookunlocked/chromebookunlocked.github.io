const fs = require("fs");
const path = require("path");

const TAGS_CONFIG_PATH = path.join(__dirname, "..", "..", "tags.json");

let cachedConfig = null;

/**
 * Load the canonical tag vocabulary from tags.json (cached).
 * @returns {{tags: string[], aliases: Object, keywords: Object}}
 */
function loadTagsConfig() {
  if (!cachedConfig) {
    cachedConfig = JSON.parse(fs.readFileSync(TAGS_CONFIG_PATH, "utf8"));
  }
  return cachedConfig;
}

/**
 * Normalize a raw category value (comma-separated string or array) against
 * the canonical vocabulary: resolves aliases, fixes casing, removes
 * duplicates. Unknown tags are kept as-is (validation reports them).
 *
 * @param {string|string[]} raw - Raw category value from a data JSON
 * @returns {{tags: string[], changed: boolean, unknown: string[]}}
 */
function normalizeTags(raw) {
  const config = loadTagsConfig();
  const canonicalByLower = new Map(config.tags.map(t => [t.toLowerCase(), t]));
  const aliasByLower = new Map(
    Object.entries(config.aliases || {}).map(([k, v]) => [k.toLowerCase(), v])
  );

  const input = Array.isArray(raw)
    ? raw
    : String(raw || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

  const result = [];
  const unknown = [];

  const push = tag => {
    if (!result.includes(tag)) result.push(tag);
  };

  input.forEach(tag => {
    const lower = tag.toLowerCase();
    const alias = aliasByLower.get(lower);
    if (alias) {
      (Array.isArray(alias) ? alias : [alias]).forEach(push);
      return;
    }
    const canonical = canonicalByLower.get(lower);
    if (canonical) {
      push(canonical);
      return;
    }
    push(tag);
    unknown.push(tag);
  });

  const changed =
    result.length !== input.length || result.some((t, i) => t !== input[i]);

  return { tags: result, changed, unknown };
}

/**
 * Suggest tags for a game based on its name (and optional extra text such as
 * a description) using the keyword rules in tags.json.
 *
 * @param {string} name - Game name
 * @param {string} [extraText] - Optional extra text to match against
 * @returns {string[]} Suggested canonical tags (may be empty)
 */
function suggestTags(name, extraText) {
  const config = loadTagsConfig();
  const haystack = `${name} ${extraText || ""}`.toLowerCase();
  const suggested = [];

  Object.entries(config.keywords || {}).forEach(([keyword, tags]) => {
    if (haystack.includes(keyword)) {
      tags.forEach(tag => {
        if (!suggested.includes(tag)) suggested.push(tag);
      });
    }
  });

  return suggested;
}

module.exports = { loadTagsConfig, normalizeTags, suggestTags };
