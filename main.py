import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Set up the WebDriver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

# Open the URL
url = "https://www.airbnb.com/s/New-York--NY-10002/homes"
driver.get(url)

# Allow time for the page to load
time.sleep(5)  # Adjust sleep time as necessary

# Find the main div containing the listings
listings_div = driver.find_element(By.CSS_SELECTOR, "div.gsgwcjk.atm_10yczz8_kb7nvz")  # Adjust class as needed

# Find all individual listing divs within the main div
listing_divs = listings_div.find_elements(By.CSS_SELECTOR, "div.c965t3n.atm_9s_11p5wf0.atm_dz_1osqo2v")  # Adjust to match actual listing divs

# Extract links from each listing
listing_links = []
for div in listing_divs:
    link = div.find_element(By.TAG_NAME, "a")
    if link and link.get_attribute("href"):
        listing_links.append(link.get_attribute("href"))

# Save the links to a JSON file
with open('listing_links.json', 'w') as json_file:
    json.dump(listing_links, json_file, indent=4)

print(f"Saved {len(listing_links)} links to listing_links.json")

# Now scrape details from each listing link using Selenium
listing_details = []

for link in listing_links:
    driver.get(link)
    time.sleep(5)  # Allow time for the page to load

    # Extract the title
    try:
        title = driver.find_element(By.CSS_SELECTOR, 'h1.hpipapi')  # Adjust the selector as needed
        title_text = title.text.strip() if title else 'Title not found'
    except Exception as e:
        title_text = 'Title not found'
        print(f"Error retrieving title: {e}")

    # You can extract more details as needed
    listing_details.append({
        'link': link,
        'title': title_text,
    })

# Save the listing details to a JSON file
with open('listing_details.json', 'w') as details_file:
    json.dump(listing_details, details_file, indent=4)

print(f"Saved listing details to listing_details.json")

# Close the WebDriver
driver.quit()