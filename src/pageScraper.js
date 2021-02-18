const _scrapeSection = async (page, sectionData) => {
  const result = {
    section: null,
    items: [],
  };

  if (!sectionData || (sectionData.index === undefined &&
    sectionData.url === undefined)) {
    return result;
  }

  let section = {};

  if (sectionData.index !== undefined) {
    console.log('Wait for the required DOM to be rendered');
    const sectionHtmlElementName = 'div.store__section';
    await page.waitForSelector(sectionHtmlElementName);
    console.log('Found needed element');

    console.log(`Trying to find deals in section #${sectionData.index}`);
    section = await page.$$eval(sectionHtmlElementName, (items, index) => {
      try {
        const section = {
          title: '',
          link: '',
        };
        console.log(`available sections ${items}`);

        if (items.length - 1 < index) {
          return section;
        }

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
    }, sectionData.index);
  } else if (sectionData.url !== undefined) {
    section['link'] = sectionData.url;
  }

  if (!section) {
    console.log(`Cannot get section info.`);
    return result;
  }

  console.log(`Navigating to ${section.link}...`);
  await page.goto(section.link);

  console.log('Wait for the required DOM to be rendered');
  await page.waitForSelector('div.section__items-cell');
  console.log('Found needed element');

  const sectionTitle = await page.$eval('div.section-header__title', (el) => el.innerText);
  if (!sectionTitle) {
    return result;
  }
  section['title'] = sectionTitle;

  const items = await page.$$eval('div.section__items-cell', (items) => {
    const parsePrice = (str) => {
      const obj = {};

      if (str === 'Free') {
        obj['currency'] = '';
        obj['value'] = 0;
        return obj;
      }
      const priceArray = /^(.*)\$(.*)/g.exec(str);
      const priceCurrency = `${priceArray[1]}$`; const priceValue = +priceArray[2];
      console.log(`priceArray ${priceArray}`);
      console.log(`priceCurrency ${priceCurrency}`);
      console.log(`priceValue ${priceValue}`);

      obj['currency'] = priceCurrency;
      obj['value'] = priceValue;
      return obj;
    };

    const discountSelector = 'span.store-section-item-tag';

    items = items.map((el) => {
      const obj = {};
      obj['name'] = el.querySelector('div.store-section-item__meta-name').innerText;

      const discountElement = el.querySelector(discountSelector);
      if (discountElement) {
        const dicsountString = discountElement.innerText;
        const discountValue = /^-(.*)%$/g.exec(dicsountString)[1];
        obj['discountPercent'] = +discountValue;

        const salePriceSelector = 'span.store-section-item-price-label__sale-price > span';
        const salePrice = el.querySelector(salePriceSelector).innerText;
        const salePriceObj = parsePrice(salePrice);
        console.log(`salePriceObj ${salePriceObj}`);
        obj['salePrice'] = salePriceObj.value;
        obj['salePriceCurrency'] = salePriceObj.currency;

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
      }

      const discountedPriceSelector = 's.store-section-item-price-label__strikethrough-price' +
        ' > span';
      const normalPriceSelector = 'div.store-section-item-byline__price > span';
      const priceSelector = discountElement ? discountedPriceSelector : normalPriceSelector;
      const price = el.querySelector(priceSelector).innerText;
      const priceObj = parsePrice(price);
      console.log(`priceObj ${priceObj}`);
      obj['price'] = priceObj.value;
      obj['priceCurrency'] = priceObj.currency;

      obj['url'] = el.querySelector('a.store-section-item-tile').href;

      const imageElement = el.querySelector('a.store-section-item-tile');
      const backgroundImage = window.getComputedStyle(imageElement).backgroundImage;
      const backgroundImageUrl = backgroundImage.substring(5, backgroundImage.length - 2);
      obj['small_image'] = backgroundImageUrl;

      return obj;
    });
    return items;
  });

  result.section = section;
  result.items = items;

  return result;
};

const processSection = async (page, sectionData, resultingObject) => {
  const scrapedResult = await _scrapeSection(page, sectionData);

  if (scrapedResult && scrapedResult.section) {
    resultingObject.sections.push(scrapedResult.section);
    await page.goBack();
  }

  if (scrapedResult.items && scrapedResult.items.length != 0) {
    scrapedResult.items.forEach((element) => {
      resultingObject.items.push(element);
    });
  }
};

const scrapeAll = async (browser, mainUrl) => {
  const page = await browser.newPage();
  console.log(`Navigating to the main page ${mainUrl}...`);
  await page.goto(mainUrl);

  const result = {
    sections: [],
    items: [],
  };

  await processSection(page, {index: 1}, result);
  await processSection(page, {index: 2}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/2228099660560866/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/2147175465364724/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/1916327371799806/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/377466989488910/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/594636347626579/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/989563394566732/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/323727091569600/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/328644544413671/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/728598080873692/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/549022969355907/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/305257336784520/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/2385850384822599/'}, result);
  await processSection(page,
      {url: 'https://www.oculus.com/experiences/quest/section/336976240361150/'}, result);

  console.log('Trying to find deals in \'Quest Picks\' section');
  console.log('Wait for the required DOM to be rendered');
  try {
    await page.waitForSelector('span.store-section-item-price-label__promo',
        {timeout: 40000});
  } catch (err) {
    console.log('Can\'t find element');
    return result;
  }
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
};

const scrapeSection = async (browser, sectionUrl) => {
  const page = await browser.newPage();
  console.log(`Navigating to the main page ${sectionUrl}...`);
  await page.goto(sectionUrl);

  const result = {
    sections: [],
    items: [],
  };

  await processSection(page, {url: sectionUrl}, result);

  return result;
};

const scraperObject = {
  url: 'https://www.oculus.com/experiences/quest/',
  async scraper(browser, sectionUrl = '') {
    if (sectionUrl.length == '') {
      return await scrapeAll(browser, this.url);
    } else {
      return await scrapeSection(browser, sectionUrl);
    }
  },
};

export default scraperObject;
