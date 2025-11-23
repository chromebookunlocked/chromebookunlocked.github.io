const BASE_URL = 'https://chromebookunlocked.github.io';
const SITE_NAME = 'Chromebook Unlocked Games';
const LOGO_URL = `${BASE_URL}/assets/logo.png`;
const THEME_COLOR = '#ff66ff';

/**
 * Generate SEO meta tags for main index page
 * @returns {string} HTML string with meta tags
 */
function generateIndexMetaTags() {
  const title = 'Chromebook Unlocked Games - Free Unblocked Games for School';
  const description = 'Play free unblocked games at school on your Chromebook. Access 100+ unlocked online games that work on school computers. No downloads required - play instantly in your browser!';
  const keywords = 'chromebook unlocked games, unblocked games, free online games, school games, chromebook games, unblocked games at school, online games unblocked, school computer games, free games, browser games, no download games, undetected games, play games at school, games not blocked, school unblocked, classroom games';

  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">

  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">
  <meta name="keywords" content="${keywords}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="language" content="English">
  <meta name="author" content="${SITE_NAME}">
  <meta name="revisit-after" content="3 days">
  <meta name="rating" content="general">
  <meta name="distribution" content="global">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_US">
  <meta property="og:url" content="${BASE_URL}/">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${LOGO_URL}">
  <meta property="og:image:secure_url" content="${LOGO_URL}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:image:alt" content="${SITE_NAME} Logo">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@chromebookunlocked">
  <meta name="twitter:creator" content="@chromebookunlocked">
  <meta name="twitter:url" content="${BASE_URL}/">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${LOGO_URL}">
  <meta name="twitter:image:alt" content="${SITE_NAME} Logo">

  <!-- Mobile & PWA -->
  <meta name="theme-color" content="${THEME_COLOR}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="${SITE_NAME}">
  <meta name="application-name" content="${SITE_NAME}">
  <meta name="msapplication-TileColor" content="${THEME_COLOR}">
  <meta name="msapplication-TileImage" content="${LOGO_URL}">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="16x16" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="96x96" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="192x192" href="assets/logo.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/logo.png">
  <link rel="shortcut icon" type="image/png" href="assets/logo.png">

  <!-- Canonical & Alternate -->
  <link rel="canonical" href="${BASE_URL}/">

  <!-- Preconnect for Performance -->
  <link rel="dns-prefetch" href="//fonts.googleapis.com">
  <link rel="dns-prefetch" href="//fonts.gstatic.com">`;
}

/**
 * Generate structured data (JSON-LD) for main index page
 * @param {Array} games - Optional array of games for ItemList
 * @returns {string} Script tag with JSON-LD structured data
 */
function generateIndexStructuredData(games = []) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    "name": SITE_NAME,
    "url": `${BASE_URL}/`,
    "description": "Play free unblocked games at school on your Chromebook. Access 100+ unlocked online games that work on school computers.",
    "inLanguage": "en-US",
    "image": {
      "@type": "ImageObject",
      "url": LOGO_URL,
      "width": 512,
      "height": 512
    },
    "publisher": {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": SITE_NAME,
      "url": `${BASE_URL}/`,
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

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${BASE_URL}/#collectionpage`,
    "name": "Free Unblocked Games Collection",
    "description": "Browse our collection of 100+ free unblocked games that work on school Chromebooks. Play instantly without downloads.",
    "url": `${BASE_URL}/`,
    "isPartOf": {
      "@id": `${BASE_URL}/#website`
    },
    "about": {
      "@type": "Thing",
      "name": "Online Browser Games"
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": "Unblocked Games",
      "numberOfItems": games.length || 100,
      "itemListOrder": "https://schema.org/ItemListUnordered"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    "name": SITE_NAME,
    "url": `${BASE_URL}/`,
    "logo": {
      "@type": "ImageObject",
      "url": LOGO_URL,
      "width": 512,
      "height": 512
    },
    "sameAs": []
  };

  return `<script type="application/ld+json">
${JSON.stringify(websiteSchema, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(collectionSchema, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(organizationSchema, null, 2)}
  </script>`;
}

/**
 * Generate SEO meta tags for game page
 * @param {Object} game - Game object
 * @param {string} thumbPath - Path to game thumbnail
 * @returns {string} HTML string with meta tags
 */
function generateGameMetaTags(game, thumbPath) {
  const gameTitle = `${game.name} - Play Free Unblocked | ${SITE_NAME}`;
  const gameDescription = `Play ${game.name} unblocked at school on your Chromebook. Enjoy this free ${game.categories[0] || 'online'} game that works on school computers. No downloads required - play ${game.name} instantly in your browser!`;
  const gameUrl = `${BASE_URL}/${encodeURIComponent(game.folder)}.html`;
  const imageUrl = `${BASE_URL}/${thumbPath}`;
  const keywords = [
    game.name,
    `${game.name} unblocked`,
    `${game.name} free`,
    `play ${game.name}`,
    `${game.name} online`,
    `${game.name} chromebook`,
    `${game.name} school`,
    `${game.name} no download`,
    `${game.name} browser`,
    ...game.categories.map(cat => `${cat} games`),
    'unblocked games',
    'chromebook games',
    'school games',
    'free online games'
  ].join(', ');

  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">

  <!-- Primary Meta Tags -->
  <title>${gameTitle}</title>
  <meta name="title" content="${gameTitle}">
  <meta name="description" content="${gameDescription}">
  <meta name="keywords" content="${keywords}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="language" content="English">
  <meta name="author" content="${SITE_NAME}">
  <meta name="revisit-after" content="7 days">
  <meta name="rating" content="general">
  <meta name="distribution" content="global">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="game">
  <meta property="og:locale" content="en_US">
  <meta property="og:url" content="${gameUrl}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${gameTitle}">
  <meta property="og:description" content="${gameDescription}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:image:alt" content="${game.name} Game Thumbnail">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@chromebookunlocked">
  <meta name="twitter:creator" content="@chromebookunlocked">
  <meta name="twitter:url" content="${gameUrl}">
  <meta name="twitter:title" content="${gameTitle}">
  <meta name="twitter:description" content="${gameDescription}">
  <meta name="twitter:image" content="${imageUrl}">
  <meta name="twitter:image:alt" content="${game.name} Game Thumbnail">

  <!-- Mobile & PWA -->
  <meta name="theme-color" content="${THEME_COLOR}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="${game.name}">
  <meta name="application-name" content="${game.name}">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="16x16" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="96x96" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="192x192" href="assets/logo.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/logo.png">
  <link rel="shortcut icon" type="image/png" href="assets/logo.png">

  <!-- Canonical -->
  <link rel="canonical" href="${gameUrl}">

  <!-- Preconnect for Performance -->
  <link rel="dns-prefetch" href="//fonts.googleapis.com">
  <link rel="dns-prefetch" href="//fonts.gstatic.com">`;
}

/**
 * Generate structured data (JSON-LD) for game page
 * @param {Object} game - Game object
 * @param {string} thumbPath - Path to game thumbnail
 * @returns {string} Script tag with JSON-LD structured data
 */
function generateGameStructuredData(game, thumbPath) {
  const gameUrl = `${BASE_URL}/${encodeURIComponent(game.folder)}.html`;
  const imageUrl = `${BASE_URL}/${thumbPath}`;

  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "@id": `${gameUrl}#game`,
    "name": game.name,
    "url": gameUrl,
    "description": `Play ${game.name} unblocked at school on your Chromebook. Free online ${game.categories[0] || 'browser'} game that works on school computers.`,
    "image": {
      "@type": "ImageObject",
      "url": imageUrl,
      "width": 512,
      "height": 512
    },
    "genre": game.categories,
    "gamePlatform": ["Web Browser", "Chromebook", "Desktop", "Mobile"],
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
      "availability": "https://schema.org/InStock"
    },
    "publisher": {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": SITE_NAME,
      "url": `${BASE_URL}/`,
      "logo": {
        "@type": "ImageObject",
        "url": LOGO_URL
      }
    },
    "isAccessibleForFree": true,
    "isFamilyFriendly": true
  };

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
        "name": game.categories[0] || "Games",
        "item": `${BASE_URL}/#/category/${encodeURIComponent(game.categories[0] || 'Games')}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": game.name,
        "item": gameUrl
      }
    ]
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${gameUrl}#webpage`,
    "url": gameUrl,
    "name": `${game.name} - Play Free Unblocked`,
    "description": `Play ${game.name} unblocked at school on your Chromebook.`,
    "isPartOf": {
      "@id": `${BASE_URL}/#website`
    },
    "about": {
      "@id": `${gameUrl}#game`
    },
    "breadcrumb": {
      "@id": `${gameUrl}#breadcrumb`
    },
    "inLanguage": "en-US"
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
 * Generate SEO meta tags for DMCA page
 * @returns {string} HTML string with meta tags
 */
function generateDMCAMetaTags() {
  const title = 'DMCA Policy - Copyright Notice | Chromebook Unlocked Games';
  const description = 'Digital Millennium Copyright Act (DMCA) takedown policy and Notice of Alleged Infringement for Chromebook Unlocked Games. Learn how to submit copyright claims.';
  const pageUrl = `${BASE_URL}/dmca.html`;

  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">

  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">
  <meta name="keywords" content="DMCA, copyright notice, takedown request, intellectual property, chromebook unlocked games dmca, copyright infringement">
  <meta name="robots" content="index, follow">
  <meta name="language" content="English">
  <meta name="author" content="${SITE_NAME}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_US">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${LOGO_URL}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:url" content="${pageUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${LOGO_URL}">

  <!-- Mobile -->
  <meta name="theme-color" content="#0b5fff">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="assets/logo.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/logo.png">

  <!-- Canonical -->
  <link rel="canonical" href="${pageUrl}">`;
}

/**
 * Generate structured data for DMCA page
 * @returns {string} Script tag with JSON-LD structured data
 */
function generateDMCAStructuredData() {
  const pageUrl = `${BASE_URL}/dmca.html`;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    "url": pageUrl,
    "name": "DMCA Policy - Copyright Notice",
    "description": "Digital Millennium Copyright Act (DMCA) takedown policy and Notice of Alleged Infringement.",
    "isPartOf": {
      "@id": `${BASE_URL}/#website`
    },
    "inLanguage": "en-US",
    "dateModified": "2025-10-19"
  };

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
        "name": "DMCA Policy",
        "item": pageUrl
      }
    ]
  };

  return `<script type="application/ld+json">
${JSON.stringify(webPageSchema, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(breadcrumbSchema, null, 2)}
  </script>`;
}

module.exports = {
  generateIndexMetaTags,
  generateIndexStructuredData,
  generateGameMetaTags,
  generateGameStructuredData,
  generateDMCAMetaTags,
  generateDMCAStructuredData,
  BASE_URL,
  SITE_NAME,
  LOGO_URL,
  THEME_COLOR
};
