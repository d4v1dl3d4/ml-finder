# Mercado Libre Product Finder

A TypeScript Node.js application that analyzes product images using Claude AI and searches for matching or similar products on Mercado Libre.

## Features

- 📸 **Image Analysis**: Uses Claude AI to extract product information from images
- 🔍 **ML Search**: Searches Mercado Libre for exact or similar products
- 🏷️ **Product Categories**: Supports books, music CDs, apparel, electronics, and more
- 📊 **Smart Matching**: Uses ISBN, product codes, or title/author for accurate matching
- ☁️ **Dropbox Integration**: Process images directly from your Dropbox folder

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment**:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```
   # Required
   CLAUDE_API_KEY=your_claude_api_key
   
   # Optional: Dropbox integration
   DROPBOX_ACCESS_TOKEN=your_dropbox_access_token
   DROPBOX_FOLDER=/ML-IMAGES
   USE_DROPBOX=false
   ```

3. **Add product images**:

   **Option A: Local images**
   Place product images in the `images/` directory, organized by product:
   ```
   images/
   ├── product-1/
   │   ├── IMG_2905.jpeg
   │   └── IMG_2906.jpeg
   └── product-2/
       ├── photo1.jpg
       └── photo2.jpg
   ```

   **Option B: Dropbox images**
   Upload images to your Dropbox folder and enable Dropbox mode (see usage below)

## Usage

**Local images (default)**:
```bash
pnpm run dev
```

**Dropbox images**:
```bash
pnpm run dev -- --dropbox
# or set USE_DROPBOX=true in .env
```

**Production build**:
```bash
pnpm run build
pnpm start
```

## Dropbox Setup

To use Dropbox integration:

1. **Create a Dropbox App**:
   - Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
   - Create a new app with "Scoped access"
   - Choose "Full Dropbox" or "App folder"
   - Give your app a name

2. **Configure Permissions**:
   - In the "Permissions" tab, enable:
     - `files.metadata.read` (required for listing files)
     - `files.content.read` (required for downloading files)
   - Click "Submit" to save permissions

3. **Generate Access Token**:
   - Go to "Settings" tab
   - Scroll to "OAuth 2" section
   - Click "Generate" to create an access token
   - Copy the token to your `.env` file as `DROPBOX_ACCESS_TOKEN`

4. **Upload Images**:
   - Create a folder in your Dropbox (e.g., `/ML-IMAGES`)
   - Upload product images to this folder
   - Set `DROPBOX_FOLDER=/ML-IMAGES` in your `.env` file

## How it works

1. **Image Analysis**: The app processes each product directory and analyzes the first image using Claude AI
2. **Data Extraction**: Extracts product information like category, title, author, ISBN, brand, etc.
3. **ML Search**: Searches Mercado Libre using the extracted data (prioritizing ISBN/product codes)
4. **Results**: Returns up to 5 matching products with URLs, prices, and conditions

## Example Output

```
🔍 Processing product: product-1
==================================================
📸 Analyzing image: IMG_2905.jpeg
📋 Product data extracted:
{
  "category": "book",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "9780743273565"
}

🔎 Searching Mercado Libre...
✅ Found 3 product(s):

1. The Great Gatsby - F. Scott Fitzgerald
   💰 Price: $2500
   🔗 URL: https://articulo.mercadolibre.com.ar/MLA-123456
   📦 Condition: new
```

## Dependencies

- **@anthropic-ai/sdk**: Claude AI integration
- **dotenv**: Environment variable management
- **dropbox**: Dropbox API integration
- **node-fetch@2.6.7**: HTTP client (v2 required for Dropbox SDK compatibility)
- **puppeteer**: Web scraping for Mercado Libre
- **typescript**: TypeScript support
- **ts-node**: Development execution

### Important Note: node-fetch Version

This project requires **node-fetch v2.6.7** for compatibility with the Dropbox SDK. The newer v3 of node-fetch causes deprecation warnings and compatibility issues with the Dropbox SDK's internal response handling. If you encounter issues with Dropbox integration, ensure you're using the correct version:

```bash
pnpm add node-fetch@2.6.7 @types/node-fetch@2.6.11
```