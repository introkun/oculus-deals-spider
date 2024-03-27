import {setTimeout} from 'node:timers/promises';

const SECTION_HTML_ELEMENT = 'div.store__section';
const MAIN_PAGE = 'https://www.meta.com/en-gb/experiences/';

const scrapeGrid = async (page, cellSelector) => {
  const items = await page.$$eval(cellSelector, (items) => {
    const parsePrice = (str) => {
      const obj = {};

      if (str === 'Free' || str === 'Get') {
        obj['currency'] = '';
        obj['value'] = 0;
        return obj;
      }
      const priceArray = /^(.*)\$(.*)/g.exec(str);
      console.log(`priceArray ${priceArray}`);
      const priceCurrency = `${priceArray[1]}$`; const priceValue = +priceArray[2];
      console.log(`priceCurrency ${priceCurrency}`);
      console.log(`priceValue ${priceValue}`);

      obj['currency'] = priceCurrency;
      obj['value'] = priceValue;
      return obj;
    };

    if (!items) {
      console.log(`No items found in the grid for page '${page}' and selector '${cellSelector}'.`);
      return [];
    }

    const preorderItemSelector = 'span.store-section-item-byline__preorder';

    items = items.map((el) => {
      const obj = {};

      if (!el) {
        return;
      }

      obj['name'] = document.evaluate('.//div/div/*[1]', el, null,
          XPathResult.STRING_TYPE, null).stringValue;

      const discountElement = document.evaluate('.//span[@xstyle]', el, null,
          XPathResult.STRING_TYPE, null);
      const preorderElement = el.querySelector(preorderItemSelector);
      console.log(`preorderElement ${preorderElement}`);

      let price = null;

      if (discountElement && discountElement.stringValue.length > 0) {
        const discountString = discountElement.stringValue;
        const discountValue = /^-(.*)%$/g.exec(discountString)[1];
        obj['discountPercent'] = +discountValue;

        const salePrice = document.evaluate('.//span/span/span/*[1]', el, null,
            XPathResult.STRING_TYPE, null).stringValue;
        const salePriceObj = parsePrice(salePrice);
        console.log(`salePriceObj ${salePriceObj}`);
        obj['salePrice'] = salePriceObj.value;
        obj['salePriceCurrency'] = salePriceObj.currency;

        price = document.evaluate('.//span/span/s/span', el, null,
            XPathResult.STRING_TYPE, null).stringValue;

        // try {
        //   const now = Date.now();
        //   const timer = el.querySelector('span.store-item-countdown-timer__timer').innerText;
        //   console.log(`timer ${timer}`);
        //   const timeSplitted = timer.split(':');
        //   if (timeSplitted.length > 0) {
        //     const endsInMs = (Number(timeSplitted[0]) * 60 * 60 + Number(timeSplitted[1]) * 60 +
        //       Number(timeSplitted[2])) * 1000;
        //     console.log(`endsInMs ${endsInMs}`);
        //     const endsUtcDate = new Date(now + endsInMs);
        //     console.log(`endsUtcDate ${endsUtcDate}`);
        //     obj['endsUtc'] = endsUtcDate.toISOString();
        //   } else {
        //     // TODO: parse days
        //   }
        // } catch (e) {
        //   console.log(`failed to parse end date: ${e}`);
        // }
      } else {
        price = document.evaluate('.//span/span/span', el, null,
            XPathResult.STRING_TYPE, null).stringValue;
      }

      if (!price) {
        return;
      }

      // preorder elements are not yet supported
      if (!preorderElement) {
        console.log(`price ${price}`);
        const priceObj = parsePrice(price);
        console.log(`priceObj ${priceObj}`);
        obj['price'] = priceObj.value;
        obj['priceCurrency'] = priceObj.currency;
      }

      const imageElement = el.querySelector('a');

      if (imageElement) {
        obj['url'] = imageElement.href;

        const style = imageElement.currentStyle || window.getComputedStyle(imageElement, false);
        const backgroundImageUrl = style.backgroundImage.slice(5, -2).replace(/"/g, '');
        obj['small_image'] = backgroundImageUrl;
      } else {
        obj['url'] = '';
        obj['small_image'] = '';
      }

      console.log(`return obj ${obj}`);
      return obj;
    });
    console.log(`return items ${items}`);
    return items;
  });
  console.log(`return items ${items}`);
  return items;
};

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
    console.log('Wait for the required DOM to be rendered in _scrapeSection');
    try {
      await page.waitForSelector(SECTION_HTML_ELEMENT);
    } catch (error) {
      console.log(`Failed to find '${SECTION_HTML_ELEMENT}'`);
      return result;
    }
    console.log('Found needed element in _scrapeSection');

    console.log(`Trying to find deals in section #${sectionData.index}`);
    section = await page.$$eval(SECTION_HTML_ELEMENT, (items, index) => {
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

  console.log('Start scrolling...');
  await page.evaluate(async () => {
    let scrollCount = 10;

    while (scrollCount-- > 0) {
      window.scrollBy(0, 300);
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    }
  });
  console.log('Finish scrolling.');

  console.log('Wait for the required DOM to be rendered');
  const SELECTOR_SECTION_ITEMS_CELL = 'li';
  let selector = SELECTOR_SECTION_ITEMS_CELL;
  try {
    await page.waitForSelector(selector, {timeout: 5000});
  } catch (error) {
    console.log(`Failed to find '${selector}'.`);
    await page.goBack();
    return result;
  }
  console.log('Found needed element');

  selector = '//section/div/h1';
  let sectionTitle = await page.waitForSelector('xpath/' + selector);
  sectionTitle = await sectionTitle.evaluate((node) => node.innerText);
  if (!sectionTitle) {
    return result;
  }
  section['title'] = sectionTitle;

  const items = await scrapeGrid(page, SELECTOR_SECTION_ITEMS_CELL);

  result.section = section;
  result.items = items;

  return result;
};

const processSection = async (page, sectionData, resultingObject, goToMain = false) => {
  const scrapedResult = await _scrapeSection(page, sectionData);

  if (scrapedResult && scrapedResult.section) {
    resultingObject.sections.push(scrapedResult.section);
    if (goToMain) {
      await page.goto(MAIN_PAGE);
    }
  }

  if (scrapedResult.items && scrapedResult.items.length != 0) {
    scrapedResult.items.forEach((element) => {
      resultingObject.items.push(element);
    });
  }
};

// const scrapeMainPage = async (page, result) => {
//   const cellSelector = 'div.store-section-items__cell';
//   try {
//     await page.waitForSelector(cellSelector);
//   } catch (err) {
//     console.log('Can\'t find element');
//   }
//   const items = await scrapeGrid(page, cellSelector);
//   if (items) {
//     items.forEach((el) => {
//       if (!el) {
//         return;
//       }
//       result.items.push(el);
//     });
//   }

//   await page.screenshot({ path: './mainpage.png' });
// };

const scrapeAll = async (browser, mainUrl) => {
  const page = await browser.newPage();
  console.log(`Navigating to the main page ${mainUrl}...`);
  await page.goto(mainUrl);

  const result = {
    sections: [],
    items: [],
  };

  console.log('Trying to find \'Confirm\' button...');
  console.log('Wait for the language dialogue');
  try {
    await page.waitForSelector('xpath///div[@aria-label = \'Close\']');
  } catch (err) {
    console.log(`Can\'t find language dialogue. Error: ${err}`);
    return result;
  }
  const buttonSelector = '//span[contains(text(), \'Confirm\')]';
  const button = await page.waitForSelector(`xpath/${buttonSelector}`);
  if (button) {
    console.log('\'Confirm\' button found.');
    await button.click();
  }

  await setTimeout(1000);

  console.log('Scraping main page sections contents...');
  console.log('Wait for the required DOM to be rendered');
  try {
    await page.waitForSelector('xpath///main[@id=\'mdc-main-content\']');
  } catch (err) {
    console.log('Can\'t find element');
    return result;
  }

  console.log('Wait for the first link to section');
  await page.waitForSelector('xpath///div[contains(@class,' +
  '\'MDCAppStoreStoreSectionItemByline/store-section-item-byline--price\')]');

  console.log('Start scrolling...');
  await page.evaluate(async () => {
    let scrollCount = 10;

    while (scrollCount-- > 0) {
      window.scrollBy(0, 300);
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    }
  });
  console.log('Finish scrolling.');

  const hrefs = await page.$$eval('a', (as) => as.map((a) => a.href)
      .filter((href) => href.includes('section')));
  const uniqueHrefs = [...new Set(hrefs)];
  console.log(`hrefs ${uniqueHrefs}`);

  const sectionsCount = uniqueHrefs.length;
  console.log(`Sections count: ${sectionsCount}`);
  // for (let index = 0; index < sectionsCount; index++) {
  //   await processSection(page, { url: uniqueHrefs[index] }, result, true);
  // }

  console.log('Scraping favourite sections...');
  await setTimeout(1000);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/2228099660560866/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/2147175465364724/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/1916327371799806/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/377466989488910/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/594636347626579/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/989563394566732/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/323727091569600/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/328644544413671/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/728598080873692/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/549022969355907/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/305257336784520/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/2385850384822599/'}, result);
  await processSection(page,
      {url: 'https://www.meta.com/en-gb/experiences/section/336976240361150/'}, result, true);

  // console.log('Scraping main page experiences & deals...');
  // try {
  //   await scrapeMainPage(page, result);
  // } catch (err) {
  //   console.log('Can\'t scrape main page: ' + err);
  // }

  // try {
  //   console.log('Trying to find deals in the top carousel...');
  //   console.log('Wait for the required DOM to be rendered');
  //   try {
  //     await page.waitForSelector('span.store-section-item-price-label__promo',
  //       { timeout: 40000 });
  //   } catch (err) {
  //     console.log('Can\'t find element');
  //     return result;
  //   }
  //   console.log('Found needed element');

  //   const selector = '.store-section-item-tag.store-section-item-tag__blue.' +
  //     'store-section-item-price-label__promo';
  //   const link = await page.$$eval(selector, (items) => {
  //     const parentNode = items[0].parentNode.parentNode.parentNode.parentNode;
  //     const link = parentNode.parentNode.parentNode.parentNode.href;

  //     return link;
  //   });

  //   if (link == undefined || link.length == 0) {
  //     console.log('Can\'t find game\'s link');
  //     return result;
  //   }

  //   console.log(`Navigating to ${link}...`);
  //   await page.goto(link);

  //   console.log('Wait for the required DOM to be rendered');
  //   await page.waitForSelector('div.app-description__title');
  //   console.log('Found needed element');

  //   const game = await page.$$eval('div.app__row', (items) => {
  //     const parsePrice = (str) => {
  //       const priceArray = /^(.*)\$(.*)/g.exec(str);
  //       console.log(`priceArray ${priceArray}`);
  //       const priceCurrency = `${priceArray[1]}$`;
  //       const priceValue = +priceArray[2];
  //       console.log(`priceCurrency ${priceCurrency}`);
  //       console.log(`priceValue ${priceValue}`);
  //       const obj = {};
  //       obj['currency'] = priceCurrency;
  //       obj['value'] = priceValue;
  //       return obj;
  //     };

  //     console.log('Found game block');
  //     const game = {};
  //     const item = items[0];
  //     console.log('Looking for title');
  //     game['name'] = item.querySelector('.app-description__title').innerText;

  //     const discountSelector = '.app-purchase-price-discount-detail__promo-benefit';
  //     const discountString = item.querySelectorAll(discountSelector)[0].innerText;
  //     console.log(`dicsountString ${discountString}`);
  //     const discountValue = /^-(.*)%$/g.exec(discountString)[1];
  //     game['discountPercent'] = +discountValue;

  //     const salePrice = item.querySelector('span.app-purchase-price > span').innerText;
  //     const salePriceObj = parsePrice(salePrice);
  //     console.log(`salePriceObj ${salePriceObj}`);
  //     game['salePrice'] = salePriceObj.value;
  //     game['salePriceCurrency'] = salePriceObj.currency;

  //     const priceSelector = '.app-purchase-price-discount-detail__strikethrough-price > span';
  //     const price = item.querySelector(priceSelector).innerText;
  //     const priceObj = parsePrice(price);
  //     console.log(`priceObj ${priceObj}`);
  //     game['price'] = priceObj.value;
  //     game['priceCurrency'] = priceObj.currency;

  //     const now = Date.now();
  //     const timer = item.querySelector('.store-item-countdown-timer__timer').innerText;
  //     console.log(`timer ${timer}`);
  //     const timeSplitted = timer.split(':');
  //     const endsInMs = (Number(timeSplitted[0]) * 60 * 60 + Number(timeSplitted[1]) * 60 +
  //       Number(timeSplitted[2])) * 1000;
  //     console.log(`endsInMs ${endsInMs}`);
  //     const endsUtcDate = new Date(now + endsInMs);
  //     console.log(`endsUtcDate ${endsUtcDate}`);
  //     game['endsUtc'] = endsUtcDate.toISOString();

  //     return game;
  //   });
  //   game['url'] = link;

  //   result.items.push(game);
  // } catch (e) {
  //   console.log(`Can\'t find game in the carousel: ${e}`);
  // }

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
  async scraper(browser, sectionUrl = '') {
    if (sectionUrl.length == '') {
      return await scrapeAll(browser, MAIN_PAGE);
    } else {
      return await scrapeSection(browser, sectionUrl);
    }
  },
};

export default scraperObject;
