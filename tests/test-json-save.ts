import { processProductImages } from '../src/index';
import path from 'path';

// Test the image processing with JSON saving
async function testImageProcessing() {
  try {
    console.log('🧪 Testing image processing with JSON saving...');
    const imagesDir = path.join(process.cwd(), 'images');
    await processProductImages(imagesDir);
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImageProcessing();
