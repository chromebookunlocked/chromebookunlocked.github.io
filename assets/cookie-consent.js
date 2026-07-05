/**
 * Cookie Consent Banner
 *
 * GDPR-style consent with equal-prominence Accept/Reject, unchecked
 * non-essential categories by default, and Google Consent Mode v2 updates.
 *
 * Double-banner guard: when the ad network ships its own IAB TCF consent
 * dialog (Monumetric's CMP exposes window.__tcfapi), that CMP is the single
 * source of truth for ad consent and this banner stays hidden so visitors
 * never see two cookie popups. Google tags read the TCF signal natively.
 */

(function () {
  'use strict';

  const COOKIE_NAME = 'cookieConsent';
  const COOKIE_EXPIRY_DAYS = 365;
  // How long to wait for a TCF CMP (e.g. Monumetric's) to announce itself
  // before falling back to our own banner.
  const CMP_WAIT_MS = 4000;
  const CMP_POLL_MS = 250;

  function hasConsent() {
    return getCookie(COOKIE_NAME) !== null;
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
  }

  // A TCF CMP (stub or full) present means another consent dialog owns the
  // ad-consent question on this page.
  function tcfCmpPresent() {
    return typeof window.__tcfapi === 'function';
  }

  function createBanner() {
    if (document.getElementById('cookieConsentBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.className = 'cookie-consent-banner';

    banner.innerHTML = `
      <button type="button" class="cookie-close-btn" id="cookieClose" aria-label="Reject non-essential cookies and close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="cookie-consent-content">
        <h3 class="cookie-consent-title">We value your privacy</h3>
        <p class="cookie-consent-text">
          We use cookies for essential site features, and — with your permission — for
          analytics and advertising. You can accept, reject, or customize non-essential
          cookies. Read our <a href="/important-pages/cookie-policy.html">Cookie Policy</a>.
        </p>
        <div id="cookieMainView">
          <div class="cookie-consent-buttons">
            <button id="cookieDeclineMain" class="cookie-btn cookie-btn-decline">Reject all</button>
            <button id="cookieAccept" class="cookie-btn cookie-btn-accept">Accept all</button>
          </div>
          <button id="cookieOptions" class="cookie-btn cookie-btn-options cookie-btn-full">Manage options</button>
        </div>
        <div id="cookieOptionsView" style="display: none;">
          <div class="cookie-categories">
            <div class="cookie-category">
              <div class="cookie-category-info">
                <p class="cookie-category-name">Essential</p>
                <p class="cookie-category-desc">Required for the site to work</p>
              </div>
              <label class="cookie-toggle">
                <input type="checkbox" checked disabled>
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>
            <div class="cookie-category">
              <div class="cookie-category-info">
                <p class="cookie-category-name">Analytics</p>
                <p class="cookie-category-desc">Help us improve our site</p>
              </div>
              <label class="cookie-toggle">
                <input type="checkbox" id="cookieAnalytics">
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>
            <div class="cookie-category">
              <div class="cookie-category-info">
                <p class="cookie-category-name">Advertising</p>
                <p class="cookie-category-desc">Personalized ads and measurement</p>
              </div>
              <label class="cookie-toggle">
                <input type="checkbox" id="cookieMarketing">
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="cookie-consent-buttons">
            <button id="cookieDecline" class="cookie-btn cookie-btn-decline">Reject all</button>
            <button id="cookieSave" class="cookie-btn cookie-btn-save">Save preferences</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Closing without an explicit choice must NOT count as consent —
    // treat it as reject non-essential.
    document.getElementById('cookieClose').addEventListener('click', function () {
      saveConsent({ essential: true, analytics: false, marketing: false });
    });

    document.getElementById('cookieAccept').addEventListener('click', function () {
      saveConsent({ essential: true, analytics: true, marketing: true });
    });

    document.getElementById('cookieDeclineMain').addEventListener('click', function () {
      saveConsent({ essential: true, analytics: false, marketing: false });
    });

    document.getElementById('cookieOptions').addEventListener('click', function () {
      document.getElementById('cookieMainView').style.display = 'none';
      document.getElementById('cookieOptionsView').style.display = 'block';
    });

    document.getElementById('cookieDecline').addEventListener('click', function () {
      saveConsent({ essential: true, analytics: false, marketing: false });
    });

    document.getElementById('cookieSave').addEventListener('click', function () {
      const analytics = document.getElementById('cookieAnalytics').checked;
      const marketing = document.getElementById('cookieMarketing').checked;
      saveConsent({ essential: true, analytics: analytics, marketing: marketing });
    });

    requestAnimationFrame(() => {
      banner.classList.add('cookie-consent-visible');
    });
  }

  function saveConsent(preferences) {
    preferences.ts = Date.now();
    setCookie(COOKIE_NAME, JSON.stringify(preferences), COOKIE_EXPIRY_DAYS);
    updateConsentMode(preferences);
    hideBanner();
  }

  // Push the visitor's choice into Google Consent Mode v2 so GA/ad tags
  // honor it immediately (the page-level default is set in <head>).
  function updateConsentMode(preferences) {
    if (typeof window.gtag !== 'function') return;
    // When ad storage is denied, also strip identifiers from the pings
    // Google tags still send.
    window.gtag('set', 'ads_data_redaction', preferences.marketing ? false : true);
    window.gtag('consent', 'update', {
      analytics_storage: preferences.analytics ? 'granted' : 'denied',
      ad_storage: preferences.marketing ? 'granted' : 'denied',
      ad_user_data: preferences.marketing ? 'granted' : 'denied',
      ad_personalization: preferences.marketing ? 'granted' : 'denied'
    });
  }

  function hideBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) {
      banner.classList.remove('cookie-consent-visible');
      setTimeout(() => banner.remove(), 350);
    }
  }

  // Show our banner only if no TCF CMP takes over within CMP_WAIT_MS.
  // The CMP stub is injected early by the ad network's script, so in
  // practice this resolves in the first poll or two.
  function showBannerUnlessCmp() {
    let waited = 0;
    (function poll() {
      if (tcfCmpPresent()) return; // Their dialog owns consent — stay hidden.
      if (waited >= CMP_WAIT_MS) {
        createBanner();
        return;
      }
      waited += CMP_POLL_MS;
      setTimeout(poll, CMP_POLL_MS);
    })();
  }

  function init() {
    const policyPages = ['privacy-policy', 'cookie-policy', 'dmca', 'contact', 'terms-of-service'];
    const isPolicyPage = policyPages.some(page => window.location.pathname.includes(page));

    if (!hasConsent() && !isPolicyPage) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBannerUnlessCmp);
      } else {
        showBannerUnlessCmp();
      }
    }
  }

  init();

  window.cookieConsent = {
    accept: function () {
      saveConsent({ essential: true, analytics: true, marketing: true });
    },
    decline: function () {
      saveConsent({ essential: true, analytics: false, marketing: false });
    },
    reset: function () {
      document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
      // If a TCF CMP is running, reopen ITS settings dialog instead of ours
      // so there's a single consent UI.
      if (tcfCmpPresent()) {
        try {
          window.__tcfapi('displayConsentUi', 2, function () {});
          return;
        } catch (e) { /* fall through to our banner */ }
      }
      if (!document.getElementById('cookieConsentBanner')) {
        createBanner();
      }
    },
    hasConsent: hasConsent,
    getConsent: function () {
      const consent = getCookie(COOKIE_NAME);
      if (consent) {
        try {
          return JSON.parse(decodeURIComponent(consent));
        } catch (e) {
          try {
            return JSON.parse(consent);
          } catch (e2) {
            return consent;
          }
        }
      }
      return null;
    }
  };
})();
