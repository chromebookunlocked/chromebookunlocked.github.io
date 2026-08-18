const ADSENSE_CLIENT = 'ca-pub-1033412505744705';
const ADSENSE_HORIZONTAL_SLOT = '2719401053';
const ADSENSE_VERTICAL_SLOT = '9122283604';
const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

function generateAdNetworkHeadHints(adsEnabled = true) {
  if (!adsEnabled) return '';
  return `<meta name="google-adsense-account" content="${ADSENSE_CLIENT}">
  <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>
  <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net">`;
}

function generateAdNetworkHeadScript(adsEnabled = true) {
  if (!adsEnabled) return '';

  return `<script>
  (function () {
    'use strict';

    var SLOT_SELECTOR = 'ins.adsbygoogle[data-ad-client][data-ad-slot]';
    var FILL_TIMEOUT_MS = 18000;
    var scheduledSlots = typeof WeakSet === 'function' ? new WeakSet() : null;
    var trackedSlots = [];
    var adsenseScriptStarted = false;

    window.__activeAdProvider = 'adsense';

    window.__adsReady = function (callback) {
      if (typeof callback !== 'function') return;
      var detector = window.botDetector;
      if (detector && detector.shouldBlockAds && detector.shouldBlockAds()) {
        if (detector.onVerified) detector.onVerified(callback);
        return;
      }
      callback();
    };

    window.__loadAdSenseScript = function () {
      if (adsenseScriptStarted || document.querySelector('script[data-adsense-loader]')) return;
      adsenseScriptStarted = true;
      var script = document.createElement('script');
      script.async = true;
      script.src = '${ADSENSE_SCRIPT_SRC}';
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-adsense-loader', 'true');
      // Use Google's policy-compliant native anchor instead of a custom
      // floating display unit. Google owns sizing, dismissal, and frequency.
      script.setAttribute('data-overlays', 'bottom');
      script.addEventListener('error', function () {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'ad_network_error', {
            event_category: 'ads',
            ad_provider: 'adsense'
          });
        }
      });
      document.head.appendChild(script);
    };

    // The connection is warmed by head hints, but no Google ad code or Auto
    // Ads request starts until Turnstile has verified the session.
    window.__adsReady(window.__loadAdSenseScript);

    function emitFillResult(ad, state) {
      if (ad.getAttribute('data-ad-fill-reported') === state) return;
      ad.setAttribute('data-ad-fill-reported', state);
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'ad_fill_result', {
          event_category: 'ads',
          ad_provider: 'adsense',
          ad_slot: ad.getAttribute('data-ad-slot') || '',
          ad_placement: ad.getAttribute('data-ad-placement') || '',
          fill_state: state
        });
      }
    }

    function creativeIsPresent(ad) {
      var status = ad.getAttribute('data-ad-status');
      return status === 'filled' || !!ad.querySelector('iframe, img, video, object, embed');
    }

    function trackFill(ad) {
      if (ad.getAttribute('data-ad-fill-tracked') === 'true') return;
      ad.setAttribute('data-ad-fill-tracked', 'true');
      ad.setAttribute('data-ad-fill-state', 'pending');
      trackedSlots.push(ad);

      var observer = null;
      var finished = false;
      function finish(state) {
        if (finished) return;
        finished = true;
        ad.setAttribute('data-ad-fill-state', state);
        if (observer) observer.disconnect();
        emitFillResult(ad, state);
      }
      function inspect() {
        if (creativeIsPresent(ad)) finish('filled');
        else if (ad.getAttribute('data-ad-status') === 'unfilled') finish('empty');
      }

      if (typeof MutationObserver === 'function') {
        observer = new MutationObserver(inspect);
        observer.observe(ad, { attributes: true, childList: true, subtree: true });
      }
      window.setTimeout(function () {
        if (!finished) finish(creativeIsPresent(ad) ? 'filled' : 'empty');
      }, FILL_TIMEOUT_MS);
      inspect();
    }

    window.__requestAdSenseSlot = function (ad) {
      if (!ad || ad.getAttribute('data-ad-requested') === 'true' || ad.getAttribute('data-ad-pending') === 'true') return;
      ad.setAttribute('data-ad-pending', 'true');
      window.__adsReady(function () {
        if (ad.getAttribute('data-ad-requested') === 'true') return;
        ad.removeAttribute('data-ad-pending');
        ad.setAttribute('data-ad-requested', 'true');
        trackFill(ad);
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
          ad.setAttribute('data-ad-fill-state', 'empty');
          emitFillResult(ad, 'empty');
        }
      });
    };

    function scheduleSlot(ad) {
      if (!ad || (scheduledSlots && scheduledSlots.has(ad))) return;
      if (scheduledSlots) scheduledSlots.add(ad);

      var start = function () {
        var request = function () { window.__requestAdSenseSlot(ad); };
        if (ad.getAttribute('data-ad-lazy') === 'true' && 'IntersectionObserver' in window) {
          var lazyObserver = new IntersectionObserver(function (entries) {
            if (entries[0] && entries[0].isIntersecting) {
              lazyObserver.disconnect();
              request();
            }
          }, { rootMargin: '600px 0px' });
          lazyObserver.observe(ad);
        } else if (ad.getAttribute('data-ad-idle') === 'true' && 'requestIdleCallback' in window) {
          window.requestIdleCallback(request, { timeout: 2000 });
        } else {
          request();
        }
      };

      var media = ad.getAttribute('data-ad-media');
      if (media && window.matchMedia) {
        var query = window.matchMedia(media);
        if (!query.matches) {
          var onChange = function (event) {
            if (!event.matches) return;
            if (query.removeEventListener) query.removeEventListener('change', onChange);
            else if (query.removeListener) query.removeListener(onChange);
            start();
          };
          if (query.addEventListener) query.addEventListener('change', onChange);
          else if (query.addListener) query.addListener(onChange);
          return;
        }
      }
      start();
    }

    window.__initAdSenseSlots = function (root) {
      var scope = root || document;
      if (scope.matches && scope.matches(SLOT_SELECTOR)) scheduleSlot(scope);
      if (!scope.querySelectorAll) return;
      var slots = scope.querySelectorAll(SLOT_SELECTOR);
      for (var i = 0; i < slots.length; i += 1) scheduleSlot(slots[i]);
    };

    window.__getAdFillStatus = function () {
      return {
        activeProvider: 'adsense',
        adsense: trackedSlots.map(function (ad) {
          return {
            slot: ad.getAttribute('data-ad-slot') || '',
            placement: ad.getAttribute('data-ad-placement') || '',
            state: ad.getAttribute('data-ad-fill-state') || 'pending'
          };
        })
      };
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { window.__initAdSenseSlots(document); });
    } else {
      window.__initAdSenseSlots(document);
    }
  })();
  </script>`;
}

function generateAdSenseSlot(slotId, options = {}) {
  const attributes = [
    'class="adsbygoogle"',
    'style="display:block"',
    `data-ad-client="${ADSENSE_CLIENT}"`,
    `data-ad-slot="${slotId}"`,
    'data-ad-format="auto"',
    'data-full-width-responsive="true"'
  ];
  if (options.lazy) attributes.push('data-ad-lazy="true"');
  if (options.idle) attributes.push('data-ad-idle="true"');
  if (options.media) attributes.push(`data-ad-media="${options.media}"`);
  if (options.placement) attributes.push(`data-ad-placement="${options.placement}"`);
  return `<ins ${attributes.join('\n       ')}></ins>`;
}

function generateHorizontalAd(adIndex, adsEnabled = true) {
  if (!adsEnabled) return '';
  return `<div class="horizontal-ad-row" data-ad-index="${adIndex}" role="complementary" aria-label="Advertisement">
    ${generateAdSenseSlot(ADSENSE_HORIZONTAL_SLOT, { lazy: true, placement: 'in_content' })}
  </div>`;
}

function generateVerticalAd(adsEnabled = true, side = 'left') {
  if (!adsEnabled) return '';
  return `<aside class="vertical-ad vertical-ad--${side}" role="complementary" aria-label="Advertisement">
    ${generateAdSenseSlot(ADSENSE_VERTICAL_SLOT, { lazy: true, media: '(min-width: 1280px)', placement: `game_pillar_${side}` })}
  </aside>`;
}

function generateHeaderBannerAd(adsEnabled = true) {
  if (!adsEnabled) return '';
  return `<div class="header-banner-ad" role="complementary" aria-label="Advertisement">
    ${generateAdSenseSlot(ADSENSE_HORIZONTAL_SLOT, { media: '(min-height: 521px), (min-width: 951px)', placement: 'header' })}
  </div>`;
}

function generateBottomLeaderboardAd(adsEnabled = true) {
  if (!adsEnabled) return '';
  return `<div class="bottom-leaderboard-ad" role="complementary" aria-label="Advertisement">
    ${generateAdSenseSlot(ADSENSE_HORIZONTAL_SLOT, { lazy: true, placement: 'bottom' })}
  </div>`;
}

module.exports = {
  ADSENSE_CLIENT,
  ADSENSE_HORIZONTAL_SLOT,
  ADSENSE_VERTICAL_SLOT,
  ADSENSE_SCRIPT_SRC,
  generateAdNetworkHeadHints,
  generateAdNetworkHeadScript,
  generateHorizontalAd,
  generateVerticalAd,
  generateHeaderBannerAd,
  generateBottomLeaderboardAd
};
