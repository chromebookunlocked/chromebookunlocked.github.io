/**
 * Generate SEO meta tags for main index page
 * @returns {string} HTML string with meta tags
 */
function generateIndexMetaTags() {
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Primary Meta Tags -->
  <title>Chromebook Unlocked Games - Free Unblocked Games for School</title>
  <meta name="title" content="Chromebook Unlocked Games - Free Unblocked Games for School">
  <meta name="description" content="Play free unblocked games at school on your Chromebook. Access 100+ unlocked online games that work on school computers. No downloads required - play instantly in your browser!">
  <meta name="keywords" content="chromebook unlocked games, unblocked games, free online games, school games, chromebook games, unblocked games at school, online games unblocked, school computer games, free games, browser games, no download games, undetected games, play games at school">
  <meta name="robots" content="index, follow">
  <meta name="language" content="English">
  <meta name="author" content="Chromebook Unlocked Games">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://chromebookunlocked.github.io/">
  <meta property="og:title" content="Chromebook Unlocked Games - Free Unblocked Games for School">
  <meta property="og:description" content="Play free unblocked games at school on your Chromebook. Access 100+ unlocked online games that work on school computers. No downloads required!">
  <meta property="og:image" content="https://chromebookunlocked.github.io/assets/logo.png">
  <meta property="og:site_name" content="Chromebook Unlocked Games">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://chromebookunlocked.github.io/">
  <meta property="twitter:title" content="Chromebook Unlocked Games - Free Unblocked Games for School">
  <meta property="twitter:description" content="Play free unblocked games at school on your Chromebook. Access 100+ unlocked online games that work on school computers. No downloads required!">
  <meta property="twitter:image" content="https://chromebookunlocked.github.io/assets/logo.png">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="16x16" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="96x96" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="144x144" href="assets/logo.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/logo.png">
  <link rel="shortcut icon" type="image/png" href="assets/logo.png">

  <!-- Additional SEO -->
  <meta name="theme-color" content="#ff66ff">
  <link rel="canonical" href="https://chromebookunlocked.github.io/">`;
}

/**
 * Generate structured data (JSON-LD) for main index page
 * @returns {string} Script tag with JSON-LD structured data
 */
function generateIndexStructuredData() {
  return `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Chromebook Unlocked Games",
    "url": "https://chromebookunlocked.github.io/",
    "description": "Play free unblocked games at school on your Chromebook. Access 100+ unlocked online games that work on school computers.",
    "image": "https://chromebookunlocked.github.io/assets/logo.png",
    "publisher": {
      "@type": "Organization",
      "name": "Chromebook Unlocked Games",
      "logo": {
        "@type": "ImageObject",
        "url": "https://chromebookunlocked.github.io/assets/logo.png"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://chromebookunlocked.github.io/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
  </script>`;
}

/**
 * Generate SEO meta tags for game page
 * @param {Object} game - Game object
 * @param {string} thumbPath - Path to game thumbnail
 * @returns {string} HTML string with meta tags
 */
function generateGameMetaTags(game, thumbPath) {
  const gameTitle = `${game.name} - Play Unblocked on Chromebook`;
  const gameDescription = `Play ${game.name} unblocked at school on your Chromebook. Free online game that works on school computers. No downloads required!`;
  const gameUrl = `https://chromebookunlocked.github.io/${game.folder}.html`;
  const imageUrl = `https://chromebookunlocked.github.io/${thumbPath}`;

  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Primary Meta Tags -->
  <title>${gameTitle}</title>
  <meta name="title" content="${gameTitle}">
  <meta name="description" content="${gameDescription}">
  <meta name="keywords" content="${game.name}, ${game.name} unblocked, play ${game.name}, ${game.name} chromebook, free ${game.name}, ${game.name} online, unblocked games, chromebook games">
  <meta name="robots" content="index, follow">
  <meta name="language" content="English">
  <meta name="author" content="Chromebook Unlocked Games">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${gameUrl}">
  <meta property="og:title" content="${gameTitle}">
  <meta property="og:description" content="${gameDescription}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:site_name" content="Chromebook Unlocked Games">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${gameUrl}">
  <meta property="twitter:title" content="${gameTitle}">
  <meta property="twitter:description" content="${gameDescription}">
  <meta property="twitter:image" content="${imageUrl}">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="16x16" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="96x96" href="assets/logo.png">
  <link rel="icon" type="image/png" sizes="144x144" href="assets/logo.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/logo.png">
  <link rel="shortcut icon" type="image/png" href="assets/logo.png">

  <!-- Additional SEO -->
  <meta name="theme-color" content="#ff66ff">
  <link rel="canonical" href="${gameUrl}">`;
}

/**
 * Generate structured data (JSON-LD) for game page
 * @param {Object} game - Game object
 * @param {string} thumbPath - Path to game thumbnail
 * @returns {string} Script tag with JSON-LD structured data
 */
function generateGameStructuredData(game, thumbPath) {
  const gameUrl = `https://chromebookunlocked.github.io/${game.folder}.html`;
  const imageUrl = `https://chromebookunlocked.github.io/${thumbPath}`;

  return `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": "${game.name}",
    "url": "${gameUrl}",
    "description": "Play ${game.name} unblocked at school on your Chromebook. Free online game that works on school computers.",
    "image": "${imageUrl}",
    "genre": "${game.categories.join(', ')}",
    "gamePlatform": "Browser",
    "operatingSystem": "Any",
    "applicationCategory": "Game",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Chromebook Unlocked Games",
      "logo": {
        "@type": "ImageObject",
        "url": "https://chromebookunlocked.github.io/assets/logo.png"
      }
    }
  }
  </script>`;
}

module.exports = {
  generateIndexMetaTags,
  generateIndexStructuredData,
  generateGameMetaTags,
  generateGameStructuredData
};
