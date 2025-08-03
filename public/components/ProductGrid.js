import { h } from 'https://esm.sh/preact@10.23.1';
import htm from 'https://esm.sh/htm';
import { ProductCard } from './ProductCard.js';

const html = htm.bind(h);

export function ProductGrid({ products }) {
  return html`
    <div class="products-grid">
      ${products.map(product => html`
        <${ProductCard} 
          key=${product.imagePath} 
          product=${product} 
        />
      `)}
    </div>
  `;
}
