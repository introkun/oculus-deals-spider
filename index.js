import browser from './browser.js'
import scraperController from './pageController.js'

//Start the browser and create a browser instance
let browserInstance = browser.startBrowser()

// Pass the browser instance to the scraper controller
const items = await scraperController(browserInstance)

console.log("scraped items")
items.forEach(item => {
    console.log(`item: ${item.name}`)
    console.log(`\tprice ${item.priceCurrency}${item.price}`)
    console.log(`\tsale price ${item.salePriceCurrency}${item.salePrice}`)
    console.log(`\tdiscount ${item.discountPercent}%`)
    console.log(`\tends ${item.endsUtc}`)
})