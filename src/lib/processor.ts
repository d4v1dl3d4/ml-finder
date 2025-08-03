import * as fs from 'fs';
import * as path from 'path';
import { analyzeProductImage, ProductData } from './analyzer';
import { searchMLProducts, MLSearchResult } from './scraper';
import { loadProductAnalyses, saveProductAnalysis, SavedProductAnalysis } from './storage';
import { ImageProcessor } from './image-processor';

/**
 * Process product images from local directory
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
    
    // Load existing analyses to check what we already have
    const existingAnalyses = loadProductAnalyses();

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
      const firstImageFile = imageFiles[0];
      const firstImage = path.join(productPath, firstImageFile);
      
      // Check if this image is already processed
      const expectedImagePath = `images/${productDir}/${firstImageFile}`;
      const alreadyProcessed = existingAnalyses.some(analysis => 
        analysis.imagePath === expectedImagePath ||
        analysis.imagePath.includes(firstImageFile)
      );
      
      if (alreadyProcessed) {
        console.log(`⏭️  Skipping already processed image: ${firstImageFile}`);
        continue;
      }
      
      console.log(`📸 Analyzing new image: ${firstImageFile}`);
      
      // Resize image if needed and copy to public folder
      const publicImageDir = path.join(process.cwd(), 'public', 'images', productDir);
      if (!fs.existsSync(publicImageDir)) {
        fs.mkdirSync(publicImageDir, { recursive: true });
      }
      
      const publicImagePath = path.join(publicImageDir, firstImageFile);
      const needsResize = await ImageProcessor.needsResizing(firstImage);
      
      if (needsResize) {
        console.log('🖼️  Resizing and copying image to public folder...');
        await ImageProcessor.resizeImage(firstImage, publicImagePath);
      } else {
        // Just copy the image if no resize needed
        fs.copyFileSync(firstImage, publicImagePath);
        console.log('📁 Copied image to public folder');
      }
      
      // Use relative path from public folder for storage
      const relativeImagePath = `images/${productDir}/${firstImageFile}`;
      
      // Check if this image was already analyzed (we already checked above, but double-check for other paths)
      const relativePath = path.relative(process.cwd(), firstImage);
      const existingAnalysis = existingAnalyses.find(a => 
        a.imagePath === relativePath || 
        a.imagePath === relativeImagePath
      );
      
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
        
        // Create analysis object for saving (use public image path)
        const analysis: SavedProductAnalysis = {
          imagePath: relativeImagePath,
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
