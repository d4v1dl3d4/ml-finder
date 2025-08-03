import { h } from 'https://esm.sh/preact@10.23.1';
import htm from 'https://esm.sh/htm';
import { LoadingSpinner } from './LoadingSpinner.js';
import { EmptyState } from './EmptyState.js';
import { ProductGrid } from './ProductGrid.js';

const html = htm.bind(h);

export function MainContent({ loading, products }) {
  if (loading && products.length > 0) {
    return html`<${LoadingSpinner} message="Actualizando productos..." />`;
  }
  
  if (products.length === 0) {
    return html`<${EmptyState} />`;
  }
  
  return html`<${ProductGrid} products=${products} />`;
}
