// Usage: node propWirePuppeteer.js "search-term" [output-csv]
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapePropwire(searchTerm, outputCsvPath = 'propwire_results.csv') {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set a realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');

  // Compose URL (update as needed, and adapt for real search)
  const url = `https://propwire.com/search?query=${encodeURIComponent(searchTerm)}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Optionally handle login/cookies if needed

  // Scrape property data (update selectors as needed)
  const properties = await page.evaluate(() => {
    // Replace selectors with those matching Propwire's current structure
    return Array.from(document.querySelectorAll('.property-card')).map(card => ({
      address: card.querySelector('.property-address')?.innerText.trim(),
      price: card.querySelector('.property-price')?.innerText.trim(),
      bedrooms: card.querySelector('.property-beds')?.innerText.trim(),
      bathrooms: card.querySelector('.property-baths')?.innerText.trim(),
      sqft: card.querySelector('.property-sqft')?.innerText.trim(),
      image: card.querySelector('.property-image img')?.src,
      detailUrl: card.querySelector('.property-link')?.href,
    }));
  });

  console.log(`Scraped ${properties.length} properties`);
  fs.writeFileSync(outputCsvPath, "address,price,bedrooms,bathrooms,sqft,image,detailUrl\n" + 
    properties.map(p => [
      JSON.stringify(p.address ?? ''),
      JSON.stringify(p.price ?? ''),
      JSON.stringify(p.bedrooms ?? ''),
      JSON.stringify(p.bathrooms ?? ''),
      JSON.stringify(p.sqft ?? ''),
      JSON.stringify(p.image ?? ''),
      JSON.stringify(p.detailUrl ?? ''),
    ].join(",")).join("\n")
  );

  await browser.close();
  return properties;
}

// CLI usage or as a module
if (require.main === module) {
  const searchTerm = process.argv[2] || '';
  const output = process.argv[3] || 'propwire_results.csv';
  if (!searchTerm) {
    console.error('Usage: node propWirePuppeteer.js "search-term" [output-csv]');
    process.exit(1);
  }
  scrapePropwire(searchTerm, output).then(props => {
    console.log('Done.');
  });
}

module.exports = { scrapePropwire };