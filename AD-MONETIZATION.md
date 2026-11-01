# AdSense monetization operations

The site uses Google AdSense exclusively. Shared placement, loading, deduplication, and fill diagnostics live in `src/utils/adProviders.js`.

## Configuration

- Publisher: `ca-pub-7012225982160223`
- Responsive horizontal slot: `1040490510`
- Responsive vertical slot: `6968650790`
- `ads-config.json` is locked to the `adsense` provider.
- `ads.txt` authorizes only the site's AdSense publisher record.

The AdSense library loads through the standard async script in the head of the homepage, game landing pages, and public arcade template. Manual ad requests still wait for the Turnstile verification gate. Static and dynamically inserted units share the same deduplicated runtime, and below-the-fold units use proximity loading. Legal pages and embedded game engine files do not load the site's AdSense script.

Run `npm run build` after changing ad code. Post-build checks validate every generated page, confirm both supplied slot IDs, reject Monumetric remnants, exercise request deduplication and fill reporting, and verify `ads.txt` consistency.

## Consent and policy

Google's certified consent-management platform and privacy messages must be enabled in AdSense for regions where consent is required. Do not fabricate consent strings or replace Google's native anchor with a floating display unit. Keep ad containers visually separated from game controls and navigation.
