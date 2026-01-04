/**
 * Cookie Consent Banner
 * Clean, minimal implementation
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
      <div class="cookie-consent-content">
        <p class="cookie-consent-text">
          We use cookies to improve your experience.
          <a href="/important-pages/cookie-policy.html">Learn more</a>
        </p>
        <div class="cookie-consent-buttons" id="cookieMainButtons">
          <button id="cookieOptions" class="cookie-btn cookie-btn-options">More options</button>
          <button id="cookieAccept" class="cookie-btn cookie-btn-accept">Accept</button>
        </div>
        <div class="cookie-consent-buttons" id="cookieExpandedButtons" style="display: none;">
          <button id="cookieDecline" class="cookie-btn cookie-btn-decline">Decline</button>
          <button id="cookieAcceptAll" class="cookie-btn cookie-btn-accept">Accept</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('cookieAccept').addEventListener('click', function() {
      setCookie(COOKIE_NAME, 'accepted', COOKIE_EXPIRY_DAYS);
      hideBanner();
    });

    document.getElementById('cookieAcceptAll').addEventListener('click', function() {
      setCookie(COOKIE_NAME, 'accepted', COOKIE_EXPIRY_DAYS);
      hideBanner();
    });

    document.getElementById('cookieDecline').addEventListener('click', function() {
      setCookie(COOKIE_NAME, 'declined', COOKIE_EXPIRY_DAYS);
      hideBanner();
    });

    document.getElementById('cookieOptions').addEventListener('click', function() {
      document.getElementById('cookieMainButtons').style.display = 'none';
      document.getElementById('cookieExpandedButtons').style.display = 'flex';
    });

    requestAnimationFrame(() => {
      banner.classList.add('cookie-consent-visible');
    });
  }

  function hideBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) {
      banner.classList.remove('cookie-consent-visible');
      setTimeout(() => banner.remove(), 300);
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
      setCookie(COOKIE_NAME, 'accepted', COOKIE_EXPIRY_DAYS);
      hideBanner();
    },
    decline: function() {
      setCookie(COOKIE_NAME, 'declined', COOKIE_EXPIRY_DAYS);
      hideBanner();
    },
    reset: function() {
      document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
      if (!document.getElementById('cookieConsentBanner')) {
        createBanner();
      }
    },
    hasConsent: hasConsent,
    getConsent: function() {
      return getCookie(COOKIE_NAME);
    }
  };
})();
