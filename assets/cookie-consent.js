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
      <button class="cookie-close-btn" id="cookieConsentClose" aria-label="Accept and close" title="Accept cookies and close">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="cookie-consent-content">
        <div class="cookie-consent-text">
          <h3 id="cookieConsentTitle">🍪 We Value Your Privacy</h3>
          <p id="cookieConsentDescription">
            We use cookies to enhance your gaming experience, remember your preferences, and analyze site traffic.
            By clicking "Accept" or closing this banner, you consent to our use of cookies.
            <a href="/important-pages/cookie-policy.html">Cookie Policy</a>
          </p>
        </div>
        <div class="cookie-consent-buttons" id="cookieButtons">
          <button id="cookieConsentAccept" class="cookie-btn cookie-btn-accept" aria-label="Accept all cookies">
            ✓ Accept
          </button>
          <button id="cookieConsentSettings" class="cookie-btn cookie-btn-settings" aria-label="More settings">
            More Settings
          </button>
        </div>
        <div class="cookie-consent-buttons cookie-settings-expanded" id="cookieSettingsExpanded" style="display: none;">
          <button id="cookieConsentAcceptExpanded" class="cookie-btn cookie-btn-accept" aria-label="Accept all cookies">
            ✓ Accept All
          </button>
          <button id="cookieConsentDecline" class="cookie-btn cookie-btn-decline" aria-label="Decline non-essential cookies">
            Decline
          </button>
          <button id="cookieConsentBack" class="cookie-btn cookie-btn-settings" aria-label="Go back">
            ← Back
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Add event listeners
    document.getElementById('cookieConsentClose').addEventListener('click', function() {
      acceptCookies();
    });

    document.getElementById('cookieConsentAccept').addEventListener('click', function() {
      acceptCookies();
    });

    document.getElementById('cookieConsentAcceptExpanded').addEventListener('click', function() {
      acceptCookies();
    });

    document.getElementById('cookieConsentDecline').addEventListener('click', function() {
      declineCookies();
    });

    document.getElementById('cookieConsentSettings').addEventListener('click', function() {
      toggleSettings();
    });

    document.getElementById('cookieConsentBack').addEventListener('click', function() {
      toggleSettings();
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

  // Toggle settings view
  function toggleSettings() {
    const defaultButtons = document.getElementById('cookieButtons');
    const expandedSettings = document.getElementById('cookieSettingsExpanded');

    if (defaultButtons.style.display === 'none') {
      defaultButtons.style.display = 'flex';
      expandedSettings.style.display = 'none';
    } else {
      defaultButtons.style.display = 'none';
      expandedSettings.style.display = 'flex';
    }
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
