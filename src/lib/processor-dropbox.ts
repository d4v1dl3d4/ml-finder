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
    
    // Get list of images from Dropbox without downloading
    console.log('📋 Getting list of images from Dropbox...');
    const dropboxImages = await dropboxService.listImages(dropboxFolder);
    
    if (dropboxImages.length === 0) {
      console.log('No images found in Dropbox');
      return;
    }
    
    console.log(`📸 Found ${dropboxImages.length} images in Dropbox`);
    
    // Load existing analyses to check what we already have
    const existingAnalyses = loadProductAnalyses();
    
    // Filter out images that are already processed
    const imagesToProcess = dropboxImages.filter(image => {
      const imageFileName = image.name;
      const expectedImagePath = `images/${image.localPath.split('/')[0]}/${imageFileName}`;
      
      const alreadyProcessed = existingAnalyses.some(analysis => 
        analysis.imagePath.includes(imageFileName) ||
        analysis.imagePath === expectedImagePath
      );
      
      if (alreadyProcessed) {
        console.log(`⏭️  Skipping already processed image: ${imageFileName}`);
        return false;
      }
      
      return true;
    });
    
    if (imagesToProcess.length === 0) {
      console.log('✅ All Dropbox images have already been processed');
      return;
    }
    
    console.log(`🔄 Processing ${imagesToProcess.length} new images (${dropboxImages.length - imagesToProcess.length} already processed)`);
    
    // Download and process only the new images
    const organizedImages = await dropboxService.downloadSelectedImages(tempDir, imagesToProcess);
    
    if (Object.keys(organizedImages).length === 0) {
      console.log('No new image folders to process');
      return;
    }

    console.log(`Found ${Object.keys(organizedImages).length} product folders`);

    for (const [folderName, imagePaths] of Object.entries(organizedImages)) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📂 Processing product: ${folderName}`);
      
      if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
        console.log(`No images found in ${folderName}`);
        continue;
      }

      console.log(`📸 Found ${imagePaths.length} images in folder: ${imagePaths.map((p: string) => path.basename(p)).join(', ')}`);

      // Process each image in the folder
      for (let i = 0; i < imagePaths.length; i++) {
        const currentImage = imagePaths[i];
        const imageNumber = imagePaths.length > 1 ? ` (${i + 1}/${imagePaths.length})` : '';
        
        console.log(`\n📸 Analyzing image: ${path.basename(currentImage)}${imageNumber}`);
        
        // Copy the resized image to public folder for frontend access
        const publicImageDir = path.join(process.cwd(), 'public', 'images', folderName);
        if (!fs.existsSync(publicImageDir)) {
          fs.mkdirSync(publicImageDir, { recursive: true });
        }
        
        const imageFileName = path.basename(currentImage);
        const publicImagePath = path.join(publicImageDir, imageFileName);
        fs.copyFileSync(currentImage, publicImagePath);
        console.log(`📁 Copied resized image to public folder: images/${folderName}/${imageFileName}`);
        
        // Use public image path for storage
        const relativeImagePath = `images/${folderName}/${imageFileName}`;
        
        // Convert to relative path for storage
        const relativePath = path.relative(process.cwd(), currentImage);
        
        // Check if this image was already analyzed
        const existingAnalyses = loadProductAnalyses();
        const existingAnalysis = existingAnalyses.find(a => 
          a.imagePath === relativePath || 
          a.imagePath === relativeImagePath ||
          a.imagePath.includes(path.basename(currentImage))
        );
        
        let productData: ProductData;
        let mlResults: MLSearchResult[];
        
        if (existingAnalysis) {
          console.log('♻️  Found existing analysis, using cached data');
          productData = existingAnalysis.productData;
          mlResults = existingAnalysis.mlResults || [];
        } else {
          // Analyze the product
          productData = await analyzeProductImage(currentImage);
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
      }
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
