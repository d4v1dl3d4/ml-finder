import puppeteer from 'puppeteer';
import { ProductData } from './analyzer';

export interface MLSearchResult {
  id: string;
  title: string;
  price: number;
  permalink: string;
  thumbnail: string;
  condition: string;
}

/**
 * Search for products in Mercado Libre using web scraping
 */
export async function searchMLProducts(productData: ProductData, siteId: string = 'MLA'): Promise<MLSearchResult[]> {
  // Build search query using the specific category that Claude determined
  let query = '';
  
  // Use the specific category (cd, vinilo, libro, etc.) + title + author/brand
  query = `${productData.categoria} ${productData.titulo}`;
  if (productData.autor) {
    query += ` ${productData.autor}`;
  } else if (productData.marca) {
    query += ` ${productData.marca}`;
  }

  let browser;
  try {
    console.log(`🔍 Web scraping ML for: "${query}"`);

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to ML Argentina search
    const searchUrl = `https://listado.mercadolibre.com.ar/${encodeURIComponent(query)}`;
    console.log(`📱 Navigating to: ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    
    // Wait for search results to load
    await page.waitForSelector('.ui-search-results', { timeout: 10000 });
    
    // Extract product information from the first 5 results
    const products = await page.evaluate(() => {
      // @ts-ignore - document is available in browser context
      const productElements = document.querySelectorAll('.ui-search-results li');
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
          // Try multiple selectors for title
          let title = 'Title not found';
          const titleSelectors = [
            '.ui-search-item__title',
            'h2 a',
            '[data-testid="item-title"]',
            'a[href*="MLA"]'
          ];
          
          for (const selector of titleSelectors) {
            const titleElement = element.querySelector(selector);
            if (titleElement?.textContent?.trim()) {
              title = titleElement.textContent.trim();
              break;
            }
          }
          
          // Try multiple selectors for price
          let price = 0;
          const priceSelectors = [
            '.andes-money-amount__fraction',
            '.price-tag-fraction',
            '[data-testid="price"]'
          ];
          
          for (const selector of priceSelectors) {
            const priceElement = element.querySelector(selector);
            if (priceElement?.textContent) {
              const priceText = priceElement.textContent.replace(/\./g, '');
              price = parseInt(priceText) || 0;
              if (price > 0) break;
            }
          }
          
          // Try multiple selectors for URL
          let permalink = '';
          const linkSelectors = [
            '.ui-search-link',
            'a[href*="articulo"]',
            'a[href*="MLA"]',
            'h2 a'
          ];
          
          for (const selector of linkSelectors) {
            const linkElement = element.querySelector(selector);
            if (linkElement?.getAttribute('href')) {
              permalink = linkElement.getAttribute('href') || '';
              if (permalink) break;
            }
          }
          
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
    
    return products;
    
  } catch (error) {
    console.error('❌ Error scraping ML products:', error);
    
    // Return empty array - let calling code handle the failure case
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
