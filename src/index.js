import browser from './browser.js'
import scraperController from './pageController.js'
import Datastore from 'nedb'

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

let db = new Datastore({filename: './oculus_discounts.db', autoload: true, timestampData: true})
db.insert(items, function (err, newDocs) {
    if (err) {
        console.log(`Error inserting into DB: ${err}`)
        return
    }
    console.log(`Inserted ${newDocs.length} records into DB`)
});