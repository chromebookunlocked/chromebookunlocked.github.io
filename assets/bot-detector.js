/**
 * Cloudflare Turnstile verification gate for Chromebook Unlocked.
 *
 * Designed to stay out of the way for legitimate visitors:
 *   - The page renders normally; nothing is blocked up front.
 *   - Turnstile mounts in a hidden container with `appearance: interaction-only`,
 *     so a managed challenge that auto-passes never shows any UI.
 *   - If the challenge actually requires user interaction, OR if a quick
 *     pre-flight heuristic flags the visitor as obviously bot-like, a
 *     full-screen Cloudflare-style interstitial is shown until the widget
 *     succeeds.
 *   - AdSense is gated on verification but does not block page rendering.
 *
 * Verification is cached in sessionStorage so subsequent navigations within
 * the same tab session pass through silently.
 *
 * Public API (compatible with prior bot-detector.js callers):
 *   window.botDetector.shouldBlockAds()  -> boolean
 *   window.botDetector.isVerified()      -> boolean
 *   window.botDetector.onVerified(cb)    -> register a one-shot callback
 */
(function () {
  var SITEKEY = '0x4AAAAAADFYVNcBHQbRjSvj';
  var STORAGE_KEY = 'cf_turnstile_verified';
  var TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__onTurnstileLoad';
  // If the silent challenge hasn't resolved in this many ms, surface the overlay
  // so the user can interact. Generous because managed challenges can legitimately
  // take a few seconds on slow networks.
  var SILENT_TIMEOUT_MS = 12000;

  var verified = sessionStorage.getItem(STORAGE_KEY) === '1';
  var widgetId = null;
  var overlayEl = null;
  var hiddenHostEl = null;
  var overlayVisible = false;
  var verifiedCallbacks = [];
  var silentTimeoutHandle = null;

  function runVerifiedCallbacks() {
    while (verifiedCallbacks.length) {
      try { verifiedCallbacks.shift()(); } catch (e) {}
    }
  }

  function markVerified() {
    if (silentTimeoutHandle) { clearTimeout(silentTimeoutHandle); silentTimeoutHandle = null; }
    if (verified) return;
    verified = true;
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    if (typeof gtag === 'function') {
      gtag('event', 'turnstile_verified', { event_category: 'security' });
    }
    runVerifiedCallbacks();
    hideOverlay(true);
  }

  /**
   * Quick client-side smell test. Only flags visitors that are clearly automated
   * — real users should never trip this. When it returns true we show the
   * blocking overlay up front; when false we let the page render and run
   * Turnstile silently.
   */
  function looksSuspicious() {
    try {
      if (navigator.webdriver === true) return true;
      var ua = (navigator.userAgent || '').toLowerCase();
      var botPatterns = [
        'headlesschrome', 'phantomjs', 'slimerjs', 'selenium', 'puppeteer',
        'playwright', 'webdriver', 'electron/', 'python-requests', 'curl/',
        'wget/', 'scrapy', 'go-http-client', 'java/'
      ];
      for (var i = 0; i < botPatterns.length; i++) {
        if (ua.indexOf(botPatterns[i]) !== -1) return true;
      }
      // Real browsers expose at least one language preference.
      if (!navigator.languages || navigator.languages.length === 0) return true;
      // Zero-dimension screens are a headless tell.
      if (typeof screen !== 'undefined' && (screen.width === 0 || screen.height === 0)) return true;
    } catch (e) { /* if anything throws, don't penalise the user */ }
    return false;
  }

  function injectStyles() {
    if (document.getElementById('cf-turnstile-styles')) return;
    var style = document.createElement('style');
    style.id = 'cf-turnstile-styles';
    style.textContent = [
      '#cf-turnstile-overlay{position:fixed;inset:0;width:100%;height:100%;background:#f4f4f5;display:flex;align-items:center;justify-content:center;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1f1f1f;animation:cfFadeIn .15s ease;}',
      '#cf-turnstile-overlay.cf-fade-out{animation:cfFadeOut .3s ease forwards;}',
      '@keyframes cfFadeIn{from{opacity:0}to{opacity:1}}',
      '@keyframes cfFadeOut{from{opacity:1}to{opacity:0}}',
      '.cf-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:40px 48px;max-width:480px;width:calc(100% - 32px);text-align:center;}',
      '.cf-host{font-size:22px;font-weight:600;margin:0 0 8px;letter-spacing:-.01em;color:#111;word-break:break-all;}',
      '.cf-sub{margin:0 0 28px;font-size:14px;color:#52525b;line-height:1.5;}',
      '.cf-widget{display:flex;justify-content:center;min-height:65px;margin-bottom:24px;}',
      '.cf-divider{border:0;border-top:1px solid #e5e7eb;margin:24px 0 16px;}',
      '.cf-meta{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#71717a;}',
      '.cf-meta a{color:#71717a;text-decoration:none;}',
      '.cf-meta a:hover{text-decoration:underline;}',
      '.cf-ray{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;}',
      '.cf-perf{display:flex;align-items:center;gap:6px;}',
      '#cf-turnstile-hidden{position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;overflow:hidden;pointer-events:none;opacity:0;}',
      '@media (max-width:520px){.cf-card{padding:32px 24px;}.cf-host{font-size:18px;}}',
      '@media (prefers-color-scheme:dark){#cf-turnstile-overlay{background:#18181b;color:#f4f4f5;}.cf-card{background:#27272a;border-color:#3f3f46;}.cf-host{color:#fafafa;}.cf-sub{color:#a1a1aa;}.cf-divider{border-top-color:#3f3f46;}.cf-meta,.cf-meta a{color:#a1a1aa;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    if (overlayEl) return;
    var host = window.location.hostname || 'this site';
    var ray = (Date.now().toString(16) + Math.random().toString(16).slice(2, 8)).slice(0, 16);

    overlayEl = document.createElement('div');
    overlayEl.id = 'cf-turnstile-overlay';
    overlayEl.style.display = 'none';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'Security verification');
    overlayEl.innerHTML =
      '<div class="cf-card">' +
        '<h1 class="cf-host">' + host + '</h1>' +
        '<p class="cf-sub">Verify you are human by completing the action below.</p>' +
        '<div class="cf-widget" id="cf-turnstile-mount"></div>' +
        '<hr class="cf-divider">' +
        '<div class="cf-meta">' +
          '<span class="cf-ray">' + ray + '</span>' +
          '<span class="cf-perf">Performance &amp; security by ' +
            '<a href="https://www.cloudflare.com?utm_source=challenge" target="_blank" rel="noopener noreferrer">Cloudflare</a>' +
          '</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlayEl);
  }

  function showOverlay() {
    if (verified || overlayVisible) return;
    ensureOverlay();
    overlayEl.style.display = 'flex';
    overlayVisible = true;
    document.documentElement.style.overflow = 'hidden';
    if (document.body) document.body.style.overflow = 'hidden';
  }

  function hideOverlay(removeAfter) {
    if (!overlayEl || !overlayVisible) return;
    overlayVisible = false;
    document.documentElement.style.overflow = '';
    if (document.body) document.body.style.overflow = '';
    if (removeAfter) {
      overlayEl.classList.add('cf-fade-out');
      var el = overlayEl;
      setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 300);
      overlayEl = null;
    } else {
      overlayEl.style.display = 'none';
    }
  }

  /**
   * Render the widget. The mount point is the overlay's mount node when the
   * overlay exists (suspicious or escalated case), otherwise a hidden host
   * pinned off-screen so the widget can run silently without affecting layout.
   */
  function renderWidget() {
    if (verified || !window.turnstile) return;

    var mount;
    if (overlayEl) {
      mount = overlayEl.querySelector('#cf-turnstile-mount');
    } else {
      hiddenHostEl = document.createElement('div');
      hiddenHostEl.id = 'cf-turnstile-hidden';
      document.body.appendChild(hiddenHostEl);
      mount = hiddenHostEl;
    }
    if (!mount) return;

    widgetId = window.turnstile.render(mount, {
      sitekey: SITEKEY,
      theme: 'auto',
      appearance: overlayEl ? 'always' : 'interaction-only',
      callback: function () { markVerified(); },
      'before-interactive-callback': function () {
        // Managed challenge needs user interaction. Move the widget into the
        // overlay so the user can complete it.
        if (verified) return;
        promoteToOverlay();
      },
      'error-callback': function () {
        if (!verified) promoteToOverlay();
      },
      'expired-callback': function () {
        if (widgetId !== null && window.turnstile) {
          try { window.turnstile.reset(widgetId); } catch (e) {}
        }
      },
      'timeout-callback': function () {
        if (!verified) promoteToOverlay();
      }
    });

    // Watchdog: if the silent challenge hasn't finished in time, escalate.
    if (!overlayEl) {
      silentTimeoutHandle = setTimeout(function () {
        if (!verified) promoteToOverlay();
      }, SILENT_TIMEOUT_MS);
    }
  }

  /**
   * Escalate from silent mode to the blocking overlay. Re-renders the widget
   * with `appearance: always` inside the overlay so the interaction is visible.
   */
  function promoteToOverlay() {
    if (verified || overlayVisible) return;
    ensureOverlay();
    showOverlay();

    // Tear down the hidden silent widget and re-render in the overlay.
    if (window.turnstile) {
      if (widgetId !== null) {
        try { window.turnstile.remove(widgetId); } catch (e) {}
        widgetId = null;
      }
    }
    if (hiddenHostEl && hiddenHostEl.parentNode) {
      hiddenHostEl.parentNode.removeChild(hiddenHostEl);
      hiddenHostEl = null;
    }
    if (silentTimeoutHandle) { clearTimeout(silentTimeoutHandle); silentTimeoutHandle = null; }

    var mount = overlayEl.querySelector('#cf-turnstile-mount');
    if (!mount || !window.turnstile) return;
    widgetId = window.turnstile.render(mount, {
      sitekey: SITEKEY,
      theme: 'auto',
      appearance: 'always',
      callback: function () { markVerified(); },
      'error-callback': function () {},
      'expired-callback': function () {
        if (widgetId !== null && window.turnstile) {
          try { window.turnstile.reset(widgetId); } catch (e) {}
        }
      }
    });
  }

  function loadTurnstileScript() {
    if (document.querySelector('script[data-cf-turnstile]')) return;
    var s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-cf-turnstile', '');
    document.head.appendChild(s);
  }

  window.__onTurnstileLoad = function () { renderWidget(); };

  function start() {
    injectStyles();
    if (looksSuspicious()) {
      ensureOverlay();
      showOverlay();
    }
    loadTurnstileScript();
  }

  if (!verified) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  }

  window.botDetector = {
    shouldBlockAds: function () { return !verified; },
    isVerified: function () { return verified; },
    onVerified: function (cb) {
      if (typeof cb !== 'function') return;
      if (verified) cb();
      else verifiedCallbacks.push(cb);
    }
  };
})();
