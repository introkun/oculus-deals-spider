import browser from './browser.js'
import scraperController from './pageController.js'

//Start the browser and create a browser instance
let browserInstance = browser.startBrowser()

// Pass the browser instance to the scraper controller
scraperController(browserInstance)