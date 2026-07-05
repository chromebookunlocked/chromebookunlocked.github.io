/**
 * Simplified Google Analytics 4 tracking module
 * Focuses on core metrics without double counting
 */

/**
 * Google Consent Mode v2 defaults. Must be emitted BEFORE the gtag.js
 * loader so the default state applies to the very first hit. Defaults to
 * denied, then restores the visitor's saved choice from the cookieConsent
 * cookie (set by assets/cookie-consent.js). The banner's accept/decline
 * pushes live updates via gtag('consent','update',...).
 */
function generateConsentModeScript() {
  return `<!-- Google Consent Mode v2: default denied, restore saved choice -->
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    (function(){
      var saved = null;
      try {
        var m = ('; ' + document.cookie).split('; cookieConsent=');
        if (m.length === 2) saved = JSON.parse(decodeURIComponent(m.pop().split(';').shift()));
      } catch (e) {}
      var analytics = saved ? saved.analytics === true : false;
      var marketing = saved ? saved.marketing === true : false;
      gtag('consent', 'default', {
        analytics_storage: analytics ? 'granted' : 'denied',
        ad_storage: marketing ? 'granted' : 'denied',
        ad_user_data: marketing ? 'granted' : 'denied',
        ad_personalization: marketing ? 'granted' : 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
        wait_for_update: saved ? 0 : 500
      });
    })();
  </script>`;
}

function generateAnalyticsScript() {
  return `
<script>
  // Simple Analytics Tracking - Core Metrics Only
  (function() {
    // Session management (for proper user tracking, but no extra events)
    function getSessionId() {
      const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
      let sessionData = sessionStorage.getItem('ga_session_data');

      if (sessionData) {
        try {
          const data = JSON.parse(sessionData);
          const now = Date.now();

          // Check if session is still valid
          if (now - data.lastActivity < SESSION_DURATION) {
            data.lastActivity = now;
            sessionStorage.setItem('ga_session_data', JSON.stringify(data));
            return data.sessionId;
          }
        } catch (e) {
          // Create new session on error
        }
      }

      // Create new session
      const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const newSessionData = {
        sessionId: newSessionId,
        startTime: Date.now(),
        lastActivity: Date.now()
      };
      sessionStorage.setItem('ga_session_data', JSON.stringify(newSessionData));

      return newSessionId;
    }

    // Get or create user ID for tracking across sessions
    function getUserId() {
      let userId = localStorage.getItem('ga_user_id');
      if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('ga_user_id', userId);
      }
      return userId;
    }

    // Initialize session tracking (lightweight)
    window.analyticsSession = {
      sessionId: getSessionId(),
      userId: getUserId()
    };

    // Track page view - SINGLE EVENT ONLY (no duplicates)
    function trackEnhancedPageView(pageType, pageName, additionalParams) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
          page_type: pageType,
          page_name: pageName,
          session_id: window.analyticsSession.sessionId,
          ...additionalParams
        });
      }
    }

    // Expose tracking function globally
    window.trackEnhancedPageView = trackEnhancedPageView;
  })();
</script>
  `;
}

module.exports = { generateAnalyticsScript, generateConsentModeScript };
