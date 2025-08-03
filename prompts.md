# Mercado Libre Product Finder App

This Node.js app uses the Claude API to analyze product images (provided in the images dir) and obtain basic data about a product: category (book, music CD, apparel, etc), title, author, ISBN (if it's a book), product code (if not a book).

Then this data is used to look for the same or similar products in Mercado Libre using the ML API.

The app finally returns the URL of the product in Mercado Libre, or several URLs (up to 5) of similar products if the exact same product is not found.

It should be written in Typescript.

