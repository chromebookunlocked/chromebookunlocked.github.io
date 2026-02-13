/**
 * Bot Detection Module for Chromebook Unlocked
 * Detects and filters suspicious bot traffic to prevent AdSense violations
 */

class BotDetector {
  constructor() {
    this.botScore = 0;
    this.checks = {};
    this.isBot = false;
    this.isSuspectedBot = false;
    this.captchaCompleted = false;
    this.captchaFailed = false;
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
    // Check if CAPTCHA was already completed in this session
    const stored = BotDetector.getStoredResult();
    if (stored && stored.captchaCompleted) {
      this.captchaCompleted = true;
    }

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

    // Determine bot status with thresholds
    // 0-29: Human
    // 30-49: Suspected bot (show CAPTCHA)
    // 50+: Definite bot (block)
    this.isBot = this.botScore >= 50;
    this.isSuspectedBot = this.botScore >= 30 && this.botScore < 50;

    // Show CAPTCHA for suspected bots
    if (this.isSuspectedBot && !this.captchaCompleted) {
      this.showCaptchaChallenge();
    }
  }

  /**
   * Store detection result in sessionStorage
   */
  storeResult() {
    const result = {
      isBot: this.isBot,
      isSuspectedBot: this.isSuspectedBot,
      captchaCompleted: this.captchaCompleted,
      captchaFailed: this.captchaFailed,
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
      let eventLabel = 'human_verified';
      if (this.isBot) {
        eventLabel = 'bot_blocked';
      } else if (this.isSuspectedBot) {
        eventLabel = this.captchaCompleted ? 'captcha_passed' : 'captcha_required';
      }

      gtag('event', 'bot_detection', {
        is_bot: this.isBot,
        is_suspected: this.isSuspectedBot,
        captcha_completed: this.captchaCompleted,
        bot_score: this.botScore,
        checks_failed: Object.values(this.checks).filter(c => c.suspicious).length,
        human_interactions: this.humanInteractions,
        event_category: 'security',
        event_label: eventLabel
      });
    }
  }

  /**
   * Show CAPTCHA challenge for suspected bots
   */
  showCaptchaChallenge() {
    // Check if already shown
    if (document.getElementById('botCaptchaOverlay')) {
      return;
    }

    // Generate simple math CAPTCHA
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const correctAnswer = num1 + num2;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'botCaptchaOverlay';
    overlay.innerHTML = `
      <div class="captcha-modal">
        <div class="captcha-header">
          <h2>🤖 Security Check</h2>
          <p>We need to verify you're human to continue</p>
        </div>
        <div class="captcha-content">
          <div class="captcha-question">
            <p>What is <strong>${num1} + ${num2}</strong>?</p>
            <input type="number" id="captchaInput" placeholder="Enter answer" autocomplete="off">
          </div>
          <button id="captchaSubmit" class="captcha-btn">Verify</button>
          <p class="captcha-error" id="captchaError" style="display:none;">Incorrect answer. Please try again.</p>
        </div>
        <div class="captcha-footer">
          <small>This helps us prevent automated bots and protect our site.</small>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #botCaptchaOverlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .captcha-modal {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        padding: 40px;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.4s ease;
        color: white;
      }

      @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .captcha-header h2 {
        margin: 0 0 10px 0;
        font-size: 28px;
        font-weight: 700;
      }

      .captcha-header p {
        margin: 0 0 30px 0;
        opacity: 0.9;
        font-size: 16px;
      }

      .captcha-content {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 30px;
        backdrop-filter: blur(10px);
      }

      .captcha-question p {
        font-size: 20px;
        margin-bottom: 15px;
        text-align: center;
      }

      .captcha-question strong {
        font-size: 32px;
        color: #ffd700;
        text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
      }

      #captchaInput {
        width: 100%;
        padding: 15px;
        font-size: 24px;
        text-align: center;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        font-weight: 600;
        margin-bottom: 15px;
        transition: all 0.3s ease;
      }

      #captchaInput:focus {
        outline: none;
        border-color: #ffd700;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
      }

      .captcha-btn {
        width: 100%;
        padding: 15px;
        font-size: 18px;
        font-weight: 700;
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        color: #333;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
      }

      .captcha-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(255, 215, 0, 0.4);
      }

      .captcha-btn:active {
        transform: translateY(0);
      }

      .captcha-error {
        color: #ff6b6b;
        background: rgba(255, 107, 107, 0.2);
        padding: 10px;
        border-radius: 8px;
        margin-top: 15px;
        text-align: center;
        font-weight: 600;
        animation: shake 0.5s ease;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }

      .captcha-footer {
        margin-top: 20px;
        text-align: center;
        opacity: 0.7;
      }

      .captcha-footer small {
        font-size: 13px;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // Focus input
    const input = document.getElementById('captchaInput');
    setTimeout(() => input.focus(), 100);

    // Handle submission
    const submitBtn = document.getElementById('captchaSubmit');
    const errorMsg = document.getElementById('captchaError');

    const verifyCaptcha = () => {
      const userAnswer = parseInt(input.value);

      if (userAnswer === correctAnswer) {
        // Correct answer - mark as human
        this.captchaCompleted = true;
        this.botScore = Math.max(0, this.botScore - 30); // Reduce score
        this.isBot = false;
        this.isSuspectedBot = false;

        // Update stored result
        this.storeResult();

        // Send success event
        if (typeof gtag === 'function') {
          gtag('event', 'captcha_completed', {
            success: true,
            previous_score: this.botScore + 30,
            event_category: 'security'
          });
        }

        // Remove overlay with animation
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => overlay.remove(), 300);

        // Reload ads if they were blocked
        window.location.reload();
      } else {
        // Wrong answer
        errorMsg.style.display = 'block';
        input.value = '';
        input.focus();

        // After 3 failed attempts, mark as bot
        this.captchaAttempts = (this.captchaAttempts || 0) + 1;
        if (this.captchaAttempts >= 3) {
          this.captchaFailed = true;
          this.isBot = true;

          if (typeof gtag === 'function') {
            gtag('event', 'captcha_failed', {
              attempts: this.captchaAttempts,
              event_category: 'security'
            });
          }

          errorMsg.textContent = 'Too many failed attempts. Access blocked.';
          errorMsg.style.color = '#ff4444';
          setTimeout(() => {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
          }, 2000);
        }
      }
    };

    submitBtn.addEventListener('click', verifyCaptcha);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        verifyCaptcha();
      }
    });

    // Add fadeOut animation
    const fadeOutStyle = document.createElement('style');
    fadeOutStyle.textContent = `
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(fadeOutStyle);
  }

  /**
   * Get detection result
   */
  getResult() {
    return {
      isBot: this.isBot,
      isSuspectedBot: this.isSuspectedBot,
      captchaCompleted: this.captchaCompleted,
      botScore: this.botScore,
      checks: this.checks,
      humanInteractions: this.humanInteractions
    };
  }

  /**
   * Check if ads should be blocked
   */
  shouldBlockAds() {
    // Block ads if:
    // 1. Definite bot (score 50+)
    // 2. Suspected bot who hasn't completed CAPTCHA
    // 3. Failed CAPTCHA
    return this.isBot || (this.isSuspectedBot && !this.captchaCompleted) || this.captchaFailed;
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
