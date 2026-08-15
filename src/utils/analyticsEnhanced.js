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
  // One explicit page_view per generated page. GA owns its own session and
  // user identifiers, so the site does not create parallel tracking IDs.
  (function() {
    function trackEnhancedPageView(pageType, pageName, additionalParams) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
          page_type: pageType,
          page_name: pageName,
          ...additionalParams
        });
      }
    }

    window.trackEnhancedPageView = trackEnhancedPageView;
  })();
</script>
  `;
}

module.exports = { generateAnalyticsScript, generateConsentModeScript };
