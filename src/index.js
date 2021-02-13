import browser from './browser.js'
import ScraperController from './pageController.js'
import Datastore from 'nedb'

const isInDebugMode = () => {
    return process.env.NODE_ENV && process.env.NODE_ENV === 'debug'
}

//Start the browser and create a browser instance
const startBrowserHeadless = !isInDebugMode()
let browserInstance = browser.startBrowser(startBrowserHeadless)
const scraperController = new ScraperController()

// Pass the browser instance to the scraper controller
let items = await scraperController.scrapeAll(browserInstance)

if (!isInDebugMode())
    scraperController.stopBrowser()

if (!items || items.length == 0) {
    console.log('No items found')
    process.exit(0)
}

console.log(`Scraped items:`)
items.forEach(item => {
    console.log(item)
})

const now = new Date()
items.map(el => el['createdAt'] = now.toISOString())

let db = new Datastore({filename: './oculus_discounts.db', autoload: true})

let lastWeek = new Date()
lastWeek.setDate(now.getDate() - 7) // minus 7 days

console.log(`lastWeek: ${lastWeek.toISOString()}`)

const gamesExpression = items.map(el => {
    return { name: el.name }
})

console.log(`Looking for existing games in the DB for the last week...`)
db.find({
    createdAt: {
        $gte: lastWeek.toISOString()
    },
    $or: gamesExpression
}, (err, docs) => {
    if (err) {
        console.log(`Error selecting deals from DB: ${err}`)
        return
    }

    let existingGames = new Set() // ["game1", "game2"]
    docs.forEach(el => {
        existingGames.add(el.name)
    })
    console.log(`Found ${existingGames.size} existing deal(s)`)

    items = items.filter(el => {
        return !existingGames.has(el.name)
    })

    if (items.length == 0) {
        console.log('No items to insert to DB')
        return
    }

    console.log(`Non-duplicate items to insert into DB: ${items}`)
    db.insert(items, function (err, newDocs) {
        if (err) {
            console.log(`Error inserting into DB: ${err}`)
            return
        }
        console.log(`Inserted ${newDocs.length} records into DB`)
    })
})