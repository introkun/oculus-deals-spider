import browser from './browser.js'
import scraperController from './pageController.js'
import Datastore from 'nedb'

//Start the browser and create a browser instance
let browserInstance = browser.startBrowser()

// Pass the browser instance to the scraper controller
let items = await scraperController(browserInstance)

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

let last24hours = new Date()
last24hours.setDate(now.getDate() - 1) // minus 1 day

console.log(`last24hours: ${last24hours.toISOString()}`)

const gamesExpression = items.map(el => {
    return { name: el.name }
})

console.log(`Looking for existing games in the DB for the last 24 hours...`)
db.find({
    createdAt: {
        $gte: last24hours.toISOString()
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