/**
 * Ad provider abstraction.
 *
 * The site supports two ad networks: AdSense and Monumetric. The active
 * provider is set via `ads-config.json` -> `adProvider` ("adsense" | "monumetric").
 *
 * Each helper returns the exact HTML to inject for a given slot. When ads
 * are disabled (or the provider is unrecognized), an empty string is returned.
 */

// AdSense publisher / slot configuration
const ADSENSE_CLIENT = 'ca-pub-1033412505744705';
const ADSENSE_HORIZONTAL_SLOT = '2719401053';
const ADSENSE_VERTICAL_SLOT = '9122283604';

// Monumetric site script + slot IDs
const MONU_SCRIPT_SRC = '//monu.delivery/site/0/c/07d613-c796-4eac-978c-7029566ea884.js';
const MONU_SLOTS = {
  headerInScreen: 'd56921e6-6064-44b4-85de-214e86cc24f8',
  pillarLeft: '0f94f1df-dac8-4d55-b24e-3051d266c344',
  bottomLeaderboard: '74d3975a-b756-41a9-94fe-689c862500d6',
  footerInScreen: 'bd025b48-54d2-4cff-88c7-33f195987398',
  inContentRepeatable: '152f0341-dbcb-4430-ab30-d9860e3bccfa'
};

function normalizeProvider(adProvider) {
  return adProvider === 'monumetric' ? 'monumetric' : 'adsense';
}

/**
 * <head> script that loads the active ad network's main library after the
 * Turnstile bot challenge passes.
 */
function generateAdNetworkHeadScript(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);

  if (provider === 'monumetric') {
    return `<!-- Monumetric main script (only loaded after Turnstile verification) -->
  <script>
    if (!window.botDetector || !window.botDetector.shouldBlockAds()) {
      var monuScript = document.createElement('script');
      monuScript.type = 'text/javascript';
      monuScript.src = '${MONU_SCRIPT_SRC}';
      monuScript.setAttribute('data-cfasync', 'false');
      document.head.appendChild(monuScript);
    }
  </script>`;
  }

  return `<!-- Google AdSense (only loaded after Turnstile verification) -->
  <script>
    if (!window.botDetector || !window.botDetector.shouldBlockAds()) {
      var adsScript = document.createElement('script');
      adsScript.async = true;
      adsScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}';
      adsScript.crossOrigin = 'anonymous';
      document.head.appendChild(adsScript);
    }
  </script>`;
}

/**
 * Late-init script for ads that were server-rendered. Only AdSense needs
 * this — Monumetric uses its own `$MMT.cmd` queue per slot.
 */
function generateAdNetworkInitScript(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);
  if (provider !== 'adsense') return '';

  return `<!-- Initialize AdSense Ads -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize all server-rendered horizontal ad units
      var ads = document.querySelectorAll('.horizontal-ad-row ins.adsbygoogle');
      ads.forEach(function(ad) {
        try {
          (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {}
      });
    });
  </script>`;
}

/**
 * Horizontal ad row that sits between rows of game cards.
 * Renders an empty container when ads are disabled.
 */
function generateHorizontalAd(adIndex, adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);

  if (provider === 'monumetric') {
    // The "Repeatable" unit is meant to have the snippet pasted verbatim
    // multiple times, including the exact container id "mmt-{slot}". Adding
    // a suffix prevented Monumetric's renderer from finding the containers.
    // Browsers tolerate the duplicate ids; data-ad-index keeps each row
    // identifiable for our own code.
    return `<div class="horizontal-ad-row" data-ad-index="${adIndex}">
    <div id="mmt-${MONU_SLOTS.inContentRepeatable}"></div>
    <script type="text/javascript" data-cfasync="false">$MMT = window.$MMT || {}; $MMT.cmd = $MMT.cmd || [];$MMT.cmd.push(function(){ $MMT.display.slots.push(["${MONU_SLOTS.inContentRepeatable}"]); })</script>
  </div>`;
  }

  return `<div class="horizontal-ad-row" data-ad-index="${adIndex}">
    <ins class="adsbygoogle"
      style="display:block"
      data-ad-client="${ADSENSE_CLIENT}"
      data-ad-slot="${ADSENSE_HORIZONTAL_SLOT}"
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
  </div>`;
}

/**
 * Vertical ad slot flanking the game viewer.
 * @param {'left'|'right'} side - which side; affects Monumetric slot choice.
 */
function generateVerticalAd(adsEnabled, adProvider, side = 'left') {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);

  if (provider === 'monumetric') {
    // Only the LEFT side gets a Monumetric unit (Pillar-Left). The right
    // side has no dedicated unit, so we render nothing there to avoid the
    // broken/empty container that resulted from reusing the in-content
    // repeatable slot in a vertical slot.
    if (side !== 'left') return '';
    return `<div class="vertical-ad vertical-ad-${side}">
      <div id="mmt-${MONU_SLOTS.pillarLeft}"></div>
      <script type="text/javascript" data-cfasync="false">$MMT = window.$MMT || {}; $MMT.cmd = $MMT.cmd || [];$MMT.cmd.push(function(){ $MMT.display.slots.push(["${MONU_SLOTS.pillarLeft}"]); })</script>
    </div>`;
  }

  return `<div class="vertical-ad vertical-ad-${side}">
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="${ADSENSE_CLIENT}"
        data-ad-slot="${ADSENSE_VERTICAL_SLOT}"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>`;
}

/**
 * Header banner that sits at the very top of <body>, under the site header.
 * Only Monumetric uses this slot today; AdSense returns empty so the
 * placement stays Monumetric-only (extra placement requested by the owner).
 */
function generateHeaderBannerAd(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);
  if (provider !== 'monumetric') return '';

  return `<div class="header-banner-ad">
    <div id="mmt-${MONU_SLOTS.headerInScreen}"></div>
    <script type="text/javascript" data-cfasync="false">$MMT = window.$MMT || {}; $MMT.cmd = $MMT.cmd || [];$MMT.cmd.push(function(){ $MMT.display.slots.push(["${MONU_SLOTS.headerInScreen}"]); })</script>
  </div>`;
}

/**
 * Bottom leaderboard placed inline directly above the site footer.
 * Monumetric-only; AdSense doesn't have an equivalent slot configured.
 */
function generateBottomLeaderboardAd(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);
  if (provider !== 'monumetric') return '';

  return `<div class="bottom-leaderboard-ad">
    <div id="mmt-${MONU_SLOTS.bottomLeaderboard}"></div>
    <script type="text/javascript" data-cfasync="false">$MMT = window.$MMT || {}; $MMT.cmd = $MMT.cmd || [];$MMT.cmd.push(function(){ $MMT.display.slots.push(["${MONU_SLOTS.bottomLeaderboard}"]); })</script>
  </div>`;
}

/**
 * Footer In-screen banner that sticks to the bottom of the viewport.
 * Includes a small close button so visitors can dismiss it. Monumetric-only.
 */
function generateFooterInScreenAd(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);
  if (provider !== 'monumetric') return '';

  return `<div class="footer-inscreen-ad" id="footerInScreenAd">
    <button type="button" class="footer-inscreen-ad__close" aria-label="Close ad" onclick="document.getElementById('footerInScreenAd').style.display='none'">×</button>
    <div id="mmt-${MONU_SLOTS.footerInScreen}"></div>
    <script type="text/javascript" data-cfasync="false">$MMT = window.$MMT || {}; $MMT.cmd = $MMT.cmd || [];$MMT.cmd.push(function(){ $MMT.display.slots.push(["${MONU_SLOTS.footerInScreen}"]); })</script>
  </div>`;
}

module.exports = {
  generateAdNetworkHeadScript,
  generateAdNetworkInitScript,
  generateHorizontalAd,
  generateVerticalAd,
  generateHeaderBannerAd,
  generateBottomLeaderboardAd,
  generateFooterInScreenAd,
  normalizeProvider
};
