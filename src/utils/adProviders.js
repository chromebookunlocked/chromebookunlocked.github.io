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
 * <head> script that starts loading the active network asynchronously and
 * exposes a single verification-aware request path for every ad slot. Keeping
 * all requests behind this runtime prevents accidental double initialization
 * and lets below-the-fold or desktop-only units wait until they can be viewed.
 */
function generateAdNetworkHeadScript(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);
  const src = provider === 'monumetric' ? MONU_SCRIPT_SRC : ADSENSE_SCRIPT_SRC;
  const extra = provider === 'monumetric'
    ? `s.async=true;s.setAttribute('data-cfasync','false');`
    : `s.async=true;s.crossOrigin='anonymous';`;
  const adsenseRuntime = provider === 'adsense' ? `
      window.__requestAdSenseSlot = function(ad){
        if (!ad || ad.getAttribute('data-ad-requested') === '1' || ad.getAttribute('data-ad-pending') === '1') return;
        ad.setAttribute('data-ad-pending', '1');
        window.__adsReady(function(){
          ad.removeAttribute('data-ad-pending');
          if (!ad.isConnected || ad.getAttribute('data-ad-requested') === '1') return;
          ad.setAttribute('data-ad-requested', '1');
          try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
          catch (e) { ad.removeAttribute('data-ad-requested'); }
        });
      };

      window.__initAdSenseSlots = function(root){
        var scope = root || document;
        var ads = [];
        if (scope.matches && scope.matches('ins.adsbygoogle')) ads.push(scope);
        if (scope.querySelectorAll) {
          ads = ads.concat(Array.prototype.slice.call(scope.querySelectorAll('ins.adsbygoogle')));
        }

        ads.forEach(function(ad){
          if (ad.getAttribute('data-ad-watched') === '1') return;
          ad.setAttribute('data-ad-watched', '1');

          function schedule(){
            var media = ad.getAttribute('data-ad-media');
            if (media && window.matchMedia) {
              var query = window.matchMedia(media);
              if (!query.matches) {
                var onChange = function(event){
                  if (!event.matches) return;
                  if (query.removeEventListener) query.removeEventListener('change', onChange);
                  else if (query.removeListener) query.removeListener(onChange);
                  schedule();
                };
                if (query.addEventListener) query.addEventListener('change', onChange);
                else if (query.addListener) query.addListener(onChange);
                return;
              }
            }

            if (ad.getAttribute('data-ad-lazy') === 'true' && 'IntersectionObserver' in window) {
              var observer = new IntersectionObserver(function(entries){
                if (!entries[0].isIntersecting) return;
                observer.disconnect();
                window.__requestAdSenseSlot(ad);
              }, { rootMargin: '600px 0px' });
              observer.observe(ad);
              return;
            }
            window.__requestAdSenseSlot(ad);
          }

          schedule();
        });
      };` : '';

  return `<!-- Ad network runtime: verified library load + deduplicated slot requests -->
  <script>
    (function(){
      window.__adsReady = function(cb){
        var bd = window.botDetector;
        if (!bd) return cb();
        if (bd.isVerified && bd.isVerified()) return cb();
        if (typeof bd.onVerified === 'function') return bd.onVerified(cb);
        cb();
      };
      function loadAdNetwork(){
        if (window.__adNetworkLoaded) return;
        window.__adNetworkLoaded = true;
        var s = document.createElement('script');
        s.src = ${JSON.stringify(src)};
        ${extra}
        document.head.appendChild(s);
      }
      // The preload hint fetches the library early, but execution waits for
      // verification because some networks discover and request slots as soon
      // as their main script runs.
      window.__adsReady(loadAdNetwork);
      ${adsenseRuntime}
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

  return `<!-- Initialize server-rendered AdSense slots once -->
  <script>
    if (window.__initAdSenseSlots) window.__initAdSenseSlots(document);
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
  const media = opts && opts.media ? opts.media : '';
  const slotJson = JSON.stringify(slotId);
  return `<div id="mmt-${slotId}"></div>
    <script type="text/javascript" data-cfasync="false">
    $MMT = window.$MMT || {}; $MMT.cmd = $MMT.cmd || [];
    (function(){
      var slot=${slotJson};
      var row=document.currentScript&&document.currentScript.parentElement;
      var requested=false;
      function push(){
        if (requested) return;
        requested=true;
        $MMT.cmd.push(function(){ $MMT.display.slots.push([slot]); });
      }
      function ready(){ (window.__adsReady||function(c){c();})(push); }
      function load(){
        ${lazy ? `if (row && 'IntersectionObserver' in window) {
          var observer=new IntersectionObserver(function(entries){
            if (!entries[0].isIntersecting) return;
            observer.disconnect(); ready();
          }, { rootMargin: '600px 0px' });
          observer.observe(row); return;
        }` : ''}
        ${idle ? `if ('requestIdleCallback' in window) { requestIdleCallback(ready, { timeout: 3000 }); return; }
        setTimeout(ready, 1200); return;` : ''}
        ready();
      }
      var media=${JSON.stringify(media)};
      if (media && window.matchMedia) {
        var query=window.matchMedia(media);
        if (!query.matches) {
          var onChange=function(event){
            if (!event.matches) return;
            if (query.removeEventListener) query.removeEventListener('change', onChange);
            else if (query.removeListener) query.removeListener(onChange);
            load();
          };
          if (query.addEventListener) query.addEventListener('change', onChange);
          else if (query.addListener) query.addListener(onChange);
          return;
        }
      }
      load();
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
    return `<div class="horizontal-ad-row" data-ad-index="${adIndex}" role="complementary" aria-label="Advertisement">
    ${monumetricSlot(MONU_SLOTS.inContentRepeatable, { lazy: true })}
  </div>`;
  }

  return `<div class="horizontal-ad-row" data-ad-index="${adIndex}" role="complementary" aria-label="Advertisement">
    <ins class="adsbygoogle"
      style="display:block"
      data-ad-client="${ADSENSE_CLIENT}"
      data-ad-slot="${ADSENSE_HORIZONTAL_SLOT}"
      data-ad-format="auto"
      data-ad-lazy="true"
      data-full-width-responsive="true"></ins>
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
    return `<div class="vertical-ad vertical-ad-${side}" role="complementary" aria-label="Advertisement">
      ${monumetricSlot(MONU_SLOTS.pillarLeft, { media: '(min-width: 1280px)' })}
    </div>`;
  }

  return `<div class="vertical-ad vertical-ad-${side}" role="complementary" aria-label="Advertisement">
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="${ADSENSE_CLIENT}"
        data-ad-slot="${ADSENSE_VERTICAL_SLOT}"
        data-ad-format="auto"
        data-ad-media="(min-width: 1280px)"
        data-full-width-responsive="true"></ins>
    </div>`;
}

/**
 * Header banner under the site header. Above the fold — loaded immediately.
 * Monumetric-only.
 */
function generateHeaderBannerAd(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  if (normalizeProvider(adProvider) !== 'monumetric') return '';
  return `<div class="header-banner-ad" role="complementary" aria-label="Advertisement">
    ${monumetricSlot(MONU_SLOTS.headerInScreen)}
  </div>
  <script>document.body.classList.add('has-header-ad');</script>`;
}

/**
 * Bottom leaderboard inline above the footer. Lazy-loaded since it's deep
 * below the fold. Monumetric-only.
 */
function generateBottomLeaderboardAd(adsEnabled, adProvider) {
  if (!adsEnabled) return '';
  if (normalizeProvider(adProvider) !== 'monumetric') return '';
  return `<div class="bottom-leaderboard-ad" role="complementary" aria-label="Advertisement">
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
  const slotId = MONU_SLOTS.footerInScreen;
  return `<div class="footer-inscreen-ad" id="footerInScreenAd" role="complementary" aria-label="Advertisement" hidden>
    <button type="button" class="footer-inscreen-ad__close" aria-label="Close ad" onclick="window.__closeFooterAd()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="footer-inscreen-ad__slot"><div id="mmt-${slotId}"></div></div>
  </div>
  <script type="text/javascript" data-cfasync="false">
  (function(){
    var el = document.getElementById('footerInScreenAd');
    var DISMISS_KEY = 'footerAdClosed';

    window.__closeFooterAd = function(){
      el.classList.remove('footer-inscreen-ad--visible');
      document.body.classList.remove('has-footer-ad');
      try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
      setTimeout(function(){ el.hidden = true; }, 250);
    };

    // Respect an earlier dismissal for the whole tab session — and skip the
    // auction entirely so we don't burn an impression nobody sees.
    var dismissed = false;
    try { dismissed = sessionStorage.getItem(DISMISS_KEY) === '1'; } catch (e) {}
    if (dismissed) { el.remove(); return; }

    function reveal(){
      if (!el.hidden) return;
      el.hidden = false;
      document.body.classList.add('has-footer-ad');
      requestAnimationFrame(function(){ el.classList.add('footer-inscreen-ad--visible'); });
    }
    function watchForFill(){
      var slot = el.querySelector('.footer-inscreen-ad__slot');
      function filled(){ return !!slot.querySelector('iframe, img, video, object, embed'); }
      if (filled()) { reveal(); return; }
      if (!('MutationObserver' in window)) { reveal(); return; }
      var observer = new MutationObserver(function(){
        if (!filled()) return;
        observer.disconnect(); reveal();
      });
      observer.observe(slot, { childList: true, subtree: true });
      setTimeout(function(){ observer.disconnect(); }, 15000);
    }
    function push(){
      $MMT = window.$MMT || {}; $MMT.cmd = $MMT.cmd || [];
      $MMT.cmd.push(function(){ $MMT.display.slots.push([${JSON.stringify(slotId)}]); });
      watchForFill();
    }
    function ready(){ (window.__adsReady||function(c){c();})(push); }
    if ('requestIdleCallback' in window) { requestIdleCallback(ready, { timeout: 3000 }); }
    else { setTimeout(ready, 1200); }
  })();
  </script>`;
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
