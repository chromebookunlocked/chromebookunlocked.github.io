/**
 * Enhanced Google Analytics 4 tracking module
 * Provides detailed session tracking, page views, and game duration tracking
 */

function generateAnalyticsScript() {
  return `
<script>
  // Enhanced Analytics Tracking
  (function() {
    // Generate or retrieve session ID
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
          console.error('Error parsing session data:', e);
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

      // Track session start
      if (typeof gtag !== 'undefined') {
        gtag('event', 'session_start', {
          session_id: newSessionId,
          timestamp: new Date().toISOString()
        });
      }

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

    // Initialize session tracking
    window.analyticsSession = {
      sessionId: getSessionId(),
      userId: getUserId(),
      pageViewStartTime: Date.now(),
      engagementInterval: null
    };

    // Track page engagement every 15 seconds
    function startEngagementTracking() {
      if (window.analyticsSession.engagementInterval) {
        clearInterval(window.analyticsSession.engagementInterval);
      }

      window.analyticsSession.engagementInterval = setInterval(function() {
        const timeOnPage = Math.floor((Date.now() - window.analyticsSession.pageViewStartTime) / 1000);

        if (typeof gtag !== 'undefined') {
          gtag('event', 'user_engagement', {
            session_id: window.analyticsSession.sessionId,
            engagement_time_msec: timeOnPage * 1000,
            page_location: window.location.href,
            page_title: document.title
          });
        }
      }, 15000); // Every 15 seconds
    }

    // Track page view with enhanced parameters
    function trackEnhancedPageView(pageType, pageName, additionalParams) {
      const sessionData = JSON.parse(sessionStorage.getItem('ga_session_data') || '{}');
      const params = {
        page_type: pageType,
        page_name: pageName,
        session_id: window.analyticsSession.sessionId,
        user_id: window.analyticsSession.userId,
        timestamp: new Date().toISOString(),
        session_start_time: sessionData.startTime ? new Date(sessionData.startTime).toISOString() : new Date().toISOString(),
        ...additionalParams
      };

      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', params);

        // Also send as custom event for better tracking in realtime
        gtag('event', 'page_visited', params);
      }

      // Reset page view start time
      window.analyticsSession.pageViewStartTime = Date.now();

      // Start engagement tracking
      startEngagementTracking();
    }

    // Track when user leaves page
    function trackPageExit() {
      const timeOnPage = Math.floor((Date.now() - window.analyticsSession.pageViewStartTime) / 1000);

      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_exit', {
          session_id: window.analyticsSession.sessionId,
          time_on_page_seconds: timeOnPage,
          page_location: window.location.href,
          page_title: document.title,
          timestamp: new Date().toISOString()
        });
      }

      // Clear engagement interval
      if (window.analyticsSession.engagementInterval) {
        clearInterval(window.analyticsSession.engagementInterval);
      }
    }

    // Expose tracking functions globally
    window.trackEnhancedPageView = trackEnhancedPageView;
    window.trackPageExit = trackPageExit;

    // Track page exit on beforeunload
    window.addEventListener('beforeunload', trackPageExit);

    // Track visibility changes (tab switching)
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        if (window.analyticsSession.engagementInterval) {
          clearInterval(window.analyticsSession.engagementInterval);
        }
      } else {
        startEngagementTracking();
      }
    });
  })();
</script>
  `;
}

module.exports = { generateAnalyticsScript };
