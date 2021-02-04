const scraperObject = {
    url: 'https://www.oculus.com/experiences/quest/',
    async scraper(browser){
        let page = await browser.newPage()
        console.log(`Navigating to ${this.url}...`)
        await page.goto(this.url)

        console.log('Wait for the required DOM to be rendered')
        await page.waitForSelector('div.store__section')
        console.log('Found needed element')


        const items = await page.$$eval('div.store__section', items => {
            const parsePrice = str => {
                const priceArray = str.split("$"),
                    priceCurrency = priceArray[0] + "$", priceValue = +priceArray[1]
                console.log(`priceArray ${priceArray}`)
                console.log(`priceCurrency ${priceCurrency}`)
                console.log(`priceValue ${priceValue}`)
                const obj = {}
                obj['currency'] = priceCurrency
                obj['value'] = priceValue
                return obj
            }

            items = items.filter(item => {
                const title = item.querySelector('div.store-section-header__title')
                return title && title.textContent === "Quest Picks"
            })
            items = [...items[0].querySelectorAll('.store-section-items .store-section-item__meta')]
            items = items.map(el => {
                let obj = {}
                obj['name'] = el.querySelector('.store-section-item__meta-name').innerText
                obj['discount'] = el.querySelector('.store-section-item-tag').innerText

                const salePrice = el.querySelector('.store-section-item-price-label__sale-price > span').innerText
                const salePriceObj = parsePrice(salePrice)
                console.log(`salePriceObj ${salePriceObj}`)
                obj['sale-price'] = salePriceObj.value
                obj['sale-price-currency'] = salePriceObj.currency

                const price = el.querySelector('.store-section-item-price-label__strikethrough-price > span').innerText
                const priceObj = parsePrice(price)
                console.log(`priceObj ${priceObj}`)
                obj['price'] = priceObj.value
                obj['price-currency'] = priceObj.currency

                const now = Date.now()
                const timer = el.querySelector('.store-item-countdown-timer__timer').innerText
                console.log(`timer ${timer}`)
                const timeSplitted = timer.split(":")
                const endsInMs = (Number(timeSplitted[0]) * 60 * 60 + Number(timeSplitted[1]) * 60 +
                    Number(timeSplitted[2])) * 1000
                console.log(`endsInMs ${endsInMs}`)
                const endsUtcDate = new Date(now + endsInMs)
                console.log(`endsUtcDate ${endsUtcDate}`)
                obj['ends-utc'] = endsUtcDate.toUTCString()

                return obj
            })

            return items
        })
        console.log(items)
    }
}

export default scraperObject