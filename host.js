const puppeteer = require("puppeteer");

(async () => {
    const url = "https://www.airbnb.com/users/show/2518984";

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });

    const data = await page.evaluate(() => {
        const getText = (selector) => {
            const el = document.querySelector(selector);
            return el ? el.innerText.trim() : null;
        };

        const getAttr = (selector, attr) => {
            const el = document.querySelector(selector);
            return el ? el.getAttribute(attr) : null;
        };

        const host_name = getText("span.t1gpcl1t");
        const avatar_url = getAttr("img.i1ezuexe", "src");

        const superhostText = getText("span.s1h3l0w7");
        const superhost = superhostText && superhostText.includes("Superhost");

        const reviewsText = getText('span[data-testid="Reviews-stat-heading"]');
        const reviews = reviewsText
            ? parseInt(reviewsText.replace(/\D/g, ""))
            : 0;

        const ratingText = getText("div.rz5w5y3");
        const rating = ratingText ? parseFloat(ratingText) : null;

        const currentDate = new Date();
        let started_year = null;

        const yearsText = getText(
            'span[data-testid="Years hosting-stat-heading"]'
        );

        const monthText = getText(
            'span[data-testid="Month hosting-stat-heading"]'
        );

        if (yearsText && /^\d+$/.test(yearsText)) {
            started_year = currentDate.getFullYear() - parseInt(yearsText);
        } else if (monthText && /^\d+$/.test(monthText)) {
            const monthsAgo = parseInt(monthText);
            const startedDate = new Date();
            startedDate.setMonth(startedDate.getMonth() - monthsAgo);
            started_year = startedDate.getFullYear();
        }

        const about = getText("span._1e2prbn");

        const infoSpans = Array.from(document.querySelectorAll("span.i9y0ogw"));
        let languages = null;
        let location = null;
        let job = null;

        infoSpans.forEach((span) => {
            const text = span.innerText.trim();
            if (text.startsWith("Speaks")) {
                languages = text
                    .replace("Speaks", "")
                    .trim()
                    .replace(/\s+and\s+/g, ", ")
                    .split(",")
                    .map((l) => l.trim())
                    .filter(Boolean);
            }
        });

        const listingsText = getText("div.vhfsyi9");
        if (listingsText) {
            const match = listingsText.match(/View all (\d+) listings/i);
            if (match) {
                total_listings = parseInt(match[1], 10);
            }
        } else {
            // Fallback: count .fb4nyux divs
            const listings = document.querySelectorAll("div.fb4nyux");
            total_listings = listings.length;
        }

        return {
            host_name,
            avatar_url,
            superhost,
            reviews,
            rating,
            about,
            started_year,
            languages,
            location,
            job,
            total_listings,
        };
    });

    console.log(data);

    await browser.close();
})();
