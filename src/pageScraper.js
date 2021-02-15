const scrapeSection = async (page, sectionIndex) => {
  console.log('Wait for the required DOM to be rendered');
  const sectionHtmlElementName = 'div.store__section';
  await page.waitForSelector(sectionHtmlElementName);
  console.log('Found needed element');

  const result = {
    section: null,
    items: [],
  };

  console.log(`Trying to find deals in section #${sectionIndex}`);
  const section = await page.$$eval(sectionHtmlElementName, (items, index) => {
    try {
      const section = {
        title: '',
        link: '',
      };
      console.log(`items ${items}`);
      items = items[index];
      console.log(`items ${items}`);
      const titleElement = items.querySelector('a.store-section-header__title');
      console.log(`titleElement ${titleElement}`);
      section.title = titleElement ? titleElement.textContent : '';
      section.link = titleElement.href;

      console.log(`sectionTitle ${section.title}`);
      console.log(`sectionLink ${section.link}`);

      return section;
    } catch (e) {
      console.log(`Failed to scrape section: ${e}`);
      return null;
    }
  }, sectionIndex);

  if (!section) {
    console.log(`Cannot get section info.`);
    return result;
  }

  console.log(`Navigating to ${section.link}...`);
  await page.goto(section.link);

  console.log('Wait for the required DOM to be rendered');
  await page.waitForSelector('div.section__items-cell');
  console.log('Found needed element');

  const items = await page.$$eval('div.section__items-cell', (items) => {
    const parsePrice = (str) => {
      const priceArray = /^(.*)\$(.*)/g.exec(str);
      const priceCurrency = `${priceArray[1]}$`; const priceValue = +priceArray[2];
      console.log(`priceArray ${priceArray}`);
      console.log(`priceCurrency ${priceCurrency}`);
      console.log(`priceValue ${priceValue}`);
      const obj = {};
      obj['currency'] = priceCurrency;
      obj['value'] = priceValue;
      return obj;
    };

    items = items.filter((el) => {
      return el.querySelector('span.store-section-item-tag');
    });

    items = items.map((el) => {
      const obj = {};
      obj['name'] = el.querySelector('div.store-section-item__meta-name').innerText;

      const dicsountString = el.querySelector('span.store-section-item-tag').innerText;
      const discountValue = /^-(.*)%$/g.exec(dicsountString)[1];
      obj['discountPercent'] = +discountValue;

      const salePriceSelector = 'span.store-section-item-price-label__sale-price > span';
      const salePrice = el.querySelector(salePriceSelector).innerText;
      const salePriceObj = parsePrice(salePrice);
      console.log(`salePriceObj ${salePriceObj}`);
      obj['salePrice'] = salePriceObj.value;
      obj['salePriceCurrency'] = salePriceObj.currency;

      const priceSelector = 's.store-section-item-price-label__strikethrough-price > span';
      const price = el.querySelector(priceSelector).innerText;
      const priceObj = parsePrice(price);
      console.log(`priceObj ${priceObj}`);
      obj['price'] = priceObj.value;
      obj['priceCurrency'] = priceObj.currency;

      try {
        const now = Date.now();
        const timer = el.querySelector('span.store-item-countdown-timer__timer').innerText;
        console.log(`timer ${timer}`);
        const timeSplitted = timer.split(':');
        if (timeSplitted.length > 0) {
          const endsInMs = (Number(timeSplitted[0]) * 60 * 60 + Number(timeSplitted[1]) * 60 +
                        Number(timeSplitted[2])) * 1000;
          console.log(`endsInMs ${endsInMs}`);
          const endsUtcDate = new Date(now + endsInMs);
          console.log(`endsUtcDate ${endsUtcDate}`);
          obj['endsUtc'] = endsUtcDate.toISOString();
        } else {
          // TODO: parse days
        }
      } catch (e) {
        console.log(`failed to parse end date: ${e}`);
      }

      obj['url'] = el.querySelector('a.store-section-item-tile').href;

      return obj;
    });
    return items;
  });

  result.section = section;
  result.items = items;

  return result;
};

const scraperObject = {
  url: 'https://www.oculus.com/experiences/quest/',
  async scraper(browser) {
    const page = await browser.newPage();
    console.log(`Navigating to the main page ${this.url}...`);
    await page.goto(this.url);

    const result = {
      sections: [],
      items: [],
    };

    const scrapedResult = await scrapeSection(page, 1);

    if (scrapedResult.section && scrapedResult.section) {
      result.sections.push(scrapedResult.section);
    }

    if (scrapedResult.items && scrapedResult.items.length != 0) {
      console.log(`scrapedResult.items ${scrapedResult.items}`);
      scrapedResult.items.forEach((element) => {
        result.items.push(element);
      });
      return result;
    }

    console.log('Not found deals in 1st section');
    await page.goBack();

    console.log('Trying to find deals in \'Quest Picks\' section');
    console.log('Wait for the required DOM to be rendered');
    await page.waitForSelector('span.store-section-item-price-label__promo');
    console.log('Found needed element');

    const selector = '.store-section-item-tag.store-section-item-tag__blue.' +
      'store-section-item-price-label__promo';
    const link = await page.$$eval(selector, (items) => {
      const parentNode = items[0].parentNode.parentNode.parentNode.parentNode;
      const link = parentNode.parentNode.parentNode.parentNode.href;

      return link;
    });

    if (link == undefined || link.length == 0) {
      console.log('Can\'t find game\'s link');
      return result;
    }

    console.log(`Navigating to ${link}...`);
    await page.goto(link);

    console.log('Wait for the required DOM to be rendered');
    await page.waitForSelector('div.app-description__title');
    console.log('Found needed element');

    const game = await page.$$eval('div.app__row', (items) => {
      const parsePrice = (str) => {
        const priceArray = /^(.*)\$(.*)/g.exec(str);
        const priceCurrency = `${priceArray[1]}$`; const priceValue = +priceArray[2];
        console.log(`priceArray ${priceArray}`);
        console.log(`priceCurrency ${priceCurrency}`);
        console.log(`priceValue ${priceValue}`);
        const obj = {};
        obj['currency'] = priceCurrency;
        obj['value'] = priceValue;
        return obj;
      };

      console.log('Found game block');
      const game = {};
      const item = items[0];
      console.log('Looking for title');
      game['name'] = item.querySelector('.app-description__title').innerText;

      const discountSelector = '.app-purchase-price-discount-detail__promo-benefit';
      const discountString = item.querySelectorAll(discountSelector)[0].innerText;
      console.log(`dicsountString ${discountString}`);
      const discountValue = /^-(.*)%$/g.exec(discountString)[1];
      game['discountPercent'] = +discountValue;

      const salePrice = item.querySelector('span.app-purchase-price > span').innerText;
      const salePriceObj = parsePrice(salePrice);
      console.log(`salePriceObj ${salePriceObj}`);
      game['salePrice'] = salePriceObj.value;
      game['salePriceCurrency'] = salePriceObj.currency;

      const priceSelector = '.app-purchase-price-discount-detail__strikethrough-price > span';
      const price = item.querySelector(priceSelector).innerText;
      const priceObj = parsePrice(price);
      console.log(`priceObj ${priceObj}`);
      game['price'] = priceObj.value;
      game['priceCurrency'] = priceObj.currency;

      const now = Date.now();
      const timer = item.querySelector('.store-item-countdown-timer__timer').innerText;
      console.log(`timer ${timer}`);
      const timeSplitted = timer.split(':');
      const endsInMs = (Number(timeSplitted[0]) * 60 * 60 + Number(timeSplitted[1]) * 60 +
                Number(timeSplitted[2])) * 1000;
      console.log(`endsInMs ${endsInMs}`);
      const endsUtcDate = new Date(now + endsInMs);
      console.log(`endsUtcDate ${endsUtcDate}`);
      game['endsUtc'] = endsUtcDate.toISOString();

      return game;
    });
    game['url'] = link;

    result.items.push(game);

    return result;
  },
};

export default scraperObject;
