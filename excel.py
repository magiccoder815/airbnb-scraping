import pandas as pd
import json

# Load JSON data from file
with open("listing/enriched_listings.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Flatten and extract required fields
flattened_data = []
for item in data:
    host = item.get("host") or {}
    location = host.get("location") or {}

    listing = {
        "Listing ID": item.get("listing_id"),
        "Title": item.get("title"),
        "Listing Link": item.get("link"),
        "Type": item.get("listing_type"),
        "Price": item.get("listing_price"),
        "Zipcode": item.get("zipcode"),
        "Host ID": host.get("host_id"),
        "Host Name": host.get("host_name"),
        "Superhost": host.get("superhost"),
        "Host Rating": host.get("rating"),
        "Host Reviews": host.get("reviews"),
        "Host Since": host.get("started_year"),
        "Host Job": host.get("job"),
        "Host City": location.get("city"),
        "Host State": location.get("state"),
        "Host About": host.get("about"),
        "Host Listings Count": host.get("total_listings"),
        "Host Listings": ", ".join(host.get("listings", [])) if host.get("listings") else ""
    }
    flattened_data.append(listing)

# Convert to DataFrame and save to Excel
df = pd.DataFrame(flattened_data)
df.to_excel("listing/airbnb_listings_converted.xlsx", index=False)
