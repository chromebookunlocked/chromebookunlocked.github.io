/**
 * Cookie Consent Banner
 * With cookie category preferences
 */

(function () {
  'use strict';

  const COOKIE_NAME = 'cookieConsent';
  const COOKIE_EXPIRY_DAYS = 365;

  function hasConsent() {
    return getSavedPreferences() !== null;
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const raw = parts.pop().split(';').shift();
      try { return decodeURIComponent(raw); } catch (e) { return raw; }
    }
    return null;
  }

  function getSavedPreferences() {
    const consent = getCookie(COOKIE_NAME);
    if (!consent) return null;
    try {
      const parsed = JSON.parse(consent);
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        essential: true,
        analytics: parsed.analytics === true,
        marketing: parsed.marketing === true
      };
    } catch (e) {
      return null;
    }
  }

  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const secure = window.location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax${secure}`;
  }

  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.className = 'cookie-consent-banner';

    banner.innerHTML = `
      <button type="button" class="cookie-close-btn" id="cookieClose" aria-label="Close and use essential cookies only">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="cookie-consent-content">
        <h3 class="cookie-consent-title">Cookie Settings</h3>
        <p class="cookie-consent-text">
          Choose whether we may use analytics and advertising cookies. Closing this window keeps only essential storage enabled.
          <a href="/important-pages/cookie-policy.html">Learn more</a>
        </p>
        <div id="cookieMainView">
          <div class="cookie-consent-buttons">
            <button id="cookieOptions" class="cookie-btn cookie-btn-options">More options</button>
            <button id="cookieDeclineMain" class="cookie-btn cookie-btn-decline">Reject all</button>
            <button id="cookieAccept" class="cookie-btn cookie-btn-accept">Accept all</button>
          </div>
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
                <p class="cookie-category-name">Marketing</p>
                <p class="cookie-category-desc">Personalized ads and content</p>
              </div>
              <label class="cookie-toggle">
                <input type="checkbox" id="cookieMarketing">
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="cookie-consent-buttons">
            <button id="cookieDecline" class="cookie-btn cookie-btn-decline">Decline all</button>
            <button id="cookieSave" class="cookie-btn cookie-btn-save">Save preferences</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Dismissing a consent prompt is not affirmative consent.
    document.getElementById('cookieClose').addEventListener('click', function () {
      saveConsent({ essential: true, analytics: false, marketing: false });
    });

    // Accept button accepts all
    document.getElementById('cookieAccept').addEventListener('click', function () {
      saveConsent({ essential: true, analytics: true, marketing: true });
    });

    document.getElementById('cookieDeclineMain').addEventListener('click', function () {
      saveConsent({ essential: true, analytics: false, marketing: false });
    });

    // More options shows categories
    document.getElementById('cookieOptions').addEventListener('click', function () {
      document.getElementById('cookieMainView').style.display = 'none';
      document.getElementById('cookieOptionsView').style.display = 'block';
    });

    // Decline all
    document.getElementById('cookieDecline').addEventListener('click', function () {
      saveConsent({ essential: true, analytics: false, marketing: false });
    });

    // Save preferences
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
    setCookie(COOKIE_NAME, JSON.stringify(preferences), COOKIE_EXPIRY_DAYS);
    updateConsentMode(preferences);
    try {
      window.dispatchEvent(new CustomEvent('cookieconsentchange', { detail: preferences }));
    } catch (e) {}
    hideBanner();
  }

  // Push the visitor's choice into Google Consent Mode v2 so GA/ad tags
  // honor it immediately (the page-level default is set in <head>).
  function updateConsentMode(preferences) {
    if (typeof window.gtag !== 'function') return;
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

  function init() {
    const policyPages = ['privacy-policy', 'cookie-policy', 'dmca', 'contact', 'terms-of-service'];
    const isPolicyPage = policyPages.some(page => window.location.pathname.includes(page));

    if (!hasConsent() && !isPolicyPage) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBanner);
      } else {
        createBanner();
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
      if (!document.getElementById('cookieConsentBanner')) {
        createBanner();
      }
    },
    hasConsent: hasConsent,
    getConsent: function () {
      return getSavedPreferences();
    }
  };
})();
