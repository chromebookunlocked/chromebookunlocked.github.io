/**
 * Simplified Google Analytics 4 tracking module
 * Focuses on core metrics without double counting
 */

/**
 * Google Consent Mode v2 defaults. Must be emitted BEFORE the gtag.js
 * loader so the default state applies to the very first hit.
 *
 * A saved choice from the cookieConsent cookie (set by
 * assets/cookie-consent.js) always wins. Without one:
 *  - in Europe (EEA, United Kingdom, Switzerland) everything optional starts
 *    denied and the banner asks, as before;
 *  - everywhere else analytics starts granted and no banner is shown (the
 *    footer's Cookie Settings link still turns it off). Advertising storage
 *    starts denied everywhere.
 * Until 2026-11-27 the default was denied for everyone, and closing the
 * banner saved "denied": Analytics then recorded about a quarter of the
 * visits Search Console reported, for an audience that is mostly in the US.
 *
 * A static site has no server-side location, so the device time zone decides
 * (unknown counts as Europe); assets/cookie-consent.js uses the same test for
 * showing the banner. Google's own location check is passed the country list
 * as well, so a visitor it places in Europe starts denied either way.
 */
const EUROPE_CONSENT_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'GB', 'CH',
  // French overseas departments, which are EU territory with their own codes
  'GF', 'GP', 'MQ', 'RE', 'YT', 'MF',
];

function generateConsentModeScript() {
  return `<!-- Google Consent Mode v2: saved choice first; otherwise analytics on outside Europe, off in Europe until accepted -->
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    (function(){
      var saved = null;
      try {
        var m = ('; ' + document.cookie).split('; cookieConsent=');
        if (m.length === 2) saved = JSON.parse(decodeURIComponent(m.pop().split(';').shift()));
      } catch (e) {}
      var europe = true;
      try {
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        var extra = ['Atlantic/Azores','Atlantic/Canary','Atlantic/Faroe','Atlantic/Madeira','Atlantic/Reykjavik','Asia/Nicosia','Asia/Famagusta','Africa/Ceuta','Arctic/Longyearbyen','Indian/Reunion','Indian/Mayotte','America/Cayenne','America/Guadeloupe','America/Martinique','America/Marigot'];
        europe = !tz || tz === 'UTC' || tz.indexOf('Etc/') === 0 || tz.indexOf('Europe/') === 0 || extra.indexOf(tz) !== -1;
      } catch (e) {}
      window.cbuConsentRegion = europe ? 'europe' : 'other';
      var analytics = saved ? saved.analytics === true : !europe;
      var marketing = saved ? saved.marketing === true : false;
      gtag('consent', 'default', {
        analytics_storage: analytics ? 'granted' : 'denied',
        ad_storage: marketing ? 'granted' : 'denied',
        ad_user_data: marketing ? 'granted' : 'denied',
        ad_personalization: marketing ? 'granted' : 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
        wait_for_update: saved || !europe ? 0 : 500
      });
      if (!saved && !europe) {
        gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          region: ${JSON.stringify(EUROPE_CONSENT_REGIONS)}
        });
      }
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
