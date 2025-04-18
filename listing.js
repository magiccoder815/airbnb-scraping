const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // Set to true for headless mode
        defaultViewport: null,
        args: ["--lang=en-US"],
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US" });

    fs.mkdirSync("listing", { recursive: true });

    for (let zipcode = 10001; zipcode <= 10005; zipcode++) {
        console.log(`\n📍 Starting ZIP Code: ${zipcode}`);
        const baseUrl = `https://www.airbnb.com/s/New-York--NY-${zipcode}/homes?currency=USD`;

        await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const listingData = [];

        for (let pageNum = 1; pageNum <= 15; pageNum++) {
            console.log(`📄 Scraping Page ${pageNum} for ZIP ${zipcode}...`);

            try {
                // const listingDivs = await page.$$(
                //   "div.gsgwcjk.atm_10yczz8_kb7nvz div.c965t3n.atm_9s_11p5wf0.atm_dz_1osqo2v"
                // );
                const listingDivs = await page.$$(
                    'div[data-testid="card-container"]'
                );

                for (let i = 0; i < listingDivs.length; i++) {
                    try {
                        const divHandle = listingDivs[i];

                        const fullLink = await divHandle.$eval(
                            "a",
                            (a) => a.href
                        );
                        const link = fullLink.split("?")[0];
                        const listingId = link.split("/").pop();
                        console.log("link---", link);
                        let priceText = "Price not found";
                        const priceSpan =
                            (await divHandle.$("span.u1y3vocb")) ||
                            (await divHandle.$("span._hb913q"));
                        if (priceSpan) {
                            priceText = await priceSpan.evaluate((el) =>
                                el.innerText.trim()
                            );
                        }

                        const priceMatch = priceText.match(/\d+/g);
                        const price = priceMatch
                            ? parseInt(priceMatch.join(""))
                            : null;
                        console.log("price------: ", price);

                        listingData.push({
                            link,
                            listingId,
                            price,
                            zipcode,
                        });
                    } catch (err) {
                        console.log(
                            `⚠️ Error collecting listing #${i + 1}: ${
                                err.message
                            }`
                        );
                    }
                }

                // Try to go to the next page, if available
                if (pageNum < 15) {
                    await page.waitForSelector('a[aria-label="Next"]', {
                        timeout: 5000,
                    });
                    const nextButton = await page.$('a[aria-label="Next"]');
                    // console.log("-------------", nextButton);
                    if (nextButton) {
                        await nextButton.click();
                        await new Promise((resolve) =>
                            setTimeout(resolve, 2000)
                        );
                    } else {
                        console.log(
                            "❌ No next page found. Stopping scraping."
                        );
                        break;
                    }
                }
            } catch (err) {
                console.log(
                    `❌ Error scraping page ${pageNum} in ZIP ${zipcode}: ${err.message}`
                );
                continue;
            }
        }

        const listingDetails = [];

        for (let i = 0; i < listingData.length; i++) {
            const item = listingData[i];

            try {
                await page.goto(item.link, { waitUntil: "domcontentloaded" });
                await new Promise((resolve) => setTimeout(resolve, 3000));

                const title = await page
                    .$eval("h1.hpipapi", (el) => el.innerText.trim())
                    .catch(() => "Title not found");
                const listingType = await page
                    .$eval("div.t1kjrihn h2", (el) => el.innerText.trim())
                    .catch(() => "Listing Type not found");
                await page.waitForSelector("div.c1416qhh a"); // Wait for the host link to be available
                const hostLink = await page
                    .$eval("div.c1416qhh a", (a) => a.href)
                    .catch(() => "Host Link not found");

                listingDetails.push({
                    link: item.link,
                    listing_id: item.listingId,
                    title,
                    listing_type: listingType,
                    listing_price: item.price,
                    zipcode: item.zipcode,
                    host_url: hostLink,
                });

                console.log(
                    `[${i + 1}] ✅ Scraped: ${title} | ${listingType} | ${
                        item.price
                    } | ${item.listingId} | ${hostLink}`
                );
            } catch (err) {
                console.log(
                    `❌ Error processing listing #${i + 1}: ${err.message}`
                );
                continue;
            }
        }

        fs.writeFileSync(
            path.join("listing", `${zipcode}.json`),
            JSON.stringify(listingDetails, null, 2),
            "utf8"
        );

        console.log(
            `\n✅ Saved ${listingDetails.length} listings to 'listing/${zipcode}.json'`
        );
    }

    await browser.close();
})();
