#!/usr/bin/env node

/**
 * Creates a new news article JSON file in /news/
 * Reads article fields from environment variables (safe for GitHub Actions).
 *
 * Required env vars:
 *   NEWS_TITLE    - Article title
 *   NEWS_SUMMARY  - Short summary for news cards
 *   NEWS_CONTENT  - Full article content (use \n\n for paragraph breaks)
 *   NEWS_CATEGORY - One of: announcement, update, new-games, maintenance, community
 *
 * Optional env vars:
 *   NEWS_AUTHOR   - Author name (default: "Team")
 *   NEWS_FEATURED - "true" to feature this article (default: false)
 */

const fs = require("fs");
const path = require("path");

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function main() {
  const title = (process.env.NEWS_TITLE || "").trim();
  const summary = (process.env.NEWS_SUMMARY || "").trim();
  const content = (process.env.NEWS_CONTENT || "").trim();
  const category = (process.env.NEWS_CATEGORY || "announcement").trim().toLowerCase();
  const author = (process.env.NEWS_AUTHOR || "Team").trim();
  const featured = process.env.NEWS_FEATURED === "true";

  const validCategories = ["announcement", "update", "new-games", "maintenance", "community"];

  if (!title) {
    console.error("ERROR: NEWS_TITLE is required.");
    process.exit(1);
  }
  if (!summary) {
    console.error("ERROR: NEWS_SUMMARY is required.");
    process.exit(1);
  }
  if (!content) {
    console.error("ERROR: NEWS_CONTENT is required.");
    process.exit(1);
  }
  if (!validCategories.includes(category)) {
    console.error(`ERROR: NEWS_CATEGORY must be one of: ${validCategories.join(", ")}`);
    process.exit(1);
  }

  const now = new Date();
  const datePrefix = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const slug = slugify(title);
  const filename = `${datePrefix}-${slug}.json`;

  const article = {
    title,
    slug: `${datePrefix}-${slug}`,
    date: now.toISOString(),
    author,
    category,
    summary,
    // Replace literal \n\n with actual double newlines in case the input used escaped newlines
    content: content.replace(/\\n\\n/g, "\n\n").replace(/\\n/g, "\n"),
    featured,
  };

  const newsDir = path.join(__dirname, "..", "news");
  if (!fs.existsSync(newsDir)) {
    fs.mkdirSync(newsDir, { recursive: true });
  }

  const filePath = path.join(newsDir, filename);

  if (fs.existsSync(filePath)) {
    console.error(`ERROR: File already exists: ${filePath}`);
    process.exit(1);
  }

  fs.writeFileSync(filePath, JSON.stringify(article, null, 2) + "\n");
  console.log(`✅ Created news article: ${filename}`);
  console.log(`   Title:    ${title}`);
  console.log(`   Slug:     ${article.slug}`);
  console.log(`   Category: ${category}`);
  console.log(`   Featured: ${featured}`);
  console.log(`   Output:   news/${filename}`);
}

main();
