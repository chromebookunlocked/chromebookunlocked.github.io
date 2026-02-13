/**
 * Bot Detection Module for Chromebook Unlocked
 * Detects and filters suspicious bot traffic to prevent AdSense violations
 */

class BotDetector {
  constructor() {
    this.botScore = 0;
    this.checks = {};
    this.isBot = false;
    this.humanInteractions = 0;
    this.startTime = Date.now();
    this.mouseMovements = 0;
    this.scrollEvents = 0;
    this.touchEvents = 0;
    this.keyEvents = 0;

    // Initialize detection
    this.init();
  }

  init() {
    // Run immediate checks
    this.checkUserAgent();
    this.checkWebDriver();
    this.checkHeadless();
    this.checkAutomation();
    this.checkPlugins();
    this.checkLanguages();
    this.checkScreen();
    this.checkTiming();

    // Setup interaction listeners
    this.setupInteractionListeners();

    // Calculate final score after initial checks
    this.calculateScore();

    // Store result
    this.storeResult();
  }

  /**
   * Check 1: User Agent Analysis
   */
  checkUserAgent() {
    const ua = navigator.userAgent.toLowerCase();
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 'headless',
      'phantom', 'selenium', 'puppeteer', 'playwright',
      'webdriver', 'automatron', 'aiohttp', 'python-requests',
      'curl', 'wget', 'scrapy', 'mechanize'
    ];

    const hasBotPattern = botPatterns.some(pattern => ua.includes(pattern));
    this.checks.userAgent = {
      suspicious: hasBotPattern,
      value: ua,
      score: hasBotPattern ? 50 : 0
    };
  }

  /**
   * Check 2: WebDriver Detection
   */
  checkWebDriver() {
    const hasWebDriver =
      navigator.webdriver === true ||
      window.document.documentElement.getAttribute('webdriver') === 'true' ||
      window.callPhantom !== undefined ||
      window._phantom !== undefined;

    this.checks.webDriver = {
      suspicious: hasWebDriver,
      score: hasWebDriver ? 40 : 0
    };
  }

  /**
   * Check 3: Headless Browser Detection
   */
  checkHeadless() {
    const checks = {
      noPlugins: navigator.plugins.length === 0,
      noMimeTypes: navigator.mimeTypes.length === 0,
      chromeHeadless: /HeadlessChrome/.test(navigator.userAgent),
      suspiciousVendor: navigator.vendor === '' || navigator.vendor === undefined
    };

    const suspiciousCount = Object.values(checks).filter(Boolean).length;
    this.checks.headless = {
      suspicious: suspiciousCount >= 2,
      details: checks,
      score: suspiciousCount * 10
    };
  }

  /**
   * Check 4: Automation Tool Detection
   */
  checkAutomation() {
    const automationSignals = {
      cdc: window.document.$cdc_asdjflasutopfhvcZLmcfl_ !== undefined,
      domAutomation: window.domAutomation !== undefined,
      domAutomationController: window.domAutomationController !== undefined,
      chromeDriver: window.chrome && window.chrome.runtime === undefined,
      seleniumIde: window._Selenium_IDE_Recorder !== undefined,
      calledSelenium: window.document.documentElement.getAttribute('selenium') !== null,
      calledDriver: window.document.documentElement.getAttribute('driver') !== null
    };

    const detectedCount = Object.values(automationSignals).filter(Boolean).length;
    this.checks.automation = {
      suspicious: detectedCount > 0,
      details: automationSignals,
      score: detectedCount * 15
    };
  }

  /**
   * Check 5: Plugin Detection
   */
  checkPlugins() {
    const pluginCount = navigator.plugins.length;
    // Real browsers typically have 1-10 plugins
    // Bots often have 0 or suspiciously many
    const suspicious = pluginCount === 0 || pluginCount > 15;

    this.checks.plugins = {
      suspicious: suspicious,
      count: pluginCount,
      score: suspicious ? 10 : 0
    };
  }

  /**
   * Check 6: Language Detection
   */
  checkLanguages() {
    const languages = navigator.languages;
    const suspicious = !languages || languages.length === 0;

    this.checks.languages = {
      suspicious: suspicious,
      count: languages ? languages.length : 0,
      score: suspicious ? 10 : 0
    };
  }

  /**
   * Check 7: Screen Properties
   */
  checkScreen() {
    const suspicious =
      screen.width === 0 ||
      screen.height === 0 ||
      screen.colorDepth === 0 ||
      (screen.width === 800 && screen.height === 600); // Common bot resolution

    this.checks.screen = {
      suspicious: suspicious,
      dimensions: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      score: suspicious ? 10 : 0
    };
  }

  /**
   * Check 8: Timing Analysis
   */
  checkTiming() {
    // Check if page loaded suspiciously fast (possible prefetch by bot)
    const now = Date.now();
    const loadTime = now - performance.timing.navigationStart;
    const suspicious = loadTime < 100; // Loaded in less than 100ms is suspicious

    this.checks.timing = {
      suspicious: suspicious,
      loadTime: loadTime,
      score: suspicious ? 5 : 0
    };
  }

  /**
   * Setup listeners for human interaction
   */
  setupInteractionListeners() {
    // Mouse movement
    let mouseMoveTimeout;
    document.addEventListener('mousemove', () => {
      clearTimeout(mouseMoveTimeout);
      mouseMoveTimeout = setTimeout(() => {
        this.mouseMovements++;
        this.humanInteractions++;
      }, 100);
    }, { passive: true });

    // Scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.scrollEvents++;
        this.humanInteractions++;
      }, 100);
    }, { passive: true });

    // Touch events (mobile)
    document.addEventListener('touchstart', () => {
      this.touchEvents++;
      this.humanInteractions++;
    }, { passive: true });

    // Keyboard events
    document.addEventListener('keydown', () => {
      this.keyEvents++;
      this.humanInteractions++;
    }, { passive: true });

    // Check interactions after 5 seconds
    setTimeout(() => {
      this.checkHumanBehavior();
    }, 5000);

    // Check interactions after 15 seconds
    setTimeout(() => {
      this.checkHumanBehavior();
    }, 15000);
  }

  /**
   * Check if user exhibits human behavior
   */
  checkHumanBehavior() {
    const timeOnPage = (Date.now() - this.startTime) / 1000; // seconds

    // If user has been on page for 5+ seconds with no interactions, suspicious
    if (timeOnPage >= 5 && this.humanInteractions === 0) {
      this.checks.humanBehavior = {
        suspicious: true,
        interactions: this.humanInteractions,
        timeOnPage: timeOnPage,
        score: 20
      };
      this.calculateScore();
    } else if (this.humanInteractions > 0) {
      // Reduce bot score if human interactions detected
      this.checks.humanBehavior = {
        suspicious: false,
        interactions: this.humanInteractions,
        timeOnPage: timeOnPage,
        score: -15 // Negative score reduces bot likelihood
      };
      this.calculateScore();
    }
  }

  /**
   * Calculate total bot score
   */
  calculateScore() {
    this.botScore = 0;
    Object.values(this.checks).forEach(check => {
      if (check.score !== undefined) {
        this.botScore += check.score;
      }
    });

    // Determine if this is a bot (threshold: 50)
    this.isBot = this.botScore >= 50;
  }

  /**
   * Store detection result in sessionStorage
   */
  storeResult() {
    const result = {
      isBot: this.isBot,
      botScore: this.botScore,
      checks: this.checks,
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem('botDetection', JSON.stringify(result));
    } catch (e) {
      // sessionStorage might be disabled
      console.warn('Unable to store bot detection result');
    }
  }

  /**
   * Get stored detection result
   */
  static getStoredResult() {
    try {
      const stored = sessionStorage.getItem('botDetection');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Send bot detection event to Google Analytics
   */
  sendAnalyticsEvent() {
    if (typeof gtag === 'function') {
      gtag('event', 'bot_detection', {
        is_bot: this.isBot,
        bot_score: this.botScore,
        checks_failed: Object.values(this.checks).filter(c => c.suspicious).length,
        human_interactions: this.humanInteractions,
        event_category: 'security',
        event_label: this.isBot ? 'bot_detected' : 'human_verified'
      });
    }
  }

  /**
   * Get detection result
   */
  getResult() {
    return {
      isBot: this.isBot,
      botScore: this.botScore,
      checks: this.checks,
      humanInteractions: this.humanInteractions
    };
  }

  /**
   * Check if ads should be blocked
   */
  shouldBlockAds() {
    return this.isBot;
  }
}

// Initialize bot detector when DOM is ready
let botDetector = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    botDetector = new BotDetector();

    // Send analytics event after 2 seconds to allow initialization
    setTimeout(() => {
      botDetector.sendAnalyticsEvent();
    }, 2000);
  });
} else {
  botDetector = new BotDetector();

  setTimeout(() => {
    botDetector.sendAnalyticsEvent();
  }, 2000);
}

// Export for use in other scripts
window.BotDetector = BotDetector;
window.botDetector = botDetector;
