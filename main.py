import json
import time
import re
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Set up the WebDriver
options = webdriver.ChromeOptions()
options.add_argument("--lang=en-US")  # Set browser language to English (US)
options.add_argument("--disable-blink-features=AutomationControlled")

# Set US geolocation (latitude, longitude, accuracy)
options.add_experimental_option("prefs", {
    "intl.accept_languages": "en-US,en",
    "profile.default_content_setting_values.geolocation": 1
})


driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Ensure the 'listing' directory exists
os.makedirs("listing", exist_ok=True)

# Loop through ZIP codes 10001 to 10005
for zipcode in range(10001, 10006):
    print(f"\n📍 Starting ZIP Code: {zipcode}")
    base_url = f"https://www.airbnb.com/s/New-York--NY-{zipcode}/homes"
    driver.get(base_url)
    time.sleep(5)

    listing_data = []

    # Loop through pages 1 to 15
    for page in range(1, 16):
        print(f"📄 Scraping Page {page} for ZIP {zipcode}...")
        time.sleep(5)

        try:
            listings_div = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.gsgwcjk.atm_10yczz8_kb7nvz"))
            )
            listing_divs = listings_div.find_elements(By.CSS_SELECTOR, "div.c965t3n.atm_9s_11p5wf0.atm_dz_1osqo2v")

            for index, div in enumerate(listing_divs):
                try:
                    link_elem = div.find_element(By.TAG_NAME, "a")
                    link = link_elem.get_attribute("href")

                    # Try to extract the price
                    price_text = 'Price not found'
                    try:
                        price_elem = div.find_element(By.CSS_SELECTOR, 'span.u1qzfr7o')
                        price_text = price_elem.text.strip()
                    except:
                        try:
                            price_elem = div.find_element(By.CSS_SELECTOR, 'span.umuerxh')
                            price_text = price_elem.text.strip()
                        except:
                            pass

                    price_number = re.sub(r'[^\d]', '', price_text) if price_text != 'Price not found' else price_text
                    print("price------: ", price_number)
                    listing_data.append({
                        'link': link,
                        'price': price_number,
                        'zipcode': zipcode
                    })
                except Exception as e:
                    print(f"⚠️ Error collecting listing #{index+1} on page {page}: {e}")

            # Click the "Next" button if it's not the last page
            if page < 15:
                try:
                    next_button = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, '//a[@aria-label="Next"]'))
                    )
                    driver.execute_script("arguments[0].scrollIntoView();", next_button)
                    time.sleep(1)
                    next_button.click()
                except Exception as e:
                    print(f"❌ Failed to go to next page: {e}")
                    break

        except Exception as e:
            print(f"❌ Error scraping page {page} in ZIP {zipcode}: {e}")
            break

    # Step 2: Visit each listing and scrape details
    listing_details = []

    for i, item in enumerate(listing_data):
        try:
            driver.get(item['link'])
            time.sleep(3)

            # Extract listing title
            try:
                title_elem = driver.find_element(By.CSS_SELECTOR, 'h1.hpipapi')
                title = title_elem.text.strip()
            except:
                title = 'Title not found'

            # Extract listing type
            try:
                type_elem = driver.find_element(By.CSS_SELECTOR, 'h3.hpipapi')
                listing_type = type_elem.text.strip()
            except:
                listing_type = 'Listing Type not found'

            # Extract host profile URL
            try:
                host_link_elem = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'div.c1416qhh a'))
                )
                host_link = host_link_elem.get_attribute("href")
                print("Host URL:", host_link)
            except:
                host_link = 'Host Link not found'

            listing_details.append({
                'link': item['link'],
                'title': title,
                'listing_type': listing_type,
                'listing_price': item['price'],
                'zipcode': item['zipcode'],
                'host_url': host_link
            })

            print(f"[{i+1}] ✅ Scraped: {title} | {listing_type} | {item['price']} | ZIP: {item['zipcode']} | {host_link}")
        except Exception as e:
            print(f"❌ Error processing listing #{i+1}: {e}")
            continue

    # Save ZIP-specific results to JSON
    with open(f'listing/{zipcode}.json', 'w') as f:
        json.dump(listing_details, f, indent=4)

    print(f"\n✅ Saved {len(listing_details)} listings to 'listing/{zipcode}.json'")

# Close the browser
driver.quit()
