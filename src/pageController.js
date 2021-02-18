import scraperObject from './pageScraper.js';

class ScraperController {
  constructor() {

  }

  async _scrape(browserInstance, sectionUrl = '') {
    this.browser = null;
    try {
      this.browser = await browserInstance;
      const result = await scraperObject.scraper(this.browser, sectionUrl);
      return result;
    } catch (err) {
      console.log('Could not scrape data => ', err);
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
