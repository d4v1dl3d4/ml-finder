import * as fs from 'fs';
import * as path from 'path';
import { analyzeProductImage, ProductData } from './analyzer';
import { searchMLProducts, MLSearchResult } from './scraper';
import { loadProductAnalyses, saveProductAnalysis, SavedProductAnalysis } from './storage';
import { DropboxService } from './dropbox';

/**
 * Process product images from Dropbox
 */
export async function processDropboxImages(dropboxFolder: string = ''): Promise<void> {
  const tempDir = './temp-images';
  let dropboxService: DropboxService;

  try {
    console.log('🚀 Starting Dropbox image processing...');
    
    // Initialize Dropbox service
    dropboxService = new DropboxService();
    
    // Download all images organized by folders
    const organizedImages = await dropboxService.downloadAllImages(tempDir, dropboxFolder);
    
    if (Object.keys(organizedImages).length === 0) {
      console.log('No image folders found in Dropbox');
      return;
    }

    console.log(`Found ${Object.keys(organizedImages).length} product folders`);

    for (const [folderName, imagePaths] of Object.entries(organizedImages)) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📂 Processing product: ${folderName}`);
      
      if (imagePaths.length === 0) {
        console.log(`No images found in ${folderName}`);
        continue;
      }

      // Use the first image for analysis
      const firstImage = imagePaths[0];
      console.log(`📸 Analyzing image: ${path.basename(firstImage)}`);
      
      // Convert to relative path for storage
      const relativePath = path.relative(process.cwd(), firstImage);
      
      // Check if this image was already analyzed
      const existingAnalyses = loadProductAnalyses();
      const existingAnalysis = existingAnalyses.find(a => 
        a.imagePath === relativePath || 
        a.imagePath.includes(path.basename(firstImage))
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
        
        // Create analysis object for saving (use a more permanent relative path)
        const permanentPath = `dropbox/${folderName}/${path.basename(firstImage)}`;
        const analysis: SavedProductAnalysis = {
          imagePath: permanentPath,
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
    console.error('Error processing Dropbox images:', error);
    throw error;
  } finally {
    // Clean up temporary files
    if (dropboxService!) {
      dropboxService.cleanupTempImages(tempDir);
    }
  }
}

/**
 * Process all product images in a local directory (original function)
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
