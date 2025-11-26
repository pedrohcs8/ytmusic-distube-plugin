const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

/**
 * Cookie Manager for YouTube Music Authentication
 * Handles cookie loading, validation, and automatic refresh using Puppeteer
 * @class CookieManager
 */
class CookieManager {
  constructor(options = {}) {
    this.cookiesPath = options.cookiesPath || path.join(__dirname, '..', 'cookies.json');
    this.refreshInterval = options.refreshInterval || 24 * 60 * 60 * 1000; // 24 hours
    this.refreshBeforeExpiry = options.refreshBeforeExpiry || 3600000; // 1 hour
    this.autoRefresh = options.autoRefresh !== false;
    this.headless = options.headless !== false;
    this.refreshTimer = null;
    this.onCookiesUpdated = options.onCookiesUpdated || null;
    this.onRefreshError = options.onRefreshError || null;
    
    // Puppeteer instance (lazy loaded)
    this.puppeteer = null;
  }

  /**
   * Load cookies from array or file
   * @param {Array|string} source Cookie array or file path
   * @returns {Promise<Array>}
   */
  async loadCookies(source) {
    try {
      // If source is an array, use it directly
      if (Array.isArray(source)) {
        console.log(`CookieManager: Loaded ${source.length} cookies from array`);
        return source;
      }

      // If source is a string, treat it as file path
      if (typeof source === 'string') {
        this.cookiesPath = source;
      }

      // Load from file
      if (fsSync.existsSync(this.cookiesPath)) {
        const cookiesString = await fs.readFile(this.cookiesPath, 'utf8');
        const cookies = JSON.parse(cookiesString);
        console.log(`CookieManager: Loaded ${cookies.length} cookies from ${this.cookiesPath}`);
        return cookies;
      } else {
        console.warn(`CookieManager: Cookie file not found at ${this.cookiesPath}`);
        return [];
      }
    } catch (error) {
      console.error('CookieManager: Failed to load cookies:', error.message);
      return [];
    }
  }

  /**
   * Save cookies to file
   * @param {Array} cookies Cookie array
   * @returns {Promise<boolean>}
   */
  async saveCookies(cookies) {
    try {
      await fs.writeFile(this.cookiesPath, JSON.stringify(cookies, null, 2), 'utf8');
      console.log(`CookieManager: Saved ${cookies.length} cookies to ${this.cookiesPath}`);
      return true;
    } catch (error) {
      console.error('CookieManager: Failed to save cookies:', error.message);
      return false;
    }
  }

  /**
   * Validate cookies and check expiration
   * @param {Array} cookies Cookie array
   * @returns {Object} Validation result
   */
  validateCookies(cookies) {
    if (!Array.isArray(cookies) || cookies.length === 0) {
      return {
        valid: false,
        expired: false,
        expiringSoon: false,
        message: 'No cookies provided'
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expirySoonThreshold = now + (this.refreshBeforeExpiry / 1000);
    
    let hasExpired = false;
    let expiringSoon = false;
    let nearestExpiry = Infinity;

    for (const cookie of cookies) {
      // Check if cookie has expiration date
      if (cookie.expirationDate) {
        if (cookie.expirationDate < now) {
          hasExpired = true;
          console.warn(`CookieManager: Cookie "${cookie.name}" has expired`);
        } else if (cookie.expirationDate < expirySoonThreshold) {
          expiringSoon = true;
        }
        
        if (cookie.expirationDate < nearestExpiry) {
          nearestExpiry = cookie.expirationDate;
        }
      }
    }

    const valid = !hasExpired;
    const expiryDate = nearestExpiry !== Infinity ? new Date(nearestExpiry * 1000) : null;

    return {
      valid,
      expired: hasExpired,
      expiringSoon,
      nearestExpiry: expiryDate,
      message: hasExpired 
        ? 'Some cookies have expired' 
        : expiringSoon 
          ? `Cookies expiring soon (before ${expiryDate?.toISOString()})` 
          : 'All cookies are valid'
    };
  }

  /**
   * Refresh cookies using Puppeteer
   * Opens YouTube Music and captures fresh cookies
   * @returns {Promise<Array|null>}
   */
  async refreshCookies() {
    try {
      // Lazy load puppeteer
      if (!this.puppeteer) {
        try {
          this.puppeteer = require('puppeteer');
        } catch (error) {
          console.error('CookieManager: Puppeteer is not installed. Run: npm install puppeteer');
          if (this.onRefreshError) {
            this.onRefreshError(new Error('Puppeteer not installed'));
          }
          return null;
        }
      }

      console.log('CookieManager: Starting cookie refresh with Puppeteer...');
      
      const browser = await this.puppeteer.launch({
        headless: this.headless ? 'new' : false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      });

      try {
        const page = await browser.newPage();
        
        // Set user agent to avoid detection
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Load existing cookies if available
        try {
          const existingCookies = await this.loadCookies(this.cookiesPath);
          if (existingCookies.length > 0) {
            // Convert to Puppeteer format
            const puppeteerCookies = existingCookies.map(cookie => ({
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain || '.youtube.com',
              path: cookie.path || '/',
              expires: cookie.expirationDate || -1,
              httpOnly: cookie.httpOnly || false,
              secure: cookie.secure || false,
              sameSite: this.convertSameSite(cookie.sameSite)
            }));
            
            await page.setCookie(...puppeteerCookies);
            console.log('CookieManager: Loaded existing cookies into browser');
          }
        } catch (err) {
          console.log('CookieManager: No existing cookies to load, starting fresh');
        }

        // Navigate to YouTube Music
        console.log('CookieManager: Navigating to YouTube Music...');
        await page.goto('https://music.youtube.com', {
          waitUntil: 'networkidle2',
          timeout: 60000
        });

        // Check if we need manual login
        const isLoggedIn = await page.evaluate(() => {
          // Check for avatar or user menu
          return !!(
            document.querySelector('ytmusic-nav-bar #right-content img[id="img"]') ||
            document.querySelector('ytmusic-nav-bar #avatar-btn') ||
            document.querySelector('yt-img-shadow img[id="img"]')
          );
        });

        if (!isLoggedIn && !this.headless) {
          console.log('CookieManager: Not logged in. Please login manually in the browser window...');
          console.log('CookieManager: Waiting up to 5 minutes for login...');
          
          // Wait for login (check for avatar every 2 seconds)
          const maxWaitTime = 300000; // 5 minutes
          const startTime = Date.now();
          
          while (Date.now() - startTime < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const loggedIn = await page.evaluate(() => {
              return !!(
                document.querySelector('ytmusic-nav-bar #right-content img[id="img"]') ||
                document.querySelector('ytmusic-nav-bar #avatar-btn') ||
                document.querySelector('yt-img-shadow img[id="img"]')
              );
            });
            
            if (loggedIn) {
              console.log('CookieManager: Login detected!');
              break;
            }
          }
        } else if (isLoggedIn) {
          console.log('CookieManager: Already logged in with existing cookies');
        }

        // Wait a bit for cookies to settle
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get fresh cookies
        const freshCookies = await page.cookies();
        
        // Convert to EditThisCookie format
        const formattedCookies = freshCookies.map(cookie => ({
          domain: cookie.domain,
          expirationDate: cookie.expires && cookie.expires > 0 ? cookie.expires : undefined,
          hostOnly: !cookie.domain.startsWith('.'),
          httpOnly: cookie.httpOnly,
          name: cookie.name,
          path: cookie.path,
          sameSite: this.convertSameSiteToString(cookie.sameSite),
          secure: cookie.secure,
          session: !cookie.expires || cookie.expires === -1,
          value: cookie.value
        }));

        console.log(`CookieManager: Captured ${formattedCookies.length} fresh cookies`);

        // Save cookies
        await this.saveCookies(formattedCookies);

        // Notify callback
        if (this.onCookiesUpdated) {
          this.onCookiesUpdated(formattedCookies);
        }

        return formattedCookies;
      } finally {
        await browser.close();
      }
    } catch (error) {
      console.error('CookieManager: Failed to refresh cookies:', error.message);
      if (this.onRefreshError) {
        this.onRefreshError(error);
      }
      return null;
    }
  }

  /**
   * Start automatic cookie refresh
   * @returns {void}
   */
  startAutoRefresh() {
    if (!this.autoRefresh) {
      console.log('CookieManager: Auto-refresh is disabled');
      return;
    }

    if (this.refreshTimer) {
      console.log('CookieManager: Auto-refresh already running');
      return;
    }

    console.log(`CookieManager: Starting auto-refresh (interval: ${this.refreshInterval}ms)`);
    
    this.refreshTimer = setInterval(async () => {
      console.log('CookieManager: Running scheduled cookie refresh...');
      try {
        const cookies = await this.loadCookies(this.cookiesPath);
        const validation = this.validateCookies(cookies);
        
        if (!validation.valid || validation.expiringSoon) {
          console.log(`CookieManager: ${validation.message}, refreshing...`);
          await this.refreshCookies();
        } else {
          console.log('CookieManager: Cookies are still valid, skipping refresh');
        }
      } catch (error) {
        console.error('CookieManager: Auto-refresh error:', error.message);
      }
    }, this.refreshInterval);
  }

  /**
   * Stop automatic cookie refresh
   * @returns {void}
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('CookieManager: Auto-refresh stopped');
    }
  }

  /**
   * Convert sameSite string to Puppeteer format
   * @param {string} sameSite
   * @returns {string}
   * @private
   */
  convertSameSite(sameSite) {
    const map = {
      'no_restriction': 'None',
      'lax': 'Lax',
      'strict': 'Strict',
      'unspecified': 'Lax'
    };
    return map[sameSite] || 'Lax';
  }

  /**
   * Convert Puppeteer sameSite to EditThisCookie format
   * @param {string} sameSite
   * @returns {string}
   * @private
   */
  convertSameSiteToString(sameSite) {
    const map = {
      'None': 'no_restriction',
      'Lax': 'lax',
      'Strict': 'strict'
    };
    return map[sameSite] || 'unspecified';
  }

  /**
   * Cleanup and stop all timers
   * @returns {void}
   */
  destroy() {
    this.stopAutoRefresh();
  }
}

module.exports = CookieManager;
