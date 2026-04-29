# Bot Verification (Cloudflare Turnstile)

## Overview

The site gates access to ad scripts behind a [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) challenge. This replaces the previous in-house heuristic + math-CAPTCHA system. Turnstile is the same widget used on Cloudflare-protected sites: it runs a non-interactive challenge by default and only escalates to a checkbox/interactive challenge when the visitor looks risky.

The implementation lives in `assets/bot-detector.js`.

## How it works

The challenge is non-blocking by default — legitimate visitors should never see the interstitial:

1. On the first page load of a session, `assets/bot-detector.js` runs a quick smell test (`navigator.webdriver`, obvious headless / scripting UAs, missing `navigator.languages`, zero-dimension screen). If any of those trip, the visitor is treated as suspicious and the full-screen interstitial is shown immediately.
2. Otherwise, the page renders normally and the Turnstile widget mounts in a hidden, off-screen container with `appearance: 'interaction-only'`. A managed challenge that auto-passes never produces visible UI.
3. Turnstile callbacks drive the rest of the flow:
   - `callback` → mark verified, fire any `botDetector.onVerified()` listeners.
   - `before-interactive-callback` / `error-callback` / `timeout-callback` → escalate to the blocking overlay so the user can complete an interactive challenge.
   - A 12 s watchdog also escalates if the silent challenge hasn't resolved.
4. AdSense is loaded **after** verification, via `botDetector.onVerified()`. The page itself is never gated — only ads are deferred until the challenge succeeds.
5. On success the script writes `cf_turnstile_verified=1` to `sessionStorage`, so subsequent navigations within the same tab session pass through silently and AdSense loads immediately.

There is no scoring or math challenge — the verification decision is fully delegated to Turnstile.

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
