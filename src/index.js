import browser from './browser.js';
import ScraperController from './pageController.js';
import DealsStorage from './storage/dealsStorage.js';
import SectionsStorage from './storage/sectionsStorage.js';
import ExperiencesStorage from './storage/experiencesStorage.js';

const isInDebugMode = () => {
  return process.env.NODE_ENV && process.env.NODE_ENV === 'debug';
};

async function main() {
  // Start the browser and create a browser instance
  const startBrowserHeadless = !isInDebugMode();
  const browserInstance = browser.startBrowser(startBrowserHeadless);
  const scraperController = new ScraperController();

  // Pass the browser instance to the scraper controller
  const result = await scraperController.scrapeAll(browserInstance);

  if (!isInDebugMode()) {
    scraperController.stopBrowser();
  }

  if (result && result.sections) {
    const sectionsStorage = new SectionsStorage();
    sectionsStorage.save(result.sections);
  }

  if (!result.items || result.items.length == 0) {
    console.log('No items found');
    process.exit(0);
  }

  const deals = [];
  const experiences = [];
  const nowISO = (new Date()).toISOString();

  console.log(`Scraped items:`);
  result.items.forEach((item) => {
    console.log(item);
    experiences.push(item);
    if (item.discountPercent) {
      item['createdAt'] = nowISO;
      deals.push(item);
    }
  });

  console.log(`Deals count: ${deals.length}`);
  console.log(`Experiences count: ${experiences.length}`);

  const dealsStorage = new DealsStorage();
  dealsStorage.save(deals);

  const experiencesStorage = new ExperiencesStorage();
  experiencesStorage.save(experiences);
};

main();
