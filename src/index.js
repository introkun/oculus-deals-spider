import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

import browser from './browser.js';

import ScraperController from './pageController.js';
import DealsStorage from './storage/dealsStorage.js';
import SectionsStorage from './storage/sectionsStorage.js';
import ExperiencesStorage from './storage/experiencesStorage.js';

const SCRAPE_SECTION_COMMAND = 'scrape-section';

const argv = yargs(hideBin(process.argv))
    .command(SCRAPE_SECTION_COMMAND, 'Scrapes section by URL', {
      url: {
        description: 'url of the section (e.g. https://www.oculus.com/experiences/' +
          'quest/section/2228099660560866/)',
        alias: 's',
        type: 'string',
      },
    })
    .help().alias('help', 'h')
    .argv;

const isInDebugMode = () => {
  return process.env.NODE_ENV && process.env.NODE_ENV === 'debug';
};

async function main() {
  // Start the browser and create a browser instance
  const startBrowserHeadless = !isInDebugMode();
  const browserInstance = browser.startBrowser(startBrowserHeadless);
  const scraperController = new ScraperController();

  let result = [];

  if (argv._.includes(SCRAPE_SECTION_COMMAND)) {
    const url = argv.url;
    if (!url) {
      console.log(`No URL specified for command ${SCRAPE_SECTION_COMMAND}`);
      return;
    }
    console.log(`Start scraping single section ${url}`);
    result = await scraperController.scrapeSection(browserInstance, url);
  } else {
    console.log(`Start scraping everything`);
    result = await scraperController.scrapeAll(browserInstance);
  }

  if (!isInDebugMode()) {
    scraperController.stopBrowser();
  }

  if (result && result.sections) {
    const sectionsStorage = new SectionsStorage();
    sectionsStorage.save(result.sections);
  }

  if (!result.items || result.items.length == 0) {
    console.log('No items found');
    if (!isInDebugMode()) {
      process.exit(0);
    }
  }

  const deals = [];
  const experiences = [];
  const nowISO = (new Date()).toISOString();

  console.log(`Scraped items:`);
  result.items.forEach((item) => {
    if (!item) { // TODO: find this case
      return;
    }
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
