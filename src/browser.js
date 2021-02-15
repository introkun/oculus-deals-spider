import puppeteer from 'puppeteer';

const startBrowser = async function(headless = true) {
  let browser;
  try {
    console.log('Opening the browser......');
    browser = await puppeteer.launch({
      headless: headless,
      args: ['--disable-setuid-sandbox', '--no-sandbox'],
    });
  } catch (err) {
    console.log('Could not create a browser instance => : ', err);
  }
  return browser;
};

export default {
  startBrowser,
};
