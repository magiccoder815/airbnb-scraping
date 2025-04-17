const puppeteer = require("puppeteer");

(async () => {
    const url = "https://www.airbnb.com/users/show/16677326";
    const host_id = url.split("/").pop(); // Extract host_id

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });

    const data = await page.evaluate((host_id) => {
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
        const monthsText = getText(
            'span[data-testid="Months hosting-stat-heading"]'
        );
        const yearText = getText(
            'span[data-testid="Year hosting-stat-heading"]'
        );

        if (yearsText && /^\d+$/.test(yearsText)) {
            started_year = currentDate.getFullYear() - parseInt(yearsText);
        } else if (yearText && /^\d+$/.test(yearText)) {
            started_year = currentDate.getFullYear() - parseInt(yearText);
        } else if (monthText && /^\d+$/.test(monthText)) {
            const monthsAgo = parseInt(monthText);
            const startedDate = new Date();
            startedDate.setMonth(startedDate.getMonth() - monthsAgo);
            started_year = startedDate.getFullYear();
        } else if (monthsText && /^\d+$/.test(monthsText)) {
            const monthsAgo = parseInt(monthsText);
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
            } else if (text.startsWith("Lives in")) {
                const loc = text.replace("Lives in", "").trim();
                const parts = loc.split(",");
                if (parts.length === 2) {
                    city = parts[0].trim();
                    state = parts[1].trim();
                } else {
                    city = loc;
                    state = null;
                }
                location = { city, state };
            } else if (text.startsWith("My work:")) {
                job = text.replace("My work:", "").trim();
            }
        });

        const listingsText = getText("div.vhfsyi9");
        let total_listings = 0;
        if (listingsText) {
            const match = listingsText.match(/View all (\d+) listings/i);
            if (match) {
                total_listings = parseInt(match[1], 10);
            }
        } else {
            const listings = document.querySelectorAll("div.cy5jw6o");
            total_listings = listings.length;
        }

        const roomLinks = Array.from(
            document.querySelectorAll("div.cy5jw6o a")
        );
        const listings = roomLinks.map((a) => {
            const href = a.getAttribute("href");
            const match = href?.match(/\/rooms\/(\d+)/);
            return match ? match[1] : null;
        });

        return {
            host_id, // passed in from Node.js
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
            listings,
        };
    }, host_id); // 👈 pass host_id here

    console.log(data);

    await browser.close();
})();
