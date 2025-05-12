import time
import random
import pyautogui
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import undetected_chromedriver as uc
from bs4 import BeautifulSoup
from lxml import etree
from fake_useragent import UserAgent
import requests
from playwright.sync_api import sync_playwright

def random_delay(min_delay=2, max_delay=5):
    """Introduce a random delay to mimic human behavior."""
    time.sleep(random.uniform(min_delay, max_delay))

def human_like_scroll(driver, scroll_pause=2):
    """Scroll the page slowly to mimic human behavior."""
    scroll_height = driver.execute_script("return document.body.scrollHeight")
    current_scroll = 0
    while current_scroll < scroll_height:
        # Scroll down by a random amount
        scroll_step = random.randint(200, 400)
        current_scroll += scroll_step
        driver.execute_script(f"window.scrollTo(0, {current_scroll});")
        random_delay(1, scroll_pause)

        # Occasionally scroll back up
        if random.random() < 0.2:
            back_scroll = random.randint(100, 300)
            current_scroll = max(0, current_scroll - back_scroll)
            driver.execute_script(f"window.scrollTo(0, {current_scroll});")

def simulate_mouse_movement(driver, element):
    """Simulate mouse movement to an element."""
    actions = ActionChains(driver)
    actions.move_to_element(element).perform()
    random_delay(1, 3)

def simulate_typing(element, text):
    """Simulate typing into an input field."""
    for char in text:
        element.send_keys(char)
        random_delay(0.1, 0.3)  # Add a small delay between keystrokes

def get_random_headers():
    """Generate random headers to mimic real browser requests."""
    ua = UserAgent()
    headers = {
        "User-Agent": ua.random,
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
    }
    return headers

def random_click(driver):
    """Randomly click on clickable elements."""
    clickable_elements = driver.find_elements(By.TAG_NAME, "a")
    if clickable_elements:
        random.choice(clickable_elements).click()
        random_delay(2, 5)

def parse_with_xpath(html_content):
    """Parse HTML content using lxml and XPath."""
    tree = etree.HTML(html_content)
    # Example: Extract property titles and links using XPath
    titles = tree.xpath("//div[@class='property-item']//h2[@class='property-title']/text()")
    links = tree.xpath("//div[@class='property-item']//a/@href")
    return [{"title": title, "link": link} for title, link in zip(titles, links)]

def random_session_actions(driver):
    """Perform random actions to mimic a real user session."""
    actions = [human_like_scroll, random_click]
    random.shuffle(actions)  # Randomize the order of actions
    for action in actions:
        if action == human_like_scroll:
            action(driver, scroll_pause=random.randint(2, 5))  # Call with scroll_pause
        else:
            action(driver)  # Call without additional arguments

def scrape_propwire():
    # Set up undetected Chrome driver
    options = uc.ChromeOptions()
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--lang=en-US")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--proxy-server=http://<proxy_ip>:<proxy_port>")  # Add proxy if needed

    driver = uc.Chrome(options=options)

    try:
        # Navigate to the Propwire website
        url = "https://www.propwire.com"  # Replace with the actual URL
        driver.get(url)

        # Wait for the page to load
        random_delay(5, 10)

        # Scroll the page slowly
        human_like_scroll(driver)

        # Perform random session actions
        random_session_actions(driver)

        # Get the page source
        html_content = driver.page_source

        # Parse with BeautifulSoup
        soup = BeautifulSoup(html_content, "html.parser")
        properties_bs = []
        for item in soup.select(".property-item"):  # Adjust the selector based on the website's structure
            title = item.select_one(".property-title").get_text(strip=True)
            link = item.select_one("a")["href"]
            properties_bs.append({"title": title, "link": link})

        # Parse with XPath
        properties_xpath = parse_with_xpath(html_content)

        # Combine results
        return properties_bs + properties_xpath

    finally:
        driver.quit()

def scrape_with_playwright():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto("https://www.propwire.com")
        page.wait_for_timeout(5000)  # Wait for the page to load
        html_content = page.content()
        browser.close()
        return html_content

def save_to_html(data):
    """Save scraped data to an HTML file."""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Scraped Properties</title>
    </head>
    <body>
        <h1>Scraped Properties</h1>
        <ul>
    """
    for item in data:
        html_content += f'<li><a href="{item["link"]}" target="_blank">{item["title"]}</a></li>'

    html_content += """
        </ul>
    </body>
    </html>
    """

    with open("scraped_properties.html", "w", encoding="utf-8") as file:
        file.write(html_content)

if __name__ == "__main__":
    properties = scrape_propwire()
    if properties:
        save_to_html(properties)
        print("Scraped data saved to 'scraped_properties.html'")
    else:
        print("No data scraped.")