/**
 * Cookie Consent Banner for ChromebookUnlocked.Github.io
 * GDPR-compliant cookie consent management
 */

(function() {
  'use strict';

  const COOKIE_NAME = 'cookieConsent';
  const COOKIE_EXPIRY_DAYS = 365;

  // Check if consent has already been given
  function hasConsent() {
    const consent = getCookie(COOKIE_NAME);
    return consent !== null;
  }

  // Get cookie value
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  // Set cookie
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
  }

  // Create the banner HTML
  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cookieConsentTitle');
    banner.setAttribute('aria-describedby', 'cookieConsentDescription');
    banner.className = 'cookie-consent-banner';

    banner.innerHTML = `
      <div class="cookie-consent-content">
        <div class="cookie-consent-text">
          <h3 id="cookieConsentTitle">🍪 We Use Cookies</h3>
          <p id="cookieConsentDescription">
            We use cookies to enhance your experience, remember your preferences, and analyze site traffic.
            By clicking "Accept All", you consent to our use of cookies.
            <a href="cookie-policy.html" target="_blank">Learn more</a>
          </p>
        </div>
        <div class="cookie-consent-buttons">
          <button id="cookieConsentAccept" class="cookie-btn cookie-btn-accept" aria-label="Accept all cookies">
            Accept All
          </button>
          <button id="cookieConsentDecline" class="cookie-btn cookie-btn-decline" aria-label="Decline non-essential cookies">
            Decline
          </button>
          <button id="cookieConsentSettings" class="cookie-btn cookie-btn-settings" aria-label="Customize cookie settings">
            Settings
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Add event listeners
    document.getElementById('cookieConsentAccept').addEventListener('click', function() {
      acceptCookies();
    });

    document.getElementById('cookieConsentDecline').addEventListener('click', function() {
      declineCookies();
    });

    document.getElementById('cookieConsentSettings').addEventListener('click', function() {
      openCookieSettings();
    });

    // Animate in
    setTimeout(() => {
      banner.classList.add('cookie-consent-visible');
    }, 100);
  }

  // Accept cookies
  function acceptCookies() {
    setCookie(COOKIE_NAME, 'accepted', COOKIE_EXPIRY_DAYS);
    hideBanner();
    // Initialize analytics or other tracking here if needed
    console.log('Cookies accepted');
  }

  // Decline cookies
  function declineCookies() {
    setCookie(COOKIE_NAME, 'declined', COOKIE_EXPIRY_DAYS);
    hideBanner();
    console.log('Cookies declined');
  }

  // Open cookie settings (redirect to cookie policy page)
  function openCookieSettings() {
    window.open('cookie-policy.html', '_blank');
  }

  // Hide banner
  function hideBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) {
      banner.classList.remove('cookie-consent-visible');
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }

  // Create settings link in footer
  function createSettingsLink() {
    // Check if there's already a settings link
    if (document.getElementById('cookieSettingsLink')) {
      return;
    }

    const settingsLink = document.createElement('a');
    settingsLink.id = 'cookieSettingsLink';
    settingsLink.href = '#';
    settingsLink.textContent = 'Cookie Settings';
    settingsLink.className = 'cookie-settings-link';
    settingsLink.setAttribute('aria-label', 'Manage cookie preferences');

    settingsLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Remove existing consent and show banner again
      document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      if (!document.getElementById('cookieConsentBanner')) {
        createBanner();
      }
    });

    // Try to add to footer if it exists
    const footer = document.querySelector('footer');
    if (footer) {
      const separator = document.createTextNode(' | ');
      footer.appendChild(separator);
      footer.appendChild(settingsLink);
    }
  }

  // Initialize
  function init() {
    // Don't show banner on policy pages
    const currentPage = window.location.pathname;
    const policyPages = ['privacy-policy.html', 'cookie-policy.html', 'dmca.html', 'contact.html'];
    const isPolicyPage = policyPages.some(page => currentPage.includes(page));

    if (!hasConsent() && !isPolicyPage) {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBanner);
      } else {
        createBanner();
      }
    }

    // Always create settings link after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createSettingsLink);
    } else {
      createSettingsLink();
    }
  }

  // Start initialization
  init();

  // Expose functions globally for manual control if needed
  window.cookieConsent = {
    accept: acceptCookies,
    decline: declineCookies,
    reset: function() {
      document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
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
