const scraperObject = {
    url: 'https://www.oculus.com/experiences/quest/',
    async scraper(browser){
        let page = await browser.newPage()
        console.log(`Navigating to ${this.url}...`)
        await page.goto(this.url)

        console.log('Wait for the required DOM to be rendered')
        await page.waitForSelector('div.store__section')
        console.log('Found needed element')


        // 'div.store__section:nth-child(1) > div.store-section .store-section-items__cell'
        const items = await page.$$eval('div.store__section', items => {
            items = items.filter(item => {
                const title = item.querySelector('div.store-section-header__title')
                return title && title.textContent === "Quest Picks"
            })
            items = [...items[0].querySelectorAll('.store-section-items .store-section-item__meta-name')]
            items = items.map(el => el.innerText)

            return items
        })
        console.log(items)
    }
}

export default scraperObject