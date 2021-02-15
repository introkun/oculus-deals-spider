import scraperObject from './pageScraper.js';

class ScraperController {
  constructor() {

  }

  async scrapeAll(browserInstance) {
    this.browser = null;
    try {
      this.browser = await browserInstance;
      const result = await scraperObject.scraper(this.browser);
      return result;
    } catch (err) {
      console.log('Could not scrape data => ', err);
      return {sections: [], items: []};
    }
  }

  stopBrowser() {
    if (this.browser) {
      this.browser.close();
    }
  }
}

export default ScraperController;
