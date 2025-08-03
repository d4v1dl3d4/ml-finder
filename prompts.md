# Mercado Libre Product Finder App

This Node.js app uses the Claude API to analyze product images (provided in the images dir) and obtain basic data about a product: category (book, music CD, apparel, etc), title, author, ISBN (if it's a book), product code (if not a book).

Then this data is used to look for the same or similar products in Mercado Libre using the ML API.

The app finally returns the URL of the product in Mercado Libre, or several URLs (up to 5) of similar products if the exact same product is not found.

It should be written in Typescript.


## Preact Frontend

Create a Preact frontend using Preact's CDN version (no build):

```js
// Main application entry point
import { render, h } from 'https://esm.sh/preact@10.23.1';
import htm from 'https://esm.sh/htm';
import { App } from './components/App.js';

// Initialize htm with Preact
const html = htm.bind(h);

// Render the app
render(html`<${App} />`, document.getElementById('app'));
```

The frontend should show the products in products.json in cards, one for each product. All properties should be shown except the ID of the product, showing the thumbnail as an image, not a URL string.

The display text for the permaLinks should be 'Ver en Mercado Libre'.

## ML Product Listings App:

1. Check for images in /ML-IMAGES in Dropbox using the Dropbox API (or listen to webhook from Dropbox informing a new item has been added to this dir).

2. Resize images to 720px (larger dimension) using Sharp and store them in data/images/ dir.

3. Send images to Claude to analyze and return basic data about the product.

4. Scrape Amazon for further details and specs of the product.

5. Publish product listing to Mercado Libre using the resized images.

