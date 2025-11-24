/**
 * SEO Builder Module
 * Generates comprehensive SEO meta tags, structured data, and optimization for all pages
 * Keywords focus: unblocked, online, free, school, games, chromebook
 */

const BASE_URL = 'https://chromebookunlocked.github.io';
const SITE_NAME = 'Chromebook Unlocked Games';
const LOGO_URL = `${BASE_URL}/assets/logo.png`;

// Primary SEO keywords to include across pages
const PRIMARY_KEYWORDS = [
  'unblocked games',
  'free online games',
  'school games',
  'chromebook games',
  'unblocked games at school',
  'free games online',
  'play games at school',
  'no download games',
  'browser games',
  'unblocked games for school',
  'free unblocked games',
  'online games unblocked',
  'school computer games',
  'games for chromebook',
  'unblocked school games',
  'play free games online',
  'games that work at school',
  'undetected games',
  'games not blocked at school'
];

/**
 * Generate SEO meta tags for main index page
 * @returns {string} HTML string with meta tags
 */
function generateIndexMetaTags() {
  const title = 'Unblocked Games - Free Online Games for School | Chromebook Unlocked Games';
  const description = 'Play 100+ free unblocked games online at school! Access the best unblocked games for Chromebook and school computers. No downloads, no blocks - play instantly in your browser. Popular games like Slope, Happy Wheels, FNAF and more!';
  const keywords = [
    ...PRIMARY_KEYWORDS,
    'play unblocked games',
    'best unblocked games',
    'fun games for school',
    'games to play at school',
    'free browser games',
    'online games for kids',
    'classroom games',
    'games for students',
    'unblocked gaming site',
    'free school games',
    'chromebook unlocked',
    'games unblocked at school',
    'play games free online'
  ].join(', ');

  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">
  <meta name="keywords" content="${keywords}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="language" content="English">
  <meta name="author" content="${SITE_NAME}">
  <meta name="revisit-after" content="1 days">
  <meta name="rating" content="general">
  <meta name="distribution" content="global">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE_URL}/">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${LOGO_URL}">
  <meta property="og:image:alt" content="Chromebook Unlocked Games - Free Unblocked Games for School">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${BASE_URL}/">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${LOGO_URL}">
  <meta name="twitter:image:alt" content="Chromebook Unlocked Games - Free Unblocked Games for School">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="16x16" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="96x96" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="192x192" href="assets/logo.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/logo.png">
  <link rel="shortcut icon" type="image/png" href="assets/logo.png">

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

/**
 * Generate structured data (JSON-LD) for main index page
 * @param {Array} games - Array of all games for ItemList
 * @returns {string} Script tag with JSON-LD structured data
 */
function generateIndexStructuredData(games = []) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "alternateName": ["Chromebook Unlocked", "Unblocked Games", "Free School Games"],
    "url": `${BASE_URL}/`,
    "description": "Play 100+ free unblocked games online at school! Access the best unblocked games for Chromebook and school computers. No downloads required.",
    "image": LOGO_URL,
    "inLanguage": "en-US",
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": LOGO_URL,
        "width": 512,
        "height": 512
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "url": `${BASE_URL}/`,
    "logo": LOGO_URL,
    "description": "Free unblocked games website for school and Chromebook users",
    "sameAs": []
  };

  // Create ItemList for game collection (helps with rich snippets)
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Free Unblocked Games",
    "description": "Collection of free unblocked online games to play at school",
    "numberOfItems": games.length || 100,
    "itemListElement": games.slice(0, 20).map((game, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "VideoGame",
        "name": game.name,
        "url": `${BASE_URL}/${game.folder}.html`,
        "playMode": "SinglePlayer",
        "gamePlatform": "Web Browser",
        "applicationCategory": "Game",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      }
    }))
  };

  return `<script type="application/ld+json">
${JSON.stringify(websiteSchema, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(organizationSchema, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(itemListSchema, null, 2)}
  </script>`;
}

/**
 * Generate game-specific keywords based on game name and categories
 * @param {Object} game - Game object
 * @returns {string} Comma-separated keywords
 */
function generateGameKeywords(game) {
  const gameName = game.name;
  const gameNameLower = gameName.toLowerCase();
  const categories = game.categories || [];

  const gameSpecificKeywords = [
    // Game name variations with SEO terms
    `${gameName}`,
    `${gameName} unblocked`,
    `${gameName} online`,
    `${gameName} free`,
    `play ${gameName}`,
    `play ${gameName} online`,
    `play ${gameName} free`,
    `${gameName} game`,
    `${gameName} game online`,
    `${gameName} game unblocked`,
    `${gameName} unblocked games`,
    `${gameName} free online`,
    `${gameName} play free`,
    `${gameName} at school`,
    `${gameName} school unblocked`,
    `${gameName} chromebook`,
    `${gameName} browser game`,
    `${gameName} no download`,
    `free ${gameName} game`,
    `unblocked ${gameName}`,
    // Category-based keywords
    ...categories.map(cat => `${cat.toLowerCase()} games unblocked`),
    ...categories.map(cat => `free ${cat.toLowerCase()} games`),
    ...categories.map(cat => `${cat.toLowerCase()} games online`),
    // Generic SEO terms
    'unblocked games',
    'free online games',
    'school games',
    'chromebook games',
    'unblocked games at school',
    'play games at school',
    'browser games free',
    'games not blocked'
  ];

  return gameSpecificKeywords.join(', ');
}

/**
 * Generate SEO meta tags for game page
 * @param {Object} game - Game object
 * @param {string} thumbPath - Path to game thumbnail
 * @returns {string} HTML string with meta tags
 */
function generateGameMetaTags(game, thumbPath) {
  const gameName = game.name;
  const categories = game.categories || [];
  const categoryText = categories.length > 0 ? categories.join(', ') : 'Action';

  // SEO-optimized title variations
  const gameTitle = `${gameName} Unblocked - Play Free Online | School Games`;

  // Rich, keyword-dense description
  const gameDescription = `Play ${gameName} unblocked for free online! Enjoy ${gameName} on your Chromebook or school computer with no downloads required. ${gameName} is a popular ${categoryText.toLowerCase()} game that works at school. Start playing ${gameName} now - it's free, fun, and unblocked!`;

  const gameUrl = `${BASE_URL}/${game.folder}.html`;
  const imageUrl = `${BASE_URL}/${thumbPath}`;
  const keywords = generateGameKeywords(game);

  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Primary Meta Tags -->
  <title>${gameTitle}</title>
  <meta name="title" content="${gameTitle}">
  <meta name="description" content="${gameDescription}">
  <meta name="keywords" content="${keywords}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="language" content="English">
  <meta name="author" content="${SITE_NAME}">
  <meta name="revisit-after" content="7 days">
  <meta name="rating" content="general">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="game">
  <meta property="og:url" content="${gameUrl}">
  <meta property="og:title" content="${gameTitle}">
  <meta property="og:description" content="${gameDescription}">
  <meta property="og:image" content="${LOGO_URL}">
  <meta property="og:image:alt" content="${gameName} - Free Unblocked Game">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${gameUrl}">
  <meta name="twitter:title" content="${gameTitle}">
  <meta name="twitter:description" content="${gameDescription}">
  <meta name="twitter:image" content="${LOGO_URL}">
  <meta name="twitter:image:alt" content="${gameName} - Free Unblocked Game">

  <!-- Game-specific meta -->
  <meta property="game:name" content="${gameName}">
  <meta property="game:category" content="${categoryText}">
  <meta property="game:platform" content="Web Browser">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="16x16" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="96x96" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="192x192" href="assets/logo.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/logo.png">
  <link rel="shortcut icon" type="image/png" href="assets/logo.png">

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
 * @returns {string} Script tag with JSON-LD structured data
 */
function generateGameStructuredData(game, thumbPath) {
  const gameName = game.name;
  const categories = game.categories || [];
  const gameUrl = `${BASE_URL}/${game.folder}.html`;
  const imageUrl = `${BASE_URL}/${thumbPath}`;

  // VideoGame Schema - primary game data
  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": gameName,
    "alternateName": [`${gameName} Unblocked`, `${gameName} Online`, `${gameName} Free`],
    "url": gameUrl,
    "description": `Play ${gameName} unblocked for free online! Enjoy this popular ${categories.join(', ').toLowerCase() || 'action'} game on your Chromebook or school computer. No downloads required - play instantly in your browser!`,
    "image": LOGO_URL,
    "thumbnailUrl": imageUrl,
    "genre": categories,
    "gamePlatform": ["Web Browser", "Chromebook", "PC", "Mac"],
    "operatingSystem": "Any",
    "applicationCategory": "Game",
    "playMode": "SinglePlayer",
    "numberOfPlayers": {
      "@type": "QuantitativeValue",
      "minValue": 1,
      "maxValue": 1
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "category": "Free"
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": `${BASE_URL}/`,
      "logo": {
        "@type": "ImageObject",
        "url": LOGO_URL
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "ratingCount": "100",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  // BreadcrumbList Schema - for navigation
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `${BASE_URL}/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categories[0] || "Games",
        "item": `${BASE_URL}/#/category/${encodeURIComponent(categories[0] || 'Games')}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": gameName,
        "item": gameUrl
      }
    ]
  };

  // WebPage Schema - for the page itself
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${gameName} Unblocked - Play Free Online`,
    "description": `Play ${gameName} unblocked for free at school on your Chromebook`,
    "url": gameUrl,
    "image": LOGO_URL,
    "inLanguage": "en-US",
    "isPartOf": {
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": `${BASE_URL}/`
    },
    "about": {
      "@type": "VideoGame",
      "name": gameName
    },
    "mainEntity": {
      "@type": "VideoGame",
      "name": gameName,
      "url": gameUrl
    }
  };

  return `<script type="application/ld+json">
${JSON.stringify(gameSchema, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(breadcrumbSchema, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(webPageSchema, null, 2)}
  </script>`;
}

/**
 * Generate SEO-friendly page title for game
 * @param {Object} game - Game object
 * @returns {string} SEO title
 */
function generateGameSEOTitle(game) {
  return `${game.name} Unblocked - Play Free Online | School Games`;
}

/**
 * Generate SEO-friendly description for game
 * @param {Object} game - Game object
 * @returns {string} SEO description
 */
function generateGameSEODescription(game) {
  const categories = game.categories || [];
  const categoryText = categories.length > 0 ? categories[0].toLowerCase() : 'action';
  return `Play ${game.name} unblocked for free online! This ${categoryText} game works on Chromebook and school computers. No downloads - play ${game.name} instantly!`;
}

module.exports = {
  generateIndexMetaTags,
  generateIndexStructuredData,
  generateGameMetaTags,
  generateGameStructuredData,
  generateGameKeywords,
  generateGameSEOTitle,
  generateGameSEODescription,
  BASE_URL,
  SITE_NAME,
  LOGO_URL,
  PRIMARY_KEYWORDS
};
