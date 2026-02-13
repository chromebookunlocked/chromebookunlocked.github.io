# Bot Detection System

## Overview

This site implements a comprehensive bot detection system to identify and filter suspicious traffic, helping to prevent Google AdSense violations due to invalid clicks from automated bots.

## How It Works

### Detection Methods

The bot detector (`assets/bot-detector.js`) uses multiple techniques to identify automated traffic:

1. **User Agent Analysis**
   - Scans for known bot patterns (crawler, spider, headless, phantom, selenium, puppeteer, etc.)
   - Detects automation tools and frameworks

2. **WebDriver Detection**
   - Checks for `navigator.webdriver` property
   - Detects Selenium, Puppeteer, Playwright automation

3. **Headless Browser Detection**
   - Verifies plugin and MIME type availability
   - Checks for HeadlessChrome signatures
   - Validates browser vendor information

4. **Automation Tool Signatures**
   - Detects Chrome DevTools Protocol
   - Identifies Selenium IDE, DOM automation controllers
   - Checks for automation-specific window properties

5. **Browser Fingerprinting**
   - Plugin count validation
   - Language settings verification
   - Screen properties analysis
   - Timing analysis

6. **Human Behavior Monitoring**
   - Tracks mouse movements
   - Monitors scroll events
   - Detects touch interactions (mobile)
   - Records keyboard events
   - Validates interaction patterns over time

### Scoring System

Each detection check assigns a score:
- **User Agent Bot Pattern**: 50 points
- **WebDriver Detected**: 40 points
- **Headless Browser Signs**: 10-40 points (10 per indicator)
- **Automation Tools**: 15 points per detection
- **Plugin Issues**: 10 points
- **Language Issues**: 10 points
- **Screen Anomalies**: 10 points
- **Suspicious Timing**: 5 points
- **No Human Interaction** (after 5+ seconds): 20 points
- **Human Interactions Detected**: -15 points (reduces score)

**Bot Threshold**: 50 points or higher = Classified as bot

## Integration

### Ad Protection

When a bot is detected:
- **AdSense script is NOT loaded** (prevents invalid impressions)
- **Ad tiles are NOT initialized** (client-side protection)
- **Analytics event is sent** to track bot traffic

### Analytics Integration

Bot detection events are automatically sent to Google Analytics 4:

```javascript
gtag('event', 'bot_detection', {
  is_bot: true/false,
  bot_score: 75,
  checks_failed: 5,
  human_interactions: 0,
  event_category: 'security',
  event_label: 'bot_detected' or 'human_verified'
});
```

## Monitoring Bot Traffic

### In Google Analytics 4

1. **Navigate to Events** in GA4
2. **Look for** `bot_detection` events
3. **Create a custom report** with:
   - Dimension: `event_label` (bot_detected vs human_verified)
   - Metric: `event_count`
   - Secondary dimension: `page_location`

### Check Detection Results

In browser console (for testing):
```javascript
// Get current detection status
window.botDetector.getResult()

// Returns:
{
  isBot: false,
  botScore: 15,
  checks: { /* detailed check results */ },
  humanInteractions: 5
}
```

### SessionStorage Data

Bot detection results are stored in `sessionStorage`:
```javascript
// Retrieve stored result
const result = BotDetector.getStoredResult();
console.log(result);
```

## Testing

### Test as Human
1. Open the site normally
2. Open DevTools console
3. Run: `window.botDetector.getResult()`
4. Should see `isBot: false` with low score

### Test Detection (Simulated)
1. Open the site in headless mode:
   ```bash
   chromium --headless --disable-gpu https://yourdomain.com
   ```
2. Bot should be detected automatically

### Manual Testing
To see what bots are detected, check Google Analytics:
- Go to **Realtime** → **Events**
- Look for `bot_detection` events
- Check `event_label` parameter

## Configuration

### Adjusting Detection Threshold

Edit `/assets/bot-detector.js`, line ~231:
```javascript
// Current threshold: 50 points
this.isBot = this.botScore >= 50;

// More strict (catches more bots, may have false positives):
this.isBot = this.botScore >= 35;

// More lenient (fewer false positives, may miss some bots):
this.isBot = this.botScore >= 65;
```

### Whitelisting Legitimate Crawlers

To allow Google Search Console or other legitimate crawlers:

```javascript
// In checkUserAgent() method, add exceptions:
const legitimateBots = ['googlebot', 'bingbot', 'googleother'];
const isLegitimate = legitimateBots.some(bot => ua.includes(bot));

if (isLegitimate) {
  this.checks.userAgent.score = 0; // Don't penalize
  return;
}
```

## Impact on AdSense

### Before Bot Detection
- Bots could load ads and generate invalid impressions
- Risk of AdSense policy violations
- Potential account suspension

### After Bot Detection
- Bots are blocked from loading AdSense script
- Only human traffic sees ads
- Reduced risk of invalid traffic violations
- Better ad quality metrics

## Privacy Considerations

This bot detection system:
- ✅ Does NOT collect personal information
- ✅ Only checks browser/environment properties
- ✅ Stores minimal data in sessionStorage (cleared when browser closes)
- ✅ Complies with GDPR and privacy regulations
- ✅ Only sends aggregated analytics events

## Maintenance

### Regular Checks
1. **Weekly**: Monitor GA4 for bot detection events
2. **Monthly**: Review bot score distribution
3. **Quarterly**: Update bot patterns in user agent checks

### Updating Bot Patterns

Edit `checkUserAgent()` in `/assets/bot-detector.js`:
```javascript
const botPatterns = [
  'bot', 'crawler', 'spider', 'scraper', 'headless',
  // Add new patterns here
  'newbotname', 'suspicioususeragent'
];
```

## Troubleshooting

### "Real users are being blocked"
- Check GA4 for high `bot_score` on human traffic
- Lower the threshold or adjust scoring
- Review specific checks causing false positives

### "Bots are still getting through"
- Check which bots are evading detection
- Review their user agents and characteristics
- Add new detection patterns
- Lower the threshold

### "Analytics shows no bot_detection events"
- Verify bot-detector.js is loading (check Network tab)
- Check for JavaScript errors in console
- Ensure gtag is initialized before bot detector sends events

## Support

For issues or questions:
1. Check browser console for errors
2. Review GA4 event data
3. Test with `window.botDetector.getResult()`
4. Adjust threshold as needed

## Next Steps

Consider implementing:
1. **Server-side bot detection** (for additional protection)
2. **IP-based rate limiting** (prevent scraping)
3. **CAPTCHA challenges** (for suspicious traffic)
4. **Custom bot reports** in GA4 (detailed dashboards)
