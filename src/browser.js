import puppeteer from 'puppeteer'

async function startBrowser(headless = true) {
    let browser
    try {
        console.log("Opening the browser......")
        browser = await puppeteer.launch({
            headless: headless,
            args: ["--disable-setuid-sandbox", "--no-sandbox"]
        })
    } catch (err) {
        console.log("Could not create a browser instance => : ", err)
    }
    return browser
}

export default {
    startBrowser
}