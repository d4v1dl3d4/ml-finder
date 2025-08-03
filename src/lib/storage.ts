import * as fs from 'fs';
import * as path from 'path';
import { ProductData } from './analyzer';
import { MLSearchResult } from './scraper';

// Interface for saved product analysis
export interface SavedProductAnalysis {
  imagePath: string;
  productData: ProductData;
  timestamp: string;
  mlResults?: MLSearchResult[];
}

/**
 * Load existing product analyses from products.json
 */
export function loadProductAnalyses(): SavedProductAnalysis[] {
  const productsFile = path.join(process.cwd(), 'data', 'products.json');
  try {
    if (fs.existsSync(productsFile)) {
      const data = fs.readFileSync(productsFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('⚠️  Could not load existing products.json:', error);
  }
  return [];
}

/**
 * Save product analysis to products.json
 */
export function saveProductAnalysis(analysis: SavedProductAnalysis): void {
  const productsFile = path.join(process.cwd(), 'data', 'products.json');
  try {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const existingAnalyses = loadProductAnalyses();
    
    // Check if this image was already analyzed
    const existingIndex = existingAnalyses.findIndex(a => a.imagePath === analysis.imagePath);
    
    if (existingIndex >= 0) {
      // Update existing analysis
      existingAnalyses[existingIndex] = analysis;
      console.log('🔄 Updated existing analysis in data/products.json');
    } else {
      // Add new analysis
      existingAnalyses.push(analysis);
      console.log('💾 Saved new analysis to data/products.json');
    }
    
    fs.writeFileSync(productsFile, JSON.stringify(existingAnalyses, null, 2));
  } catch (error) {
    console.error('❌ Could not save to data/products.json:', error);
  }
}
