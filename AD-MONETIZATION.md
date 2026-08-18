# AdSense monetization operations

The site uses Google AdSense exclusively. Shared placement, loading, deduplication, and fill diagnostics live in `src/utils/adProviders.js`.

## Configuration

- Publisher: `ca-pub-1033412505744705`
- Responsive horizontal slot: `2719401053`
- Responsive vertical slot: `9122283604`
- `ads-config.json` is locked to the `adsense` provider.
- `ads.txt` authorizes only the site's AdSense publisher record.

The page warms Google's connection early, but the AdSense library itself loads only after the Turnstile verification gate clears. Static and dynamically inserted units share the same deduplicated runtime, and below-the-fold units use proximity loading. The former custom floating footer unit has been removed; Google's native bottom anchor owns sizing, dismissal, and frequency behavior.

Run `npm run build` after changing ad code. Post-build checks validate every generated page, confirm both supplied slot IDs, reject Monumetric remnants, exercise request deduplication and fill reporting, and verify `ads.txt` consistency.

## Consent and policy

Google's certified consent-management platform and privacy messages must be enabled in AdSense for regions where consent is required. Do not fabricate consent strings or replace Google's native anchor with a floating display unit. Keep ad containers visually separated from game controls and navigation.
