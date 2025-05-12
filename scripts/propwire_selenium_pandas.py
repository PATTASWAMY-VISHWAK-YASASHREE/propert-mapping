import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def scrape_propwire(search_term, output_csv='propwire_results.csv'):
    # Configure WebDriver
    options = Options()
    options.add_argument("--headless")
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
    driver.get(f'https://propwire.com/search?query={search_term}')

    time.sleep(5)  # Wait for JS content to load. Use explicit waits in real code.

    data = []
    cards = driver.find_elements(By.CSS_SELECTOR, '.property-card')
    for card in cards:
        address = card.find_element(By.CSS_SELECTOR, '.property-address').text if card.find_elements(By.CSS_SELECTOR, '.property-address') else ''
        price = card.find_element(By.CSS_SELECTOR, '.property-price').text if card.find_elements(By.CSS_SELECTOR, '.property-price') else ''
        beds = card.find_element(By.CSS_SELECTOR, '.property-beds').text if card.find_elements(By.CSS_SELECTOR, '.property-beds') else ''
        baths = card.find_element(By.CSS_SELECTOR, '.property-baths').text if card.find_elements(By.CSS_SELECTOR, '.property-baths') else ''
        sqft = card.find_element(By.CSS_SELECTOR, '.property-sqft').text if card.find_elements(By.CSS_SELECTOR, '.property-sqft') else ''
        image = card.find_element(By.CSS_SELECTOR, '.property-image img').get_attribute('src') if card.find_elements(By.CSS_SELECTOR, '.property-image img') else ''
        detail_url = card.find_element(By.CSS_SELECTOR, '.property-link').get_attribute('href') if card.find_elements(By.CSS_SELECTOR, '.property-link') else ''
        data.append({
            "address": address,
            "price": price,
            "bedrooms": beds,
            "bathrooms": baths,
            "sqft": sqft,
            "image": image,
            "detailUrl": detail_url
        })

    driver.quit()

    # Post-process with pandas
    df = pd.DataFrame(data)
    df.to_csv(output_csv, index=False)
    print(f"Saved {len(df)} rows to {output_csv}")
    return df

if __name__ == "__main__":
    import sys
    search = sys.argv[1] if len(sys.argv) > 1 else "new york"
    out = sys.argv[2] if len(sys.argv) > 2 else "propwire_results.csv"
    scrape_propwire(search, out)