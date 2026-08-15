# Ad monetization operations

The site uses Monumetric as its primary provider and AdSense as a script-failure fallback. Shared placement and loading behavior lives in `src/utils/adProviders.js`; generated HTML should not contain its own ad-request logic.

## Implementation invariants

- Preload the active network early, but do not execute it or request slots until the session traffic check clears.
- Initialize each AdSense slot once. In-content inventory is requested within 600 px of the viewport.
- Do not auction desktop pillars below the 1280 px layout breakpoint.
- Do not reveal the sticky footer container until a creative element exists, and respect dismissal for the tab session.
- Keep ads separated from game controls and clearly exposed as advertisement landmarks.
- Activate direct AdSense fallback inventory only when the Monumetric library fails to load. Ordinary no-fill should be handled by Monumetric demand or a network-configured passback, not by page code guessing whether a late creative will arrive.
- Direct AdSense fallback is limited to in-content and bottom inventory. Do not put it in the game pillars or sticky unit, where touch-heavy gameplay raises accidental-click risk.
- Run `npm run build`; the post-build validator checks every generated game page plus both provider paths.

## Required account-side setup

Code alone cannot provide an IAB Transparency and Consent Framework signal. Monumetric or the Google publisher account must have a Google-certified TCF CMP enabled for visitors in the EEA, UK, and Switzerland. Without it, Google limits those requests to non-personalized inventory, which can reduce fill and revenue.

- Google CMP requirement: https://support.google.com/adsense/answer/13554020
- Current certified CMP list: https://support.google.com/adsense/answer/13554116
- TCF integration guidance: https://support.google.com/adsense/answer/9804260

After deployment from an EEA test location, confirm that the browser console no longer reports that an IAB TCF signal was not received. Do not fabricate `__tcfapi` or a consent string; the signal must come from a certified CMP.

## Revenue review cadence

Compare changes over at least one full weekly traffic cycle. Track page RPM together with Active View, fill rate, session depth, Core Web Vitals, and invalid-traffic deductions. More requested slots do not guarantee more profit: retain or add inventory only when viewability and page RPM improve without reducing session depth.

Never click live ads during QA. Verify containers, requests, fill state, layout, and console output instead.
