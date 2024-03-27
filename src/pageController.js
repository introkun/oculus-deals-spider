import scraperObject from './pageScraper.js';

class ScraperController {
  constructor(rollbar) {
    this.rollbar = rollbar;
  }

  async _scrape(browserInstance, sectionUrl = '') {
    this.browser = null;
    this.rollbar.log('Starting scraping...');
    try {
      this.browser = await browserInstance;
      const result = await scraperObject.scraper(this.browser, sectionUrl);
      return result;
    } catch (err) {
      console.log('Could not scrape data => ', err);
      this.rollbar.error(err);
      return {sections: [], items: []};
    }
  }

  async scrapeSection(browserInstance, sectionUrl) {
    return this._scrape(browserInstance, sectionUrl);
  }

  async scrapeAll(browserInstance) {
    return this._scrape(browserInstance);
  }

  stopBrowser() {
    if (this.browser) {
      this.browser.close();
    }
  }
}

export default ScraperController;
