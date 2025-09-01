#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import * as https from 'https';
import * as path from 'path';
import * as fs from 'fs';

// Configure dotenv to load from the parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

interface MercadoLibreItem {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  condition: string;
  thumbnail: string;
  permalink: string;
  seller: {
    id: number;
    nickname: string;
  };
  shipping: {
    free_shipping: boolean;
  };
  // Add more fields as needed
}

interface MercadoLibreSearchResponse {
  site_id: string;
  query: string;
  paging: {
    total: number;
    offset: number;
    limit: number;
    primary_results: number;
  };
  results: MercadoLibreItem[];
  // Add more fields as needed
}

interface SearchResultsFile {
  search_results: Array<{
    timestamp: string;
    query: string;
    site_id: string;
    total_results: number;
    results_count: number;
    products: MercadoLibreItem[];
  }>;
}

class MercadoLibreApiClient {
  private accessToken: string;
  private dataDir: string;
  private searchResultsFile: string;

  constructor() {
    const token = process.env.ML_ACCESS_TOKEN;
    
    if (!token) {
      console.error('Error: ML_ACCESS_TOKEN is not set in .env file');
      process.exit(1);
    }
    
    this.accessToken = token;
    this.dataDir = path.join(__dirname, '../data');
    this.searchResultsFile = path.join(this.dataDir, 'search-results.json');
    
    // Ensure data directory exists
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadSearchResults(): SearchResultsFile {
    if (!fs.existsSync(this.searchResultsFile)) {
      return { search_results: [] };
    }
    
    try {
      const content = fs.readFileSync(this.searchResultsFile, 'utf8');
      return JSON.parse(content) as SearchResultsFile;
    } catch (error) {
      console.warn('Error reading search results file, starting with empty array');
      return { search_results: [] };
    }
  }

  private saveSearchResults(data: SearchResultsFile): void {
    try {
      fs.writeFileSync(this.searchResultsFile, JSON.stringify(data, null, 2));
      console.log(`Results saved to: ${this.searchResultsFile}`);
    } catch (error) {
      console.error('Error saving search results:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  storeSearchResults(response: MercadoLibreSearchResponse, query: string, siteId: string): void {
    const searchData = this.loadSearchResults();
    
    const newResult = {
      timestamp: new Date().toISOString(),
      query,
      site_id: siteId,
      total_results: response.paging.total,
      results_count: response.results.length,
      products: response.results
    };
    
    searchData.search_results.push(newResult);
    this.saveSearchResults(searchData);
  }

  async searchProducts(query: string, siteId: string = 'MLA'): Promise<MercadoLibreSearchResponse> {
    return new Promise((resolve, reject) => {
      const url = `https://api.mercadolibre.com/sites/${siteId}/search?q=${encodeURIComponent(query)}&limit=5`;
      
      const options: https.RequestOptions = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ML-Finder/1.0.0'
        }
      };
      
      const req = https.request(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        
        res.on('end', () => {
          try {
            const jsonData: MercadoLibreSearchResponse = JSON.parse(data);
            // Ensure we only return first 5 results
            jsonData.results = jsonData.results.slice(0, 5);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Error parsing JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        });
      });
      
      req.on('error', (error: Error) => {
        reject(new Error(`Request error: ${error.message}`));
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  async searchAndDisplay(query: string = 'iphone', siteId: string = 'MLA'): Promise<void> {
    try {
      console.log(`Making request to MercadoLibre API for query: "${query}" in site: ${siteId}...`);
      
      const response = await this.searchProducts(query, siteId);
      
      // Store results in JSON file
      this.storeSearchResults(response, query, siteId);
      
      console.log('\n=== Product Names and Prices ===');
      console.log(`Total results: ${response.paging.total}`);
      console.log(`Showing: ${response.results.length} products\n`);
      
      response.results.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   Price: ${item.currency_id} ${item.price.toLocaleString()}\n`);
      });
      
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }
}

// Main execution
async function main(): Promise<void> {
  const client = new MercadoLibreApiClient();
  
  // Get query from command line arguments or use default
  const query = process.argv[2] || 'iphone';
  const siteId = process.argv[3] || 'MLA';
  
  await client.searchAndDisplay(query, siteId);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { MercadoLibreApiClient, MercadoLibreItem, MercadoLibreSearchResponse, SearchResultsFile };
