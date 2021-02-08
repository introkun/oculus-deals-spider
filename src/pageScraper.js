const scraperObject = {
    url: 'https://www.oculus.com/experiences/quest/',
    async scraper(browser){
        let page = await browser.newPage()
        console.log(`Navigating to ${this.url}...`)
        await page.goto(this.url)

        console.log('Wait for the required DOM to be rendered')
        await page.waitForSelector('div.store__section')
        console.log('Found needed element')

        let items = await page.$$eval('div.store__section', items => {
            const parsePrice = str => {
                const priceArray = /^(.*)\$(.*)/g.exec(str),
                    priceCurrency = `${priceArray[1]}$`, priceValue = +priceArray[2]
                console.log(`priceArray ${priceArray}`)
                console.log(`priceCurrency ${priceCurrency}`)
                console.log(`priceValue ${priceValue}`)
                const obj = {}
                obj['currency'] = priceCurrency
                obj['value'] = priceValue
                return obj
            }

            console.log(`items ${items}`)

            filtered_items = items.filter(item => {
                const title = item.querySelector('div.store-section-header__title')
                return title && title.textContent === "Quest Picks"
            })

            console.log(`filtered items ${items}`)

            if (filtered_items.length == 0)
                return []

            items = filtered_items

            items = [...items[0].querySelectorAll('.store-section-items .store-section-item__meta')]
            items = items.map(el => {
                let obj = {}
                obj['name'] = el.querySelector('.store-section-item__meta-name').innerText

                const dicsountString = el.querySelector('.store-section-item-tag').innerText
                const discountValue = /^-(.*)%$/g.exec(dicsountString)[1]
                obj['discountPercent'] = +discountValue

                const salePrice = el.querySelector('.store-section-item-price-label__sale-price > span').innerText
                const salePriceObj = parsePrice(salePrice)
                console.log(`salePriceObj ${salePriceObj}`)
                obj['salePrice'] = salePriceObj.value
                obj['salePriceCurrency'] = salePriceObj.currency

                const price = el.querySelector('.store-section-item-price-label__strikethrough-price > span').innerText
                const priceObj = parsePrice(price)
                console.log(`priceObj ${priceObj}`)
                obj['price'] = priceObj.value
                obj['priceCurrency'] = priceObj.currency

                const now = Date.now()
                const timer = el.querySelector('.store-item-countdown-timer__timer').innerText
                console.log(`timer ${timer}`)
                const timeSplitted = timer.split(":")
                const endsInMs = (Number(timeSplitted[0]) * 60 * 60 + Number(timeSplitted[1]) * 60 +
                    Number(timeSplitted[2])) * 1000
                console.log(`endsInMs ${endsInMs}`)
                const endsUtcDate = new Date(now + endsInMs)
                console.log(`endsUtcDate ${endsUtcDate}`)
                obj['endsUtc'] = endsUtcDate.toISOString()

                return obj
            })

            return items
        })

        if (items.length != 0)
            return items

        console.log('Wait for the required DOM to be rendered')
        await page.waitForSelector('span.store-section-item-price-label__promo')
        console.log('Found needed element')

        const link = await page.$$eval('.store-section-item-tag.store-section-item-tag__blue.store-section-item-price-label__promo', items => {
            const link = items[0].parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.href

            return link
        })

        if (link == undefined || link.length == 0) {
            console.log("Can't find game's link")
            return []
        }

        console.log(`Navigating to ${link}...`)
        await page.goto(link)

        console.log('Wait for the required DOM to be rendered')
        await page.waitForSelector('div.app-description__title')
        console.log('Found needed element')

        const game = await page.$$eval('div.app__row', items => {
            const parsePrice = str => {
                const priceArray = /^(.*)\$(.*)/g.exec(str),
                    priceCurrency = `${priceArray[1]}$`, priceValue = +priceArray[2]
                console.log(`priceArray ${priceArray}`)
                console.log(`priceCurrency ${priceCurrency}`)
                console.log(`priceValue ${priceValue}`)
                const obj = {}
                obj['currency'] = priceCurrency
                obj['value'] = priceValue
                return obj
            }

            console.log("Found game block")
            let game = {}
            const item = items[0]
            console.log("Looking for title")
            game["name"] = item.querySelector('.app-description__title').innerText

            const dicsountString = item.querySelectorAll('.app-purchase-price-discount-detail__promo-benefit')[0].innerText
            console.log(`dicsountString ${dicsountString}`)
            const discountValue = /^-(.*)%$/g.exec(dicsountString)[1]
            game['discountPercent'] = +discountValue

            const salePrice = item.querySelector('span.app-purchase-price > span').innerText
            const salePriceObj = parsePrice(salePrice)
            console.log(`salePriceObj ${salePriceObj}`)
            game['salePrice'] = salePriceObj.value
            game['salePriceCurrency'] = salePriceObj.currency

            const price = item.querySelector('.app-purchase-price-discount-detail__strikethrough-price > span').innerText
            const priceObj = parsePrice(price)
            console.log(`priceObj ${priceObj}`)
            game['price'] = priceObj.value
            game['priceCurrency'] = priceObj.currency

            const now = Date.now()
            const timer = item.querySelector('.store-item-countdown-timer__timer').innerText
            console.log(`timer ${timer}`)
            const timeSplitted = timer.split(":")
            const endsInMs = (Number(timeSplitted[0]) * 60 * 60 + Number(timeSplitted[1]) * 60 +
                Number(timeSplitted[2])) * 1000
            console.log(`endsInMs ${endsInMs}`)
            const endsUtcDate = new Date(now + endsInMs)
            console.log(`endsUtcDate ${endsUtcDate}`)
            game['endsUtc'] = endsUtcDate.toISOString()

            return game
        })
        game['url'] = link
        items.push(game)

        return items
    }
}

export default scraperObject