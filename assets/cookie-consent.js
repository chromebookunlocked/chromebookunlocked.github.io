/**
 * Cookie Consent Banner
 * With cookie category preferences
 */

(function() {
  'use strict';

  const COOKIE_NAME = 'cookieConsent';
  const COOKIE_EXPIRY_DAYS = 365;

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
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;SameSite=Lax`;
  }

  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.className = 'cookie-consent-banner';

    banner.innerHTML = `
      <button class="cookie-close-btn" id="cookieClose" aria-label="Accept and close"></button>

      <div class="cookie-consent-content">
        <h3 class="cookie-consent-title">Cookie Settings</h3>
        <p class="cookie-consent-text">
          We use cookies to enhance your experience. By clicking "Accept" or closing this window, you agree to our use of cookies.
          <a href="/important-pages/cookie-policy.html">Learn more</a>
        </p>

        <div id="cookieMainView">
          <div class="cookie-consent-buttons">
            <button id="cookieOptions" class="cookie-btn cookie-btn-options">More options</button>
            <button id="cookieAccept" class="cookie-btn cookie-btn-accept">Accept</button>
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
                <input type="checkbox" id="cookieAnalytics" checked>
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>

            <div class="cookie-category">
              <div class="cookie-category-info">
                <p class="cookie-category-name">Marketing</p>
                <p class="cookie-category-desc">Personalized ads and content</p>
              </div>
              <label class="cookie-toggle">
                <input type="checkbox" id="cookieMarketing" checked>
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

    // Close button accepts all
    document.getElementById('cookieClose').addEventListener('click', function() {
      saveConsent({ essential: true, analytics: true, marketing: true });
    });

    // Accept button accepts all
    document.getElementById('cookieAccept').addEventListener('click', function() {
      saveConsent({ essential: true, analytics: true, marketing: true });
    });

    // More options shows categories
    document.getElementById('cookieOptions').addEventListener('click', function() {
      document.getElementById('cookieMainView').style.display = 'none';
      document.getElementById('cookieOptionsView').style.display = 'block';
    });

    // Decline all
    document.getElementById('cookieDecline').addEventListener('click', function() {
      saveConsent({ essential: true, analytics: false, marketing: false });
    });

    // Save preferences
    document.getElementById('cookieSave').addEventListener('click', function() {
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
    hideBanner();
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
    accept: function() {
      saveConsent({ essential: true, analytics: true, marketing: true });
    },
    decline: function() {
      saveConsent({ essential: true, analytics: false, marketing: false });
    },
    reset: function() {
      document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
      if (!document.getElementById('cookieConsentBanner')) {
        createBanner();
      }
    },
    hasConsent: hasConsent,
    getConsent: function() {
      const consent = getCookie(COOKIE_NAME);
      if (consent) {
        try {
          return JSON.parse(consent);
        } catch (e) {
          return consent;
        }
      }
      return null;
    }
  };
})();
