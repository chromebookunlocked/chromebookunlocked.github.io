const { getThumbPath } = require("../utils/assetManager");
const { escapeHtml, escapeHtmlAttr } = require("../utils/htmlEscape");
const { generateAnalyticsScript, generateConsentModeScript } = require("../utils/analyticsEnhanced");
const {
  generateAdNetworkHeadHints,
  generateAdNetworkHeadScript,
  generateHorizontalAd,
  generateHeaderBannerAd,
  generateBottomLeaderboardAd
} = require("../utils/adProviders");
const {
  generateCategoryMetaTags,
  generateCategoryStructuredData,
  generateCategoryIntro,
  genrePhrase,
  SITE_NAME
} = require("../utils/seoBuilder");

// Same rhythm as the homepage grid: one ad row after every 2 desktop rows.
const AD_INTERVAL = 12;
// Thumbnails above the fold load immediately; the rest are lazy.
const EAGER_CARDS = 6;

function escapeJs(str) {
  return String(str == null ? '' : str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}

/**
 * Static, crawlable page listing every game of one category.
 * It needs no client script: cards are plain links with real image sources.
 *
 * @param {Object} page - category page descriptor from getCategoryPages()
 * @param {Array} categoryPages - all category pages (for cross links)
 * @param {string} mainStyles - homepage CSS (shared layout)
 * @param {string} gamesDir - path to games directory
 * @param {boolean} adsEnabled
 * @param {boolean} botVerificationEnabled
 * @returns {string} complete HTML document
 */
function generateCategoryPage(page, categoryPages, mainStyles, gamesDir, adsEnabled = true, botVerificationEnabled = true) {
  let adCount = 0;
  let cardsHTML = '';
  page.games.forEach((game, idx) => {
    const thumbPath = escapeHtmlAttr(getThumbPath(game, gamesDir).path);
    const eager = idx < EAGER_CARDS;
    cardsHTML += `<a class="card game-card" href="/${escapeHtmlAttr(encodeURIComponent(game.folder))}.html">
    <div class="thumb-container" style="--thumb-url: url('${thumbPath}')">
      <img class="thumb" src="${thumbPath}" alt="${escapeHtmlAttr(game.name)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" width="300" height="300"${idx === 0 ? ' fetchpriority="high"' : ''}>
    </div>
    <div class="card-title">${escapeHtml(game.name)}</div>
  </a>`;
    if ((idx + 1) % AD_INTERVAL === 0 && idx + 1 < page.games.length) {
      cardsHTML += generateHorizontalAd(adCount, adsEnabled);
      adCount++;
    }
  });

  const sidebarLinks = categoryPages
    .map((other) => `<li${other.slug === page.slug ? ' aria-current="page"' : ''}><a href="${escapeHtmlAttr(other.path)}"><span class="icon">🎮</span><span class="text">${escapeHtml(other.name)}</span></a></li>`)
    .join("");

  const otherCategories = categoryPages
    .filter((other) => other.slug !== page.slug)
    .map((other) => `<li><a href="${escapeHtmlAttr(other.path)}">${escapeHtml(other.heading)}</a></li>`)
    .join("");

  const intro = generateCategoryIntro(page)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("\n        ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${generateCategoryMetaTags(page)}

  <!-- Resource Hints for Performance -->
  <link rel="dns-prefetch" href="https://www.googletagmanager.com">
  <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
  ${generateAdNetworkHeadHints(adsEnabled)}

  <!-- Optimize Google Fonts loading -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap"></noscript>

  ${botVerificationEnabled ? `<!-- Cloudflare Turnstile verification gate (must load before ads) -->
  <script src="assets/bot-detector.js"></script>` : ''}

  ${generateConsentModeScript()}

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-4QZLTDX504"></script>
  <script>
    gtag('js', new Date());
    gtag('config', 'G-4QZLTDX504', { send_page_view: false });
  </script>

  ${generateAdNetworkHeadScript(adsEnabled)}

  ${generateAnalyticsScript()}

  <!-- Structured Data for Search Engines -->
  ${generateCategoryStructuredData(page)}

  <style>
    ${mainStyles}

  </style>
</head>
<body>

  <!-- Sidebar -->
  <nav id="sidebar" aria-label="Game categories">
    <ul id="categoryList">
      <li><a href="/"><span class="icon">🏠</span><span class="text">Home</span></a></li>
      ${sidebarLinks}
    </ul>
  </nav>
  <div id="sidebarIndicator" aria-hidden="true"></div>

  <!-- Content -->
  <div id="content" role="main">
    <header id="topHeader">
      <div class="header-left">
        <a href="/"><img src="assets/logo.webp" alt="${SITE_NAME} logo" class="header-logo" width="48" height="48" fetchpriority="high"></a>
        <a class="brand-title" href="/">${SITE_NAME}</a>
      </div>
    </header>

    ${generateHeaderBannerAd(adsEnabled)}

    <div class="content-wrapper" id="main-content">
      <div class="page-intro">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Unblocked Games</a>
          <span aria-hidden="true">›</span> <span aria-current="page">${escapeHtml(page.heading)}</span>
        </nav>
        <h1>${escapeHtml(page.heading)}</h1>
        ${intro}
      </div>

      <div class="category category-static" data-category="${escapeHtmlAttr(page.name)}">
        <h2>All ${page.games.length} ${escapeHtml(genrePhrase(page.name))} games</h2>
        <div class="grid">
          ${cardsHTML}
        </div>
      </div>

      <section class="site-guide" aria-labelledby="more-categories-title">
        <h2 id="more-categories-title">More unblocked game categories</h2>
        <ul class="category-links">${otherCategories}</ul>
      </section>

      ${generateBottomLeaderboardAd(adsEnabled)}

      <footer id="siteFooter">
        <div class="footer-content">
          <div class="footer-brand">
            <p class="footer-brand-name">${SITE_NAME}</p>
            <span class="footer-url">chromebookunlocked.github.io</span>
          </div>
          <div class="footer-links">
            <a href="/important-pages/privacy-policy.html">Privacy Policy</a>
            <a href="/important-pages/cookie-policy.html">Cookie Policy</a>
            <a href="/important-pages/terms-of-service.html">Terms of Service</a>
            <a href="/important-pages/contact.html">Contact</a>
            <a href="/important-pages/dmca.html">DMCA</a>
            <a href="#" onclick="event.preventDefault(); if(window.cookieConsent) window.cookieConsent.reset();">Cookie Settings</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  </div>

  <!-- Track category page view -->
  <script>
    if (typeof trackEnhancedPageView !== 'undefined') {
      trackEnhancedPageView('category_page', '${escapeJs(page.name)}', {
        category_name: '${escapeJs(page.name)}',
        games_count: ${page.games.length}
      });
    }
  </script>

  <!-- Cookie Consent Banner - Load asynchronously -->
  <link rel="preload" as="style" href="assets/cookie-consent.css" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="assets/cookie-consent.css"></noscript>
  <script src="assets/cookie-consent.js" defer></script>

</body>
</html>`;
}

module.exports = {
  generateCategoryPage
};
