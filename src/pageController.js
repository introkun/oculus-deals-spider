import scraperObject from './pageScraper.js'

async function scrapeAll(browserInstance){
    let browser;
    try{
        browser = await browserInstance
        const items = await scraperObject.scraper(browser)
        await browser.close()
        return items
    }
    catch(err){
        console.log("Could not scrape data => ", err)
    }
}

export default (browserInstance) => scrapeAll(browserInstance)