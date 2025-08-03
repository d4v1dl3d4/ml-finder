import { h } from 'https://esm.sh/preact@10.23.1';
import { useState, useEffect } from 'https://esm.sh/preact@10.23.1/hooks';
import htm from 'https://esm.sh/htm';
import { Header } from './Header.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { ErrorMessage } from './ErrorMessage.js';
import { MainContent } from './MainContent.js';
import { Footer } from './Footer.js';

const html = htm.bind(h);

export function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      
      // Add delay to see loading spinner
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch the products JSON with cache busting
      const timestamp = Date.now();
      const response = await fetch(`./data/products.json?t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const newProducts = data.products || [];
      const dataLastUpdated = data.lastUpdated;
      
      setProducts(newProducts);
      setLastUpdated(new Date(dataLastUpdated));
      setError(null);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading && products.length === 0) {
    return html`
      <div class="app">
        <${Header} 
          products=${products} 
          loading=${loading} 
          lastUpdated=${lastUpdated} 
          onRefresh=${loadProducts}
          error=${null}
        />
        <${LoadingSpinner} message="Cargando productos..." />
      </div>
    `;
  }

  if (error) {
    return html`
      <div class="app">
        <${Header} 
          products=${products} 
          loading=${loading} 
          lastUpdated=${lastUpdated} 
          onRefresh=${loadProducts}
          error=${error}
        />
        <${ErrorMessage} error=${error} />
      </div>
    `;
  }

  return html`
    <div class="app">
      <${Header} 
        products=${products} 
        loading=${loading} 
        lastUpdated=${lastUpdated} 
        onRefresh=${loadProducts}
        error=${null}
      />
      
      <main class="main">
        <${MainContent} loading=${loading} products=${products} />
      </main>
      
      <${Footer} />
    </div>
  `;
}
