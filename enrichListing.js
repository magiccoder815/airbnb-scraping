const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");
const XLSX = require("xlsx");

const scrapeHostData = async (url, browser) => {
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

        const yearText = getText(
            'span[data-testid="Year hosting-stat-heading"]'
        );
        const yearsText = getText(
            'span[data-testid="Years hosting-stat-heading"]'
        );
        const monthText = getText(
            'span[data-testid="Month hosting-stat-heading"]'
        );

        const monthsText = getText(
            'span[data-testid="Months hosting-stat-heading"]'
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
        let languages = null,
            location = null,
            job = null,
            city = null,
            state = null;

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

        let total_listings = 0;
        const listingsText = getText("div.vhfsyi9");
        if (listingsText) {
            const match = listingsText.match(/View all (\d+) listings/i);
            if (match) total_listings = parseInt(match[1], 10);
        } else {
            const listings = document.querySelectorAll("div.cy5jw6o");
            total_listings = listings.length;
        }

        return {
            host_url: window.location.href,
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

    await page.close();
    return data;
};

(async () => {
    const inputPath = path.join(__dirname, "listing/merged_listings.json");
    const outputJsonPath = path.join(
        __dirname,
        "listing/enriched_listings.json"
    );
    const outputExcelPath = path.join(
        __dirname,
        "listing/enriched_listings.xlsx"
    );

    const rawData = await fs.readFile(inputPath, "utf-8");
    const listings = JSON.parse(rawData);

    const browser = await puppeteer.launch({ headless: "new" });

    for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        console.log(
            `Scraping ${i + 1}/${listings.length}: ${listing.host_url}`
        );
        try {
            const hostData = await scrapeHostData(listing.host_url, browser);
            listing.host = hostData;
        } catch (err) {
            console.error(`Failed to scrape ${listing.host_url}`, err);
        }
    }

    await browser.close();

    // Save enriched JSON
    await fs.writeFile(outputJsonPath, JSON.stringify(listings, null, 2));
    console.log("✅ JSON saved to enriched_listings.json");

    // Prepare flat data for Excel
    const flatData = listings.map((listing) => {
        const host = listing.host || {};
        return {
            link: listing.link || "",
            title: listing.title || "",
            listing_type:
                listing.listing_type === "Listing Type not found"
                    ? ""
                    : listing.listing_type || "",
            listing_price: listing.listing_price || "",
            zipcode: listing.zipcode || "",
            host_url: listing.host_url || "",

            host_name: host.host_name || "",
            avatar_url: host.avatar_url || "",
            superhost: host.superhost || false,
            reviews: host.reviews || 0,
            rating: host.rating || "",
            about: host.about || "",
            started_year: host.started_year || "",
            languages: host.languages ? host.languages.join(", ") : "",
            host_city: host.location?.city || "",
            host_state: host.location?.state || "",
            host_job: host.job || "",
            total_listings: host.total_listings || 0,
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enriched Listings");
    XLSX.writeFile(workbook, outputExcelPath);
    console.log("📊 Excel saved to enriched_listings.xlsx");
})();
