/**
 * Ad provider abstraction.
 *
 * The site supports two ad networks: AdSense and Monumetric. The primary
 * provider and optional script-failure fallback are configured in
 * `ads-config.json`.
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

function normalizeFallbackProvider(adProvider, fallbackAdProvider) {
  return normalizeProvider(adProvider) === 'monumetric' && fallbackAdProvider === 'adsense'
    ? 'adsense'
    : null;
}

/**
 * Resource hints for the active ad network: dns-prefetch + preconnect for
 * the provider's origin, preload for the main script, and preconnect for
 * the most common ad-exchange endpoints. Saves ~200-500ms on first ad fill.
 */
function generateAdNetworkHeadHints(adsEnabled, adProvider, fallbackAdProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);
  const fallback = normalizeFallbackProvider(adProvider, fallbackAdProvider);

  if (provider === 'monumetric') {
    // Monumetric's own snippet loads the script without crossorigin, so the
    // preload must match (no crossorigin) for the browser to reuse it instead
    // of double-fetching.
    return `<link rel="dns-prefetch" href="https://monu.delivery">
  <link rel="preconnect" href="https://monu.delivery">
  <link rel="preload" as="script" href="${MONU_SCRIPT_SRC}">
  <link rel="dns-prefetch" href="https://securepubads.g.doubleclick.net">
  <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net">${fallback ? `
  <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com">
  <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>` : ''}`;
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
function generateAdNetworkHeadScript(adsEnabled, adProvider, fallbackAdProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);
  const fallback = normalizeFallbackProvider(adProvider, fallbackAdProvider);
  const adsenseRuntime = provider === 'adsense' || fallback === 'adsense' ? `
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
      };

      window.__prepareAdProviderFallbacks = function(root){
        var scope = root || document;
        if (window.__activeAdProvider !== 'adsense') return;
        var stacks = [];
        if (scope.matches && scope.matches('[data-ad-provider-stack]')) stacks.push(scope);
        if (scope.querySelectorAll) {
          stacks = stacks.concat(Array.prototype.slice.call(scope.querySelectorAll('[data-ad-provider-stack]')));
          Array.prototype.forEach.call(scope.querySelectorAll('[data-ad-primary-only]'), function(primaryOnly){
            primaryOnly.hidden = true;
          });
        }
        stacks.forEach(function(stack){
          var primary = stack.querySelector('[data-ad-primary]');
          var fallbackSlot = stack.querySelector('[data-ad-fallback]');
          if (primary) primary.hidden = true;
          if (fallbackSlot) fallbackSlot.hidden = false;
        });
        window.__initAdSenseSlots(scope);
      };

      window.__loadAdSenseNetwork = function(onReady){
        if (window.__adsenseNetworkReady) {
          if (onReady) onReady();
          return;
        }
        if (onReady) {
          window.__adsenseReadyCallbacks = window.__adsenseReadyCallbacks || [];
          window.__adsenseReadyCallbacks.push(onReady);
        }
        if (window.__adsenseNetworkLoading) return;
        window.__adsenseNetworkLoading = true;
        var adsenseScript = document.createElement('script');
        adsenseScript.src = ${JSON.stringify(ADSENSE_SCRIPT_SRC)};
        adsenseScript.async = true;
        adsenseScript.crossOrigin = 'anonymous';
        adsenseScript.onload = function(){
          window.__adsenseNetworkReady = true;
          var callbacks = window.__adsenseReadyCallbacks || [];
          window.__adsenseReadyCallbacks = [];
          callbacks.forEach(function(callback){ callback(); });
        };
        adsenseScript.onerror = function(){ window.__adsenseNetworkLoading = false; };
        document.head.appendChild(adsenseScript);
      };

      window.__activateAdSenseFallback = function(reason){
        if (${JSON.stringify(fallback)} !== 'adsense' || window.__activeAdProvider === 'adsense') return;
        window.__activeAdProvider = 'adsense';
        document.documentElement.setAttribute('data-ad-provider-active', 'adsense');
        window.__prepareAdProviderFallbacks(document);
        window.__loadAdSenseNetwork(function(){ window.__initAdSenseSlots(document); });
        try {
          window.dispatchEvent(new CustomEvent('adproviderchange', { detail: { provider: 'adsense', reason: reason || 'primary-error' } }));
        } catch (e) {}
      };` : '';

  return `<!-- Ad network runtime: verified library load + deduplicated slot requests -->
  <script>
    (function(){
      window.__activeAdProvider = ${JSON.stringify(provider)};
      document.documentElement.setAttribute('data-ad-provider-active', window.__activeAdProvider);
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
        if (${JSON.stringify(provider)} === 'adsense') {
          window.__loadAdSenseNetwork(function(){ window.__initAdSenseSlots(document); });
          return;
        }
        var s = document.createElement('script');
        s.src = ${JSON.stringify(MONU_SCRIPT_SRC)};
        s.async=true;s.setAttribute('data-cfasync','false');
        s.onload = function(){ window.__primaryAdNetworkReady = true; };
        s.onerror = function(){
          window.__primaryAdNetworkFailed = true;
          if (window.__activateAdSenseFallback) window.__activateAdSenseFallback('script-error');
        };
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
function generateAdNetworkInitScript(adsEnabled, adProvider, fallbackAdProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);
  const fallback = normalizeFallbackProvider(adProvider, fallbackAdProvider);
  if (provider !== 'adsense' && fallback !== 'adsense') return '';

  return `<!-- Initialize AdSense only when it is the active provider -->
  <script>
    if (window.__activeAdProvider === 'adsense') {
      if (window.__prepareAdProviderFallbacks) window.__prepareAdProviderFallbacks(document);
      else if (window.__initAdSenseSlots) window.__initAdSenseSlots(document);
    }
  </script>`;
}

/**
 * Inline Monumetric slot markup with three load strategies. In every case the
 * actual slot request runs through window.__adsReady(), so it only fires once
 * the visitor is Turnstile-verified.
 *   - default (immediate): request the slot as soon as it's verified. Use
 *     above the fold.
 *   - { lazy: true }: also wait until the wrapping element is within 600px of
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

function adsenseSlot(slotId, opts) {
  const lazy = opts && opts.lazy === true;
  const media = opts && opts.media ? opts.media : '';
  return `<ins class="adsbygoogle"
      style="display:block"
      data-ad-client="${ADSENSE_CLIENT}"
      data-ad-slot="${slotId}"
      data-ad-format="auto"${lazy ? '\n      data-ad-lazy="true"' : ''}${media ? `\n      data-ad-media="${media}"` : ''}
      data-full-width-responsive="true"></ins>`;
}

function withAdSenseFallback(primaryMarkup, fallbackMarkup, adProvider, fallbackAdProvider) {
  if (normalizeProvider(adProvider) !== 'monumetric' ||
      normalizeFallbackProvider(adProvider, fallbackAdProvider) !== 'adsense') {
    return primaryMarkup;
  }
  return `<div data-ad-provider-stack>
      <div data-ad-primary>${primaryMarkup}</div>
      <div data-ad-fallback hidden>${fallbackMarkup}</div>
    </div>`;
}

/**
 * Horizontal ad row that sits between rows of game cards. Lazy-loaded on
 * Monumetric since these are below the fold on initial paint.
 */
function generateHorizontalAd(adIndex, adsEnabled, adProvider, fallbackAdProvider) {
  if (!adsEnabled) return '';
  const provider = normalizeProvider(adProvider);

  if (provider === 'monumetric') {
    return `<div class="horizontal-ad-row" data-ad-index="${adIndex}" role="complementary" aria-label="Advertisement">
    ${withAdSenseFallback(
      monumetricSlot(MONU_SLOTS.inContentRepeatable, { lazy: true }),
      adsenseSlot(ADSENSE_HORIZONTAL_SLOT, { lazy: true }),
      adProvider,
      fallbackAdProvider
    )}
  </div>`;
  }

  return `<div class="horizontal-ad-row" data-ad-index="${adIndex}" role="complementary" aria-label="Advertisement">
    ${adsenseSlot(ADSENSE_HORIZONTAL_SLOT, { lazy: true })}
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
      return `<div class="vertical-ad vertical-ad-spacer" data-ad-primary-only aria-hidden="true"></div>`;
    }
    return `<div class="vertical-ad vertical-ad-${side}" data-ad-primary-only role="complementary" aria-label="Advertisement">
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
  return `<div class="header-banner-ad" data-ad-primary-only role="complementary" aria-label="Advertisement">
    ${monumetricSlot(MONU_SLOTS.headerInScreen, { media: '(min-height: 521px), (min-width: 951px)' })}
  </div>
  <script>document.body.classList.add('has-header-ad');</script>`;
}

/**
 * Bottom leaderboard inline above the footer. Lazy-loaded since it's deep
 * below the fold. Monumetric-only.
 */
function generateBottomLeaderboardAd(adsEnabled, adProvider, fallbackAdProvider) {
  if (!adsEnabled) return '';
  if (normalizeProvider(adProvider) !== 'monumetric') return '';
  return `<div class="bottom-leaderboard-ad" role="complementary" aria-label="Advertisement">
    ${withAdSenseFallback(
      monumetricSlot(MONU_SLOTS.bottomLeaderboard, { lazy: true }),
      adsenseSlot(ADSENSE_HORIZONTAL_SLOT, { lazy: true }),
      adProvider,
      fallbackAdProvider
    )}
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
  return `<div class="footer-inscreen-ad" id="footerInScreenAd" data-ad-primary-only role="complementary" aria-label="Advertisement" hidden>
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
  normalizeProvider,
  normalizeFallbackProvider
};
