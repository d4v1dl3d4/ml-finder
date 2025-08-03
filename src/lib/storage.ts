import * as fs from 'fs';
import * as path from 'path';
import { ProductData } from './analyzer';
import { MLSearchResult } from './scraper';

export interface SavedProductAnalysis {
  imagePath: string;
  productData: any;
  timestamp: string;
  mlResults?: any[];
}

const PRODUCTS_FILE = 'products.json';
const PUBLIC_PRODUCTS_FILE = 'public/data/products.json';

/**
 * Load all product analyses from file
 */
export function loadProductAnalyses(): SavedProductAnalysis[] {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) {
      return [];
    }
    
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading product analyses:', error);
    return [];
  }
}

/**
 * Save a new product analysis
 */
export function saveProductAnalysis(analysis: SavedProductAnalysis): void {
  try {
    const analyses = loadProductAnalyses();
    
    // Remove any existing analysis for the same image path
    const filtered = analyses.filter(a => a.imagePath !== analysis.imagePath);
    
    // Add the new analysis
    filtered.push(analysis);
    
    // Save to JSON file
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(filtered, null, 2));
    
    // Also copy to public directory for frontend access
    copyProductsToPublic(filtered);
    
    console.log(`💾 Saved analysis for: ${analysis.imagePath}`);
  } catch (error) {
    console.error('Error saving product analysis:', error);
    throw error;
  }
}

/**
 * Copy products JSON to public directory for frontend access
 */
function copyProductsToPublic(products: SavedProductAnalysis[]): void {
  try {
    // Ensure public/data directory exists
    const publicDir = path.dirname(PUBLIC_PRODUCTS_FILE);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Create the data object to save
    const publicData = {
      products,
      lastUpdated: new Date().toISOString(),
      productCount: products.length
    };
    
    fs.writeFileSync(PUBLIC_PRODUCTS_FILE, JSON.stringify(publicData, null, 2));
    console.log(`📦 Copied products.json to public/data with ${products.length} products`);
  } catch (error) {
    console.error('Error copying products to public directory:', error);
  }
}

/**
 * Initialize public data from existing products.json
 */
export function initializePublicData(): void {
  const products = loadProductAnalyses();
  copyProductsToPublic(products);
}
