import { h } from 'https://esm.sh/preact@10.23.1';
import { useState } from 'https://esm.sh/preact@10.23.1/hooks';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

export function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);

  const { productData, mlResults = [], timestamp, imagePath } = product;
  
  // Get image filename for display
  const imageFileName = imagePath.split('/').pop() || 'Unknown';
  
  // Format timestamp
  const formattedDate = new Date(timestamp).toLocaleString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Get image path for static serving
  const getImagePath = () => {
    // All images are now stored in public/images/ regardless of source
    if (imagePath.startsWith('images/')) {
      return imagePath; // Already has the correct public path
    }
    return null; // Fallback for any edge cases
  };

  const imageSrc = getImagePath();
  const visibleResults = showAllResults ? mlResults : mlResults.slice(0, 3);

  return html`
    <div class="product-card">
      <div class="card-header">
        <div class="image-section">
          ${imageSrc && !imageError 
            ? html`
              <img 
                src=${imageSrc} 
                alt="Producto analizado"
                class="product-image"
                onError=${() => setImageError(true)}
              />
            `
            : html`
              <div class="image-placeholder">
                <span class="image-icon">📸</span>
                <p class="image-name">${imageFileName}</p>
              </div>
            `
          }
        </div>
        
        <div class="product-info">
          <h3 class="product-title">${productData.title || 'Producto sin título'}</h3>
          
          <div class="product-details">
            <div class="detail-item">
              <span class="label">📂 Categoría:</span>
              <span class="value">${productData.category || 'No especificada'}</span>
            </div>
            
            ${productData.author && html`
              <div class="detail-item">
                <span class="label">👤 Autor:</span>
                <span class="value">${productData.author}</span>
              </div>
            `}
            
            ${productData.isbn && html`
              <div class="detail-item">
                <span class="label">📚 ISBN:</span>
                <span class="value">${productData.isbn}</span>
              </div>
            `}
            
            ${productData.productCode && html`
              <div class="detail-item">
                <span class="label">🏷️ Código:</span>
                <span class="value">${productData.productCode}</span>
              </div>
            `}
            
            <div class="detail-item">
              <span class="label">⏰ Analizado:</span>
              <span class="value">${formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="results-section">
        <h4 class="results-title">
          🛒 Resultados en Mercado Libre (${mlResults.length})
        </h4>
        
        ${mlResults.length === 0 
          ? html`
            <div class="no-results">
              <p>❌ No se encontraron productos similares</p>
            </div>
          `
          : html`
            <div class="results-list">
              ${visibleResults.map((result, index) => html`
                <div key=${index} class="result-item">
                  <div class="result-info">
                    <h5 class="result-title">${result.title}</h5>
                    <div class="result-details">
                      <span class="price">💰 $${result.price}</span>
                      <span class="condition">📦 ${result.condition}</span>
                    </div>
                  </div>
                  <a 
                    href=${result.permalink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="ml-link"
                  >
                    Ver en Mercado Libre
                  </a>
                </div>
              `)}
              
              ${mlResults.length > 3 && html`
                <button 
                  class="toggle-results-btn"
                  onClick=${() => setShowAllResults(!showAllResults)}
                >
                  ${showAllResults 
                    ? `Mostrar menos ▲` 
                    : `Ver todos (${mlResults.length - 3} más) ▼`
                  }
                </button>
              `}
            </div>
          `
        }
      </div>
    </div>
  `;
}
