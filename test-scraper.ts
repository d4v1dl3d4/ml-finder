import puppeteer from 'puppeteer';

interface MLSearchResult {
  id: string;
  title: string;
  price: number;
  permalink: string;
  thumbnail: string;
  condition: string;
}

interface ProductData {
  title: string;
  author?: string;
  brand?: string;
  isbn?: string;
  productCode?: string;
}

/**
 * Test the Puppeteer scraper with sample data
 */
async function testMLScraper(productData: ProductData): Promise<MLSearchResult[]> {
  // Build search query based on available product data
  let query = '';
  
  if (productData.isbn) {
    query = productData.isbn;
  } else if (productData.productCode) {
    query = productData.productCode;
  } else {
    // Use title and author/brand for search
    query = productData.title;
    if (productData.author) {
      query += ` ${productData.author}`;
    } else if (productData.brand) {
      query += ` ${productData.brand}`;
    }
  }

  let browser;
  try {
    console.log(`🔍 Testing web scraping for: "${query}"`);

    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to false to see what's happening
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to ML Argentina search
    const searchUrl = `https://listado.mercadolibre.com.ar/${encodeURIComponent(query)}`;
    console.log(`📱 Navigating to: ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    
    console.log('⏳ Waiting for search results...');
    
    // Wait for search results to load
    await page.waitForSelector('.ui-search-results', { timeout: 15000 });
    
    console.log('✅ Search results container found');
    
    // Extract product information from the first 5 results
    const products = await page.evaluate(() => {
      // @ts-ignore - document is available in browser context
      const productElements = document.querySelectorAll('.ui-search-results .ui-search-result');
      console.log(`Found ${productElements.length} product elements`);
      
      const results: Array<{
        id: string;
        title: string;
        price: number;
        permalink: string;
        thumbnail: string;
        condition: string;
      }> = [];
      
      for (let i = 0; i < Math.min(5, productElements.length); i++) {
        const element = productElements[i];
        
        try {
          // Extract title
          const titleElement = element.querySelector('.ui-search-item__title');
          const title = titleElement?.textContent?.trim() || 'Title not found';
          
          // Extract price
          const priceElement = element.querySelector('.andes-money-amount__fraction');
          const priceText = priceElement?.textContent?.replace(/\./g, '') || '0';
          const price = parseInt(priceText) || 0;
          
          // Extract URL
          const linkElement = element.querySelector('a.ui-search-link');
          const permalink = linkElement?.getAttribute('href') || '';
          
          // Extract thumbnail
          const imgElement = element.querySelector('img');
          const thumbnail = imgElement?.getAttribute('src') || imgElement?.getAttribute('data-src') || '';
          
          // Extract condition (new/used)
          const conditionElement = element.querySelector('.ui-search-item__subtitle');
          const conditionText = conditionElement?.textContent?.toLowerCase() || '';
          const condition = conditionText.includes('usado') ? 'used' : 'new';
          
          // Generate ID from URL or use index
          const urlParts = permalink.split('/');
          const id = urlParts[urlParts.length - 1] || `scraped-${i + 1}`;
          
          console.log(`Product ${i + 1}: ${title} - $${price}`);
          
          results.push({
            id,
            title,
            price,
            permalink,
            thumbnail,
            condition
          });
        } catch (error) {
          console.error(`Error extracting product ${i + 1}:`, error);
        }
      }
      
      return results;
    });
    
    console.log(`✅ Successfully scraped ${products.length} products`);
    
    // Keep browser open for 3 seconds to see the results
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return products;
    
  } catch (error) {
    console.error('❌ Error scraping ML products:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Test with sample product data
async function runTest() {
  const testProducts = [
    {
      title: "iPhone 15",
      brand: "Apple"
    },
    {
      title: "Samsung Galaxy S24"
    },
    {
      title: "MacBook Pro",
      brand: "Apple"
    }
  ];

  for (const testProduct of testProducts) {
    console.log(`\n🧪 Testing with: ${JSON.stringify(testProduct)}`);
    console.log('=' .repeat(50));
    
    try {
      const results = await testMLScraper(testProduct);
      
      console.log('\n📋 Results:');
      results.forEach((product, index) => {
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   Price: $${product.price}`);
        console.log(`   Condition: ${product.condition}`);
        console.log(`   URL: ${product.permalink}`);
        console.log('');
      });
      
    } catch (error) {
      console.error(`❌ Test failed for ${testProduct.title}:`, error);
    }
    
    // Wait between tests
    console.log('⏳ Waiting 5 seconds before next test...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Run the test
runTest().catch(console.error);
