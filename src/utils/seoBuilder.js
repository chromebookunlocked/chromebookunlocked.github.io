/**
 * SEO Builder Module
 * Titles, descriptions, headings copy and structured data for every page type.
 *
 * Rules this module keeps:
 *  - titles fit 60 characters, descriptions fit 155 and never end mid-word
 *  - copy is built only from what data/*.json really says about a game
 *    (name, categories, optional description); nothing is invented
 *  - structured data describes the page truthfully (no ratings, no fake dates)
 */

const BASE_URL = 'https://chromebookunlocked.github.io';
const SITE_NAME = 'Chromebook Unlocked Games';
const SHORT_BRAND = 'Chromebook Unlocked';
const LOGO_URL = `${BASE_URL}/assets/logo.png`;
const OG_IMAGE_URL = `${BASE_URL}/assets/og-image.png`;
const WEBSITE_ID = `${BASE_URL}/#website`;
const ORGANIZATION_ID = `${BASE_URL}/#organization`;

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;
const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

// Categories that are site features rather than genres. They never get a
// category page and are left out of genre wording.
const META_CATEGORIES = new Set(['Trending Games', 'Uncategorized', 'Newly Added', 'Recently Played']);
// A category needs at least this many games before it gets its own page.
const CATEGORY_PAGE_MIN_GAMES = 5;

// Favicon links shared by all pages (absolute paths so they work at any depth)
const FAVICON_LINKS = `<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/favicon-192.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">`;

function escapeAttr(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// JSON-LD is embedded in a <script>; "<" must not be able to close it.
function jsonLd(schema) {
  return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2).replace(/</g, '\\u003c')}
  </script>`;
}

function gamePageUrl(game) {
  return `${BASE_URL}/${encodeURIComponent(game.folder)}.html`;
}

// Absolute, URL-encoded address of a site-relative file such as a thumbnail.
function assetUrl(relativePath) {
  return `${BASE_URL}/${relativePath.split('/').map(encodeURIComponent).join('/')}`;
}

/* ---------------------------------------------------------------------------
 * Categories
 * ------------------------------------------------------------------------ */

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function categorySlug(category) {
  return `${slugify(category)}-games-unblocked`;
}

const GENRE_PHRASES = {
  '2 Player': 'two-player',
  'Point and Click': 'point-and-click',
  'Tower Defence': 'tower defense',
  'RPG': 'RPG',
  '3D': '3D',
  'IO': '.io',
};

// How a category reads inside a sentence ("a two-player game").
function genrePhrase(category) {
  return GENRE_PHRASES[category] || category.toLowerCase();
}

// Genre categories of a game, in the order the data lists them.
function gameGenres(game) {
  return (game.categories || []).filter((cat) => !META_CATEGORIES.has(cat) && cat !== 'Mobile');
}

function withArticle(phrase) {
  return `${/^[aeio]/i.test(phrase) || /^RPG/.test(phrase) ? 'an' : 'a'} ${phrase}`;
}

function joinList(items) {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// "a sports and football game" / "a browser game" when no genre is known.
function genreNoun(game, max = 2) {
  const genres = gameGenres(game).slice(0, max).map(genrePhrase);
  return genres.length ? withArticle(`${genres.join(' and ')} game`) : 'a browser game';
}

const categoryPageCache = new WeakMap();

/**
 * Category pages that are generated, biggest category first.
 * @param {Object} categories - map of category name -> games (from categorizeGames)
 */
function getCategoryPages(categories) {
  if (categoryPageCache.has(categories)) return categoryPageCache.get(categories);
  const pages = Object.keys(categories)
    .filter((cat) => !META_CATEGORIES.has(cat) && categories[cat].length >= CATEGORY_PAGE_MIN_GAMES)
    .sort((a, b) => categories[b].length - categories[a].length || a.localeCompare(b, 'en'))
    .map((cat) => {
      const slug = categorySlug(cat);
      return {
        name: cat,
        slug,
        file: `${slug}.html`,
        path: `/${slug}.html`,
        url: `${BASE_URL}/${slug}.html`,
        heading: `${cat} Games Unblocked`,
        games: [...categories[cat]].sort(
          (a, b) => (b.priority || 0) - (a.priority || 0) || a.name.localeCompare(b.name, 'en'),
        ),
      };
    });
  categoryPageCache.set(categories, pages);
  return pages;
}

function findCategoryPage(categoryPages, category) {
  return (categoryPages || []).find((page) => page.name === category) || null;
}

// First genre of the game that has its own category page.
function primaryCategoryPage(game, categoryPages) {
  for (const cat of gameGenres(game)) {
    const page = findCategoryPage(categoryPages, cat);
    if (page) return page;
  }
  return null;
}

/* ---------------------------------------------------------------------------
 * Titles and descriptions
 * ------------------------------------------------------------------------ */

// Longest form of the title that fits; the brand is added only if it still fits.
function fitTitle(base) {
  for (const suffix of [' - Play Free Online', ' - Play Free', '']) {
    const title = `${base}${suffix}`;
    if (title.length <= TITLE_MAX) {
      const branded = `${title} | ${SHORT_BRAND}`;
      return branded.length <= TITLE_MAX ? branded : title;
    }
  }
  return base;
}

function firstSentence(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return '';
  return trimmed.split(/(?<=[.!?])\s+/)[0];
}

// First candidate that fits the description limit (candidates are whole sentences).
function fitDescription(candidates) {
  return candidates.find((text) => text.length <= DESCRIPTION_MAX) || candidates[candidates.length - 1];
}

function generateGameSEOTitle(game) {
  return fitTitle(`${game.name} Unblocked`);
}

function generateGameHeading(game) {
  return `${game.name} Unblocked`;
}

function generateGameMetaDescription(game) {
  const name = game.name;
  const noun = genreNoun(game).replace(/^an? /, '');
  const description = String(game.description || '').trim();
  const sentence = firstSentence(description);
  const candidates = [];
  if (sentence) {
    // Longest truthful version first: the whole description, then its first
    // sentence with the "free, no download" fact, then the first sentence alone.
    candidates.push(`Play ${name} unblocked on your school Chromebook. ${description}`);
    candidates.push(`Play ${name} unblocked on your school Chromebook. ${sentence} Free in your browser, no download.`);
    candidates.push(`Play ${name} unblocked on your school Chromebook. ${sentence}`);
    candidates.push(`${name} unblocked for school Chromebooks. ${sentence}`);
  }
  candidates.push(`Play ${name} unblocked on your school Chromebook. A free ${noun} that runs in your browser with no download.`);
  candidates.push(`Play ${name} unblocked on your school Chromebook: a free ${noun}, no download needed.`);
  candidates.push(`Play ${name} unblocked on your school Chromebook, free in your browser.`);
  candidates.push(`Play ${name} unblocked free on your school Chromebook.`);
  return fitDescription(candidates);
}

/**
 * Visible "About" copy: the hand-written description when data has one,
 * otherwise a sentence stating only the genre the data lists.
 */
function generateGameSEODescription(game) {
  if (game.description && game.description.trim()) return game.description.trim();
  return `${game.name} is ${genreNoun(game, 3)} you can play in your browser on ${SITE_NAME}.`;
}

/**
 * Questions and answers shown on a game page. Every answer is true for every
 * game on the site (free, browser-based, fullscreen control) or comes from data.
 */
function generateGameFaq(game) {
  const name = game.name;
  const genres = gameGenres(game);
  const faq = [
    {
      question: `Is ${name} free to play?`,
      answer: `Yes. ${name} is free on ${SITE_NAME}. It opens in your browser, so there is nothing to download or install.`,
    },
    {
      question: `Can I play ${name} unblocked on a school Chromebook?`,
      answer: `${name} runs in the Chrome browser, so it works on Chromebooks as well as Windows and Mac computers. Whether it loads at school depends on your school's network filter.`,
    },
    {
      question: `How do I play ${name} in fullscreen?`,
      answer: `Press Play to load the game, then use the Fullscreen button under it. Press Esc to leave fullscreen.`,
    },
  ];
  if (genres.length) {
    faq.push({
      question: `What kind of game is ${name}?`,
      answer: `${name} is listed under ${joinList(genres)} on ${SITE_NAME}.`,
    });
  }
  return faq;
}

function faqSchema(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/* ---------------------------------------------------------------------------
 * Homepage
 * ------------------------------------------------------------------------ */

const INDEX_TITLE = `Unblocked Games for School Chromebooks | ${SHORT_BRAND}`;
const INDEX_HEADING = 'Unblocked Games for School Chromebooks';

function indexDescription(games = []) {
  const featured = [...games]
    .filter((game) => game.priority > 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map((game) => game.name);
  const count = games.length;
  const candidates = [];
  if (featured.length === 3) {
    candidates.push(`Play ${count} free unblocked games on your school Chromebook, including ${joinList(featured)}. No download: every game runs in the browser.`);
    candidates.push(`Play ${count} free unblocked games on your school Chromebook, including ${joinList(featured)}. No download needed.`);
  }
  candidates.push(`Play ${count} free unblocked games on your school Chromebook. Puzzle, racing, sports and arcade games that run in the browser with no download.`);
  return fitDescription(candidates);
}

function generateIndexFaq(games = [], categoryPages = []) {
  return [
    {
      question: `What is ${SITE_NAME}?`,
      answer: `${SITE_NAME} is a free website with ${games.length} browser games. Every game has its own page and runs in a browser tab on a Chromebook, Windows PC or Mac.`,
    },
    {
      question: 'Are the games free, and do I need to download anything?',
      answer: 'Every game is free to play. Games load inside the page, so there is no app to download or install and no account to create.',
    },
    {
      question: 'Will the games work on a school Chromebook?',
      answer: 'The games run in the Chrome browser, which is what a Chromebook uses. Whether the site opens at school depends on the filter your school network uses.',
    },
    {
      question: 'What kinds of games are there?',
      answer: `Games are sorted into ${categoryPages.length} categories, including ${joinList(categoryPages.slice(0, 6).map((page) => page.name))}. Use the category pages or the search box to find a game.`,
    },
  ];
}

/**
 * Generate SEO meta tags for main index page
 * @param {Array} games - all games (used for the count and featured names)
 */
function generateIndexMetaTags(games = []) {
  const title = INDEX_TITLE;
  const description = escapeAttr(indexDescription(games));

  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="${ROBOTS_INDEX}">
  <meta name="author" content="${SITE_NAME}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE_URL}/">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${OG_IMAGE_URL}">
  <meta property="og:image:alt" content="${SITE_NAME} - unblocked games for school Chromebooks">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${OG_IMAGE_URL}">
  <meta name="twitter:image:alt" content="${SITE_NAME} - unblocked games for school Chromebooks">

  <!-- Favicon -->
  ${FAVICON_LINKS}

  <!-- Additional SEO -->
  <meta name="theme-color" content="#ff66ff">
  <link rel="canonical" href="${BASE_URL}/">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="format-detection" content="telephone=no">

  <!-- Preconnect for performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`;
}

function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: SHORT_BRAND,
    url: `${BASE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
    },
  };
}

/**
 * Generate structured data (JSON-LD) for main index page
 * @param {Array} games - all games
 * @param {Array} categoryPages - generated category pages
 */
function generateIndexStructuredData(games = [], categoryPages = []) {
  const featured = [...games]
    .sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.name.localeCompare(b.name, 'en'))
    .slice(0, 30);

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: SITE_NAME,
        alternateName: [SHORT_BRAND, 'ChromebookUnlocked'],
        url: `${BASE_URL}/`,
        description: indexDescription(games),
        inLanguage: 'en',
        publisher: { '@id': ORGANIZATION_ID },
      },
      organizationSchema(),
      {
        '@type': 'CollectionPage',
        '@id': `${BASE_URL}/#webpage`,
        url: `${BASE_URL}/`,
        name: INDEX_TITLE,
        description: indexDescription(games),
        isPartOf: { '@id': WEBSITE_ID },
        inLanguage: 'en',
        mainEntity: {
          '@type': 'ItemList',
          name: 'Unblocked games on Chromebook Unlocked Games',
          numberOfItems: games.length,
          itemListElement: featured.map((game, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: game.name,
            url: gamePageUrl(game),
          })),
        },
      },
    ],
  };

  return `${jsonLd(graph)}
  ${jsonLd(faqSchema(generateIndexFaq(games, categoryPages)))}`;
}

/* ---------------------------------------------------------------------------
 * Game pages
 * ------------------------------------------------------------------------ */

/**
 * Generate SEO meta tags for game page
 * @param {Object} game - Game object
 * @param {string} thumbPath - Path to game thumbnail
 */
function generateGameMetaTags(game, thumbPath) {
  const gameTitle = escapeAttr(generateGameSEOTitle(game));
  const gameDescription = escapeAttr(generateGameMetaDescription(game));
  const gameName = escapeAttr(game.name);
  const gameUrl = gamePageUrl(game);
  const imageUrl = assetUrl(thumbPath);

  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Primary Meta Tags -->
  <title>${gameTitle}</title>
  <meta name="description" content="${gameDescription}">
  <meta name="robots" content="${ROBOTS_INDEX}">
  <meta name="author" content="${SITE_NAME}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${gameUrl}">
  <meta property="og:title" content="${gameTitle}">
  <meta property="og:description" content="${gameDescription}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:alt" content="${gameName} game thumbnail">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${gameTitle}">
  <meta name="twitter:description" content="${gameDescription}">
  <meta name="twitter:image" content="${imageUrl}">
  <meta name="twitter:image:alt" content="${gameName} game thumbnail">

  <!-- Favicon -->
  ${FAVICON_LINKS}

  <!-- Additional SEO -->
  <meta name="theme-color" content="#ff66ff">
  <link rel="canonical" href="${gameUrl}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">`;
}

/**
 * Generate structured data (JSON-LD) for game page
 * @param {Object} game - Game object
 * @param {string} thumbPath - Path to game thumbnail
 * @param {Array} categoryPages - generated category pages (for the breadcrumb)
 */
function generateGameStructuredData(game, thumbPath, categoryPages = []) {
  const gameUrl = gamePageUrl(game);
  const imageUrl = assetUrl(thumbPath);
  const genres = gameGenres(game);
  const categories = game.categories || [];
  const multiplayer = categories.includes('2 Player') || categories.includes('Multiplayer');
  const categoryPage = primaryCategoryPage(game, categoryPages);

  const breadcrumb = [{ name: 'Unblocked Games', item: `${BASE_URL}/` }];
  if (categoryPage) breadcrumb.push({ name: categoryPage.heading, item: categoryPage.url });
  breadcrumb.push({ name: game.name, item: gameUrl });

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'VideoGame',
        '@id': `${gameUrl}#game`,
        name: game.name,
        url: gameUrl,
        description: generateGameSEODescription(game),
        image: imageUrl,
        ...(genres.length ? { genre: genres } : {}),
        gamePlatform: 'Web browser',
        operatingSystem: 'Any',
        applicationCategory: 'Game',
        ...(multiplayer ? { playMode: ['https://schema.org/SinglePlayer', 'https://schema.org/MultiPlayer'] } : {}),
        isAccessibleForFree: true,
        inLanguage: 'en',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        mainEntityOfPage: { '@id': `${gameUrl}#webpage` },
      },
      {
        '@type': 'WebPage',
        '@id': `${gameUrl}#webpage`,
        url: gameUrl,
        name: generateGameSEOTitle(game),
        description: generateGameMetaDescription(game),
        primaryImageOfPage: { '@type': 'ImageObject', url: imageUrl },
        inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', '@id': WEBSITE_ID, name: SITE_NAME, url: `${BASE_URL}/` },
        mainEntity: { '@id': `${gameUrl}#game` },
        breadcrumb: { '@id': `${gameUrl}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${gameUrl}#breadcrumb`,
        itemListElement: breadcrumb.map((entry, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: entry.name,
          item: entry.item,
        })),
      },
    ],
  };

  return `${jsonLd(graph)}
  ${jsonLd(faqSchema(generateGameFaq(game)))}`;
}

/* ---------------------------------------------------------------------------
 * Category pages
 * ------------------------------------------------------------------------ */

function generateCategoryTitle(page) {
  return fitTitle(page.heading);
}

function generateCategoryDescription(page) {
  const label = genrePhrase(page.name);
  const count = page.games.length;
  const names = page.games.slice(0, 3).map((game) => game.name);
  return fitDescription([
    `Play ${count} free ${label} games unblocked on your school Chromebook, including ${joinList(names)}. No download: they run in the browser.`,
    `Play ${count} free ${label} games unblocked on your school Chromebook, including ${joinList(names.slice(0, 2))}. No download needed.`,
    `Play ${count} free ${label} games unblocked on your school Chromebook. No download: every game runs in the browser.`,
  ]);
}

function generateCategoryIntro(page) {
  const label = genrePhrase(page.name);
  const names = page.games.slice(0, 5).map((game) => game.name);
  return [
    `${SITE_NAME} lists ${page.games.length} ${label} games you can play unblocked in the browser, including ${joinList(names)}.`,
    'Every game is free and opens on its own page with no download, so it works on a Chromebook as well as a Windows PC or Mac. Whether it loads at school depends on your school network filter.',
  ];
}

function generateCategoryMetaTags(page) {
  const title = escapeAttr(generateCategoryTitle(page));
  const description = escapeAttr(generateCategoryDescription(page));

  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="${ROBOTS_INDEX}">
  <meta name="author" content="${SITE_NAME}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${page.url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${OG_IMAGE_URL}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${OG_IMAGE_URL}">

  <!-- Favicon -->
  ${FAVICON_LINKS}

  <!-- Additional SEO -->
  <meta name="theme-color" content="#ff66ff">
  <link rel="canonical" href="${page.url}">`;
}

function generateCategoryStructuredData(page) {
  return jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${page.url}#webpage`,
        url: page.url,
        name: generateCategoryTitle(page),
        description: generateCategoryDescription(page),
        inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', '@id': WEBSITE_ID, name: SITE_NAME, url: `${BASE_URL}/` },
        breadcrumb: { '@id': `${page.url}#breadcrumb` },
        mainEntity: {
          '@type': 'ItemList',
          name: page.heading,
          numberOfItems: page.games.length,
          itemListElement: page.games.map((game, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: game.name,
            url: gamePageUrl(game),
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${page.url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Unblocked Games', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: page.heading, item: page.url },
        ],
      },
    ],
  });
}

module.exports = {
  generateIndexMetaTags,
  generateIndexStructuredData,
  generateIndexFaq,
  generateGameMetaTags,
  generateGameStructuredData,
  generateGameSEOTitle,
  generateGameHeading,
  generateGameMetaDescription,
  generateGameSEODescription,
  generateGameFaq,
  generateCategoryMetaTags,
  generateCategoryStructuredData,
  generateCategoryTitle,
  generateCategoryDescription,
  generateCategoryIntro,
  getCategoryPages,
  findCategoryPage,
  primaryCategoryPage,
  gameGenres,
  genrePhrase,
  joinList,
  gamePageUrl,
  assetUrl,
  slugify,
  BASE_URL,
  SITE_NAME,
  SHORT_BRAND,
  LOGO_URL,
  INDEX_HEADING,
  META_CATEGORIES,
  CATEGORY_PAGE_MIN_GAMES,
};
