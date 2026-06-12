/**
 * Cloudflare Turnstile verification gate for Chromebook Unlocked.
 *
 * Runs Turnstile INVISIBLY on first page load of a session. Most human
 * visitors are cleared by the non-interactive challenge and never see
 * anything — ads simply load a moment later once the success callback fires.
 * The full-screen interstitial is only revealed if Turnstile decides the
 * visitor needs to interact (i.e. the traffic looks risky/bot-like).
 * Verification is cached in sessionStorage so subsequent navigations within
 * the same tab session pass through instantly.
 *
 * Public API (kept compatible with prior bot-detector.js callers):
 *   window.botDetector.shouldBlockAds()  -> boolean
 *   window.botDetector.isVerified()      -> boolean
 *   window.botDetector.onVerified(cb)    -> register a one-shot callback
 */
(function () {
  var SITEKEY = '0x4AAAAAADFYVNcBHQbRjSvj';
  var STORAGE_KEY = 'cf_turnstile_verified';
  var TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__onTurnstileLoad';

  // Monumetric's ad-ops team reviews placements with their placement helper
  // (?mmt-ph=...). Let that traffic skip the challenge so they can always see
  // the ad slots; the session is marked verified so navigation stays open.
  var isAdOpsReview = /[?&]mmt-ph=/.test(window.location.search);

  var verified = isAdOpsReview || sessionStorage.getItem(STORAGE_KEY) === '1';
  if (isAdOpsReview) {
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }
  var widgetId = null;
  var overlayEl = null;       // the (hidden-by-default) interstitial
  var hostEl = null;          // wrapper that holds the widget mount
  var interactive = false;    // has the challenge escalated to a visible prompt?
  var verifiedCallbacks = [];

  function runVerifiedCallbacks() {
    while (verifiedCallbacks.length) {
      try { verifiedCallbacks.shift()(); } catch (e) {}
    }
  }

  function markVerified() {
    if (verified) return;
    verified = true;
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    if (typeof gtag === 'function') {
      gtag('event', 'turnstile_verified', { event_category: 'security' });
    }
    runVerifiedCallbacks();
    dismissOverlay();
  }

  // Reveal the interstitial only when the challenge actually needs interaction.
  function showInteractive() {
    if (interactive || verified || !overlayEl) return;
    interactive = true;
    overlayEl.classList.remove('cf-invisible');
    document.documentElement.style.overflow = 'hidden';
    if (document.body) document.body.style.overflow = 'hidden';
    if (typeof gtag === 'function') {
      gtag('event', 'turnstile_interactive', { event_category: 'security' });
    }
  }

  function dismissOverlay() {
    if (!overlayEl) return;
    var el = overlayEl;
    overlayEl = null;
    if (interactive) {
      el.classList.add('cf-fade-out');
      setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 300);
    } else if (el.parentNode) {
      // Never shown — remove immediately, no animation.
      el.parentNode.removeChild(el);
    }
    document.documentElement.style.overflow = '';
    document.body && (document.body.style.overflow = '');
  }

  function injectStyles() {
    if (document.getElementById('cf-turnstile-styles')) return;
    var style = document.createElement('style');
    style.id = 'cf-turnstile-styles';
    style.textContent = [
      // The overlay starts invisible: it occupies no visual space and ignores
      // pointer events, but stays in the DOM so Turnstile can run its
      // non-interactive challenge inside it.
      '#cf-turnstile-overlay{position:fixed;inset:0;width:100%;height:100%;background:#f4f4f5;display:flex;align-items:center;justify-content:center;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1f1f1f;animation:cfFadeIn .15s ease;}',
      '#cf-turnstile-overlay.cf-invisible{opacity:0;pointer-events:none;background:transparent;}',
      '#cf-turnstile-overlay.cf-invisible .cf-card{opacity:0;pointer-events:none;}',
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
      '.cf-perf-logo{width:14px;height:14px;display:inline-block;}',
      '@media (max-width:520px){.cf-card{padding:32px 24px;}.cf-host{font-size:18px;}}',
      '@media (prefers-color-scheme:dark){#cf-turnstile-overlay{background:#18181b;color:#f4f4f5;}.cf-card{background:#27272a;border-color:#3f3f46;}.cf-host{color:#fafafa;}.cf-sub{color:#a1a1aa;}.cf-divider{border-top-color:#3f3f46;}.cf-meta,.cf-meta a{color:#a1a1aa;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function buildOverlay() {
    injectStyles();
    var host = window.location.hostname || 'this site';
    var ray = (Date.now().toString(16) + Math.random().toString(16).slice(2, 8)).slice(0, 16);

    overlayEl = document.createElement('div');
    overlayEl.id = 'cf-turnstile-overlay';
    // Start hidden — only revealed if the challenge needs interaction.
    overlayEl.className = 'cf-invisible';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'Security verification');
    overlayEl.innerHTML =
      '<div class="cf-card">' +
        '<h1 class="cf-host">' + host + '</h1>' +
        '<p class="cf-sub">Verify you are human by completing the action below.</p>' +
        '<div class="cf-widget" id="cf-turnstile-widget"></div>' +
        '<hr class="cf-divider">' +
        '<div class="cf-meta">' +
          '<span class="cf-ray">' + ray + '</span>' +
          '<span class="cf-perf">Performance &amp; security by ' +
            '<a href="https://www.cloudflare.com?utm_source=challenge" target="_blank" rel="noopener noreferrer">Cloudflare</a>' +
          '</span>' +
        '</div>' +
      '</div>';

    hostEl = overlayEl;
    if (document.body) {
      document.body.appendChild(overlayEl);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(overlayEl);
      });
    }
  }

  function renderWidget() {
    if (!overlayEl) return;
    var mount = document.getElementById('cf-turnstile-widget');
    if (!mount || !window.turnstile) return;
    widgetId = window.turnstile.render(mount, {
      sitekey: SITEKEY,
      theme: 'auto',
      // 'interaction-only' keeps the widget invisible while the
      // non-interactive challenge runs; it only renders a prompt if the
      // visitor must interact. Pair with a "Managed" widget in the
      // Cloudflare dashboard for the silent-for-humans behaviour.
      appearance: 'interaction-only',
      callback: function () { markVerified(); },
      // Fired right before Turnstile shows an interactive challenge — this is
      // our cue to reveal the interstitial so the user can complete it.
      'before-interactive-callback': function () { showInteractive(); },
      'error-callback': function () {
        // If the challenge errors out, surface the UI so the user can retry
        // rather than leaving them silently blocked from ads.
        showInteractive();
      },
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

  if (!verified) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        buildOverlay();
        loadTurnstileScript();
      });
    } else {
      buildOverlay();
      loadTurnstileScript();
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
