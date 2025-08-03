import { searchMLProducts } from '../src/index';

// Test the scraper with known data
async function testScraper() {
  const testData = {
    categoria: "cd",
    titulo: "Carmina Burana",
    autor: "Carl Orff"
  };

  console.log('🧪 Testing scraper with:', JSON.stringify(testData, null, 2));
  
  try {
    const results = await searchMLProducts(testData);
    console.log(`📊 Results found: ${results.length}`);
    
    if (results.length > 0) {
      console.log('\n📋 Products:');
      results.forEach((product, index) => {
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   💰 Price: $${product.price}`);
        console.log(`   🔗 URL: ${product.permalink}`);
        console.log('');
      });
    } else {
      console.log('❌ No products found - checking scraping logic...');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testScraper();
