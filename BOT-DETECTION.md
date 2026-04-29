# Bot Verification (Cloudflare Turnstile)

## Overview

The site gates access to ad scripts behind a [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) challenge. This replaces the previous in-house heuristic + math-CAPTCHA system. Turnstile is the same widget used on Cloudflare-protected sites: it runs a non-interactive challenge by default and only escalates to a checkbox/interactive challenge when the visitor looks risky.

The implementation lives in `assets/bot-detector.js`.

## How it works

1. On the first page load of a session, `assets/bot-detector.js` shows a full-screen Cloudflare-style interstitial.
2. The interstitial mounts the official Turnstile widget pointing at sitekey `0x4AAAAAADFYVNcBHQbRjSvj`.
3. When the widget fires its success callback, the script:
   - Records `cf_turnstile_verified=1` in `sessionStorage`.
   - Dismisses the overlay.
   - Releases any `botDetector.onVerified()` callbacks.
4. AdSense is only injected once `window.botDetector.shouldBlockAds()` returns `false`. While the visitor is unverified, the AdSense script and `(adsbygoogle = …).push({})` calls are skipped.
5. Subsequent navigations within the same tab session reuse the cached verification and skip the interstitial.

There is no client-side fingerprinting, scoring, or math challenge — the entire decision is delegated to Turnstile.

## Public API

`assets/bot-detector.js` exposes `window.botDetector` with three methods, kept compatible with the previous module:

| Method | Returns | Description |
| --- | --- | --- |
| `shouldBlockAds()` | `boolean` | `true` until the visitor has cleared Turnstile this session. Used by index/game pages to gate AdSense. |
| `isVerified()` | `boolean` | `true` once Turnstile has succeeded this session. |
| `onVerified(cb)` | `void` | Registers a callback fired once when verification succeeds (or immediately if already verified). |

## Files

- `assets/bot-detector.js` — Turnstile loader, interstitial UI, and `window.botDetector` shim.
- `src/generators/indexGenerator.js` — emits the `<script src="assets/bot-detector.js">` tag and gates the AdSense loader behind `shouldBlockAds()`.
- `src/generators/gamePageGenerator.js` — same wiring for individual game pages (uses `../assets/bot-detector.js`).
- `templates/client.js` — runtime ad initialization also checks `shouldBlockAds()` before pushing to `adsbygoogle`.

## Configuration

The Turnstile sitekey is hard-coded near the top of `assets/bot-detector.js`:

```js
var SITEKEY = '0x4AAAAAADFYVNcBHQbRjSvj';
```

To rotate the key, edit that constant. No regeneration of the HTML pages is required because every page just references `assets/bot-detector.js`.

## Server-side verification

This site is hosted on GitHub Pages, so there is no server to verify the Turnstile token against `https://challenges.cloudflare.com/turnstile/v0/siteverify`. A determined attacker who instruments the page can therefore mark themselves as verified without solving the challenge. If end-to-end verification is desired later, deploy a small Cloudflare Worker (or any serverless function) that:

1. Accepts the token from the browser.
2. POSTs `{ secret, response: token }` to `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
3. Returns a signed cookie / JWT that the page checks before calling `markVerified()`.

## Privacy

Turnstile is privacy-preserving by design — it does not require cookies and does not collect personal data. See Cloudflare's [Turnstile privacy policy](https://www.cloudflare.com/privacypolicy/) for details. The only thing this site stores locally is `sessionStorage["cf_turnstile_verified"] = "1"` so the interstitial does not reappear during the same tab session.
