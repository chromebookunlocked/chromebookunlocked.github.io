/**
 * Normalize category tags in all data/*.json files against the canonical
 * vocabulary in tags.json: fixes typos via the alias map, fixes casing and
 * removes duplicates. Reports (but keeps) tags that are not in the
 * vocabulary.
 *
 * Usage: npm run normalize-tags [-- --dry-run]
 */
const fs = require("fs");
const path = require("path");
const { normalizeTags } = require("./lib/tag-utils");

const dataDir = path.join(__dirname, "..", "data");
const dryRun = process.argv.includes("--dry-run");

const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));

let updated = 0;
const unknownTags = new Map();

jsonFiles.forEach(file => {
  const filePath = path.join(dataDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const raw = data.category || data.categories;
  if (!raw) return;

  const { tags, changed, unknown } = normalizeTags(raw);

  unknown.forEach(tag => {
    if (!unknownTags.has(tag)) unknownTags.set(tag, []);
    unknownTags.get(tag).push(file);
  });

  if (changed) {
    console.log(`✏️  ${file}`);
    console.log(`   before: ${Array.isArray(raw) ? raw.join(", ") : raw}`);
    console.log(`   after:  ${tags.join(", ")}`);
    if (!dryRun) {
      if (data.categories) {
        data.categories = tags;
      } else {
        data.category = tags.join(", ");
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    }
    updated++;
  }
});

if (unknownTags.size > 0) {
  console.log("\n⚠️  Tags not in tags.json vocabulary:");
  unknownTags.forEach((files, tag) => {
    console.log(`   "${tag}" (${files.length} game${files.length > 1 ? "s" : ""}: ${files.slice(0, 3).join(", ")}${files.length > 3 ? ", …" : ""})`);
  });
  console.log("   Add them to tags.json or map them in \"aliases\".");
}

console.log(`\n✨ ${dryRun ? "Would update" : "Updated"} ${updated} of ${jsonFiles.length} files.`);
