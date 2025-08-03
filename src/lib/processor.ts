import * as fs from 'fs';
import * as path from 'path';
import { analyzeProductImage, ProductData } from './analyzer';
import { searchMLProducts, MLSearchResult } from './scraper';
import { loadProductAnalyses, saveProductAnalysis, SavedProductAnalysis } from './storage';

/**
 * Process all product images in a directory
 */
export async function processProductImages(imagesDir: string): Promise<void> {
  try {
    console.log(`🔍 Processing images in: ${imagesDir}`);
    
    if (!fs.existsSync(imagesDir)) {
      throw new Error(`Images directory not found: ${imagesDir}`);
    }

    const productDirs = fs.readdirSync(imagesDir)
      .filter(item => fs.statSync(path.join(imagesDir, item)).isDirectory());

    if (productDirs.length === 0) {
      console.log('No product directories found');
      return;
    }

    console.log(`Found ${productDirs.length} product directories`);

    for (const productDir of productDirs) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📂 Processing product: ${productDir}`);
      
      const productPath = path.join(imagesDir, productDir);
      const imageFiles = fs.readdirSync(productPath)
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file));
      
      if (imageFiles.length === 0) {
        console.log(`No images found in ${productDir}`);
        continue;
      }

      // Use the first image for analysis
      const firstImage = path.join(productPath, imageFiles[0]);
      console.log(`📸 Analyzing image: ${imageFiles[0]}`);
      
      // Check if this image was already analyzed
      const existingAnalyses = loadProductAnalyses();
      const relativePath = path.relative(process.cwd(), firstImage);
      const existingAnalysis = existingAnalyses.find(a => a.imagePath === relativePath);
      
      let productData: ProductData;
      let mlResults: MLSearchResult[];
      
      if (existingAnalysis) {
        console.log('♻️  Found existing analysis, using cached data');
        productData = existingAnalysis.productData;
        mlResults = existingAnalysis.mlResults || [];
      } else {
        // Analyze the product
        productData = await analyzeProductImage(firstImage);
        console.log('📋 Product data extracted:');
        console.log(JSON.stringify(productData, null, 2));
        
        // Search for products in Mercado Libre
        console.log('\n🔎 Searching Mercado Libre...');
        mlResults = await searchMLProducts(productData);
        
        // Create analysis object for saving (use relative path)
        const relativePath = path.relative(process.cwd(), firstImage);
        const analysis: SavedProductAnalysis = {
          imagePath: relativePath,
          productData,
          timestamp: new Date().toISOString(),
          mlResults
        };
        
        // Save the analysis to products.json
        saveProductAnalysis(analysis);
      }
      
      if (mlResults.length === 0) {
        console.log('❌ No products found in Mercado Libre');
      } else {
        console.log(`✅ Found ${mlResults.length} product(s):`);
        mlResults.forEach((product, index) => {
          console.log(`\n${index + 1}. ${product.title}`);
          console.log(`   💰 Price: $${product.price}`);
          console.log(`   🔗 URL: ${product.permalink}`);
          console.log(`   📦 Condition: ${product.condition}`);
        });
      }
      
      console.log('\n' + '='.repeat(50));
    }
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
}
