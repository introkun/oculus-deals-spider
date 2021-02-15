const scrapeSection = async (page, sectionIndex) => {
    console.log('Wait for the required DOM to be rendered')
    const sectionHtmlElementName = 'div.store__section'
    await page.waitForSelector(sectionHtmlElementName)
    console.log('Found needed element')

    console.log(`Trying to find deals in section #${sectionIndex}`)
    const sectionLink = await page.$$eval(sectionHtmlElementName, (items, index) => {
        try {
            console.log(`items ${items}`)
            items = items[index]
            console.log(`items ${items}`)
            const titleElement = items.querySelector('a.store-section-header__title')
            console.log(`titleElement ${titleElement}`)
            const sectionTitle = titleElement ? titleElement.textContent : ''
            const sectionLink = titleElement.href

            console.log(`sectionTitle ${sectionTitle}`)
            console.log(`sectionLink ${sectionLink}`)

            return sectionLink
        } catch (e) {
            console.log(`Failed to scrape section: ${e}`)
            return []
        }
    }, sectionIndex)

    console.log(`Navigating to ${sectionLink}...`)
    await page.goto(sectionLink)

    console.log('Wait for the required DOM to be rendered')
    await page.waitForSelector('div.section__items-cell')
    console.log('Found needed element')

    const items = page.$$eval('div.section__items-cell', items => {
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

        items = items.filter(el => {
            return el.querySelector('span.store-section-item-tag')
        })

        items = items.map(el => {
            const obj = {}
            obj['name'] = el.querySelector('div.store-section-item__meta-name').innerText

            const dicsountString = el.querySelector('span.store-section-item-tag').innerText
            const discountValue = /^-(.*)%$/g.exec(dicsountString)[1]
            obj['discountPercent'] = +discountValue

            const salePrice = el.querySelector('span.store-section-item-price-label__sale-price > span').innerText
            const salePriceObj = parsePrice(salePrice)
            console.log(`salePriceObj ${salePriceObj}`)
            obj['salePrice'] = salePriceObj.value
            obj['salePriceCurrency'] = salePriceObj.currency

            const price = el.querySelector('s.store-section-item-price-label__strikethrough-price > span').innerText
            const priceObj = parsePrice(price)
            console.log(`priceObj ${priceObj}`)
            obj['price'] = priceObj.value
            obj['priceCurrency'] = priceObj.currency

            try {
                const now = Date.now()
                const timer = el.querySelector('span.store-item-countdown-timer__timer').innerText
                console.log(`timer ${timer}`)
                const timeSplitted = timer.split(":")
                if (timeSplitted.length > 0) {
                    const endsInMs = (Number(timeSplitted[0]) * 60 * 60 + Number(timeSplitted[1]) * 60 +
                        Number(timeSplitted[2])) * 1000
                    console.log(`endsInMs ${endsInMs}`)
                    const endsUtcDate = new Date(now + endsInMs)
                    console.log(`endsUtcDate ${endsUtcDate}`)
                    obj['endsUtc'] = endsUtcDate.toISOString()
                } else {
                    // TODO: parse days
                }
            } catch (e) {
                console.log(`failed to parse end date: ${e}`)
            }

            obj['url'] = el.querySelector('a.store-section-item-tile').href

            return obj
        })
        return items
    })

    return items
}

const scraperObject = {
    url: 'https://www.oculus.com/experiences/quest/',
    async scraper(browser){
        const page = await browser.newPage()
        console.log(`Navigating to ${this.url}...`)
        await page.goto(this.url)

        const items = await scrapeSection(page, 1)

        if (items.length != 0)
            return items

        console.log("Not found deals in 1st section")
        await page.goBack()

        console.log("Trying to find deals in 'Quest Picks' section")
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
            const game = {}
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