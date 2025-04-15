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
driver.implicitly_wait(10)

# Find the main div containing the listings
listings_div = driver.find_element(By.CSS_SELECTOR, "div.gsgwcjk.atm_10yczz8_kb7nvz")  # Adjust class as needed

# Find all individual listing divs within the main div
listing_divs = listings_div.find_elements(By.CSS_SELECTOR, "div.c965t3n.atm_9s_11p5wf0.atm_dz_1osqo2v")  # Adjust to match actual listing divs

# Extract links from each listing
listing_links = []
for div in listing_divs:
    # Find the anchor tag within the listing div
    link = div.find_element(By.TAG_NAME, "a")
    if link and link.get_attribute("href"):
        listing_links.append(link.get_attribute("href"))

# Print the scraped links
for idx, listing_link in enumerate(listing_links, start=1):
    print(f"{idx}: {listing_link}")

# Close the WebDriver
driver.quit()