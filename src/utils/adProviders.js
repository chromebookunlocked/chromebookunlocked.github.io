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
const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

// Monumetric site script + slot IDs
const MONU_SCRIPT_SRC = 'https://monu.delivery/site/0/c/07d613-c796-4eac-978c-7029566ea884.js';
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
 * Resource hints for the active ad network: dns-prefetch + preconnect for
 * the provider's origin, preload for the main script, and preconnect for
 * the most common ad-exchange endpoints. Saves ~200-500ms on first ad fill.
 */
function generateAdNetworkHeadHints(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);

  if (provider === 'monumetric') {
    // Monumetric's own snippet loads the script without crossorigin, so the
    // preload must match (no crossorigin) for the browser to reuse it instead
    // of double-fetching.
    return `<link rel="dns-prefetch" href="https://monu.delivery">
  <link rel="preconnect" href="https://monu.delivery">
  <link rel="preload" as="script" href="${MONU_SCRIPT_SRC}">
  <link rel="dns-prefetch" href="https://securepubads.g.doubleclick.net">
  <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net">`;
  }

  return `<link rel="dns-prefetch" href="https://pagead2.googlesyndication.com">
  <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>
  <link rel="preload" as="script" href="${ADSENSE_SCRIPT_SRC}" crossorigin>`;
}

/**
 * <head> script that (1) starts loading the ad network's main library
 * immediately — in parallel with the Turnstile challenge — so the framework
 * is initialized and connected to exchanges by the time verification clears,
 * and (2) exposes window.__adsReady(cb): a gate that runs cb only once the
 * visitor is verified (or right away if there's no bot detector). Ad slot
 * requests go through __adsReady so the library warms up early but no ads are
 * actually requested for unverified/bot traffic.
 */
function generateAdNetworkHeadScript(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);
  const src = provider === 'monumetric' ? MONU_SCRIPT_SRC : ADSENSE_SCRIPT_SRC;
  const extra = provider === 'monumetric'
    ? `s.async=true;s.setAttribute('data-cfasync','false');`
    : `s.async=true;s.crossOrigin='anonymous';`;

  return `<!-- Ad network main script: starts loading early, in parallel with Turnstile -->
  <script>
    (function(){
      if (!window.__adNetworkLoaded) {
        window.__adNetworkLoaded = true;
        var s = document.createElement('script');
        s.src = ${JSON.stringify(src)};
        ${extra}
        document.head.appendChild(s);
      }
      // Gate actual ad requests on verification so the warmed-up library
      // doesn't serve ads to unverified/bot traffic.
      window.__adsReady = function(cb){
        var bd = window.botDetector;
        if (!bd) return cb();
        if (bd.isVerified && bd.isVerified()) return cb();
        if (typeof bd.onVerified === 'function') return bd.onVerified(cb);
        cb();
      };
    })();
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
      var ads = document.querySelectorAll('.horizontal-ad-row ins.adsbygoogle');
      ads.forEach(function(ad) {
        try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
      });
    });
  </script>`;
}

/**
 * Inline Monumetric slot markup with three load strategies. In every case the
 * actual slot request runs through window.__adsReady(), so it only fires once
 * the visitor is Turnstile-verified (the library itself loads earlier).
 *   - default (immediate): request the slot as soon as it's verified. Use
 *     above the fold.
 *   - { lazy: true }: also wait until the wrapping element is within 800px of
 *     the viewport (IntersectionObserver). Use below the fold.
 *   - { idle: true }: also wait for requestIdleCallback (fallback setTimeout)
 *     so it doesn't compete with above-the-fold ad calls. Use for
 *     persistent-but-non-critical slots (sticky footer).
 */
function monumetricSlot(slotId, opts) {
  const lazy = opts && opts.lazy === true;
  const idle = opts && opts.idle === true;
  const slotJson = JSON.stringify(slotId);

  if (!lazy && !idle) {
    return `<div id="mmt-${slotId}"></div>
    <script type="text/javascript" data-cfasync="false">
    $MMT = window.$MMT || {}; $MMT.cmd = $MMT.cmd || [];
    (function(){
      var slot=${slotJson};
      function push(){ $MMT.cmd.push(function(){ $MMT.display.slots.push([slot]); }); }
      (window.__adsReady||function(c){c();})(push);
    })();
    </script>`;
  }

  if (idle) {
    return `<div id="mmt-${slotId}"></div>
    <script type="text/javascript" data-cfasync="false">
    $MMT = window.$MMT || {}; $MMT.cmd = $MMT.cmd || [];
    (function(){
      var slot=${slotJson};
      function push(){ $MMT.cmd.push(function(){ $MMT.display.slots.push([slot]); }); }
      function ready(){ (window.__adsReady||function(c){c();})(push); }
      if ('requestIdleCallback' in window) { requestIdleCallback(ready, { timeout: 3000 }); }
      else { setTimeout(ready, 1200); }
    })();
    </script>`;
  }

  return `<div id="mmt-${slotId}"></div>
    <script type="text/javascript" data-cfasync="false">
    $MMT = window.$MMT || {}; $MMT.cmd = $MMT.cmd || [];
    (function(){
      var slot=${slotJson};
      var row=document.currentScript&&document.currentScript.parentElement;
      function push(){ $MMT.cmd.push(function(){ $MMT.display.slots.push([slot]); }); }
      function ready(){ (window.__adsReady||function(c){c();})(push); }
      if (!row || !('IntersectionObserver' in window)) { ready(); return; }
      new IntersectionObserver(function(entries, obs){
        if (entries[0].isIntersecting) { ready(); obs.disconnect(); }
      }, { rootMargin: '800px 0px' }).observe(row);
    })();
    </script>`;
}

/**
 * Horizontal ad row that sits between rows of game cards. Lazy-loaded on
 * Monumetric since these are below the fold on initial paint.
 */
function generateHorizontalAd(adIndex, adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);

  if (provider === 'monumetric') {
    return `<div class="horizontal-ad-row" data-ad-index="${adIndex}">
    ${monumetricSlot(MONU_SLOTS.inContentRepeatable, { lazy: true })}
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
 * For Monumetric, only the LEFT side has a real unit (Pillar-Left). The right
 * side renders an empty spacer of equal width so the game frame stays centered
 * (without it, the lone left ad pushes the game off-center to the right).
 * AdSense uses real ads on both sides.
 */
function generateVerticalAd(adsEnabled, adProvider, side = 'left') {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);

  if (provider === 'monumetric') {
    if (side !== 'left') {
      // Balancing spacer keeps the game viewer centered.
      return `<div class="vertical-ad vertical-ad-spacer" aria-hidden="true"></div>`;
    }
    return `<div class="vertical-ad vertical-ad-${side}">
      ${monumetricSlot(MONU_SLOTS.pillarLeft)}
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
 * Header banner under the site header. Above the fold — loaded immediately.
 * Monumetric-only.
 */
function generateHeaderBannerAd(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  if (normalizeProvider(adProvider) !== 'monumetric') return '';
  return `<div class="header-banner-ad">
    ${monumetricSlot(MONU_SLOTS.headerInScreen)}
  </div>`;
}

/**
 * Bottom leaderboard inline above the footer. Lazy-loaded since it's deep
 * below the fold. Monumetric-only.
 */
function generateBottomLeaderboardAd(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  if (normalizeProvider(adProvider) !== 'monumetric') return '';
  return `<div class="bottom-leaderboard-ad">
    ${monumetricSlot(MONU_SLOTS.bottomLeaderboard, { lazy: true })}
  </div>`;
}

/**
 * Footer In-screen sticky banner. Always in the viewport — loaded immediately.
 * Monumetric-only.
 */
function generateFooterInScreenAd(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  if (normalizeProvider(adProvider) !== 'monumetric') return '';
  return `<div class="footer-inscreen-ad" id="footerInScreenAd">
    <button type="button" class="footer-inscreen-ad__close" aria-label="Close ad" onclick="document.getElementById('footerInScreenAd').style.display='none'">×</button>
    ${monumetricSlot(MONU_SLOTS.footerInScreen, { idle: true })}
  </div>`;
}

module.exports = {
  generateAdNetworkHeadHints,
  generateAdNetworkHeadScript,
  generateAdNetworkInitScript,
  generateHorizontalAd,
  generateVerticalAd,
  generateHeaderBannerAd,
  generateBottomLeaderboardAd,
  generateFooterInScreenAd,
  normalizeProvider
};
