import scraperObject from './pageScraper.js'

class ScraperController {
    constructor() {

    }

    async scrapeAll(browserInstance) {
        this.browser = null
        try{
            this.browser = await browserInstance
            const items = await scraperObject.scraper(this.browser)
            return items
        }
        catch(err){
            console.log("Could not scrape data => ", err)
        }
    }

    stopBrowser() {
        if (this.browser)
            this.browser.close()
    }
}

export default ScraperController