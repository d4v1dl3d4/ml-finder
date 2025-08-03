import * as path from 'path';
import { config } from 'dotenv';
import { processProductImages } from './lib/processor';
import { processDropboxImages } from './lib/processor-dropbox';
import { initializePublicData } from './lib/storage';

// Load environment variables first, before any other modules
config();

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    console.log('🚀 Starting ML Product Finder...');
    
    // Initialize public data from existing products
    console.log('📋 Initializing public data...');
    initializePublicData();
    
    // Check if we should use Dropbox or local images
    const useDropbox = process.env.USE_DROPBOX === 'true' || process.argv.includes('--dropbox');
    
    if (useDropbox) {
      console.log('📦 Using Dropbox as image source');
      const dropboxFolder = process.env.DROPBOX_FOLDER || '';
      await processDropboxImages(dropboxFolder);
    } else {
      console.log('📁 Using local images');
      const imagesDir = path.join(process.cwd(), 'images');
      await processProductImages(imagesDir);
    }
    
    console.log('\n✅ Processing completed successfully!');
  } catch (error) {
    console.error('❌ Application error:', error);
    process.exit(1);
  }
}

// Run main function (no conditional needed since this is purely an entry point)
main();
