import { h } from 'https://esm.sh/preact@10.23.1';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

export function Header({ products, loading, lastUpdated, onRefresh, error }) {
  const getStatsContent = () => {
    if (error) {
      return html`
        <span class="stat">❌ Error al cargar</span>
        <button onClick=${onRefresh} class="retry-btn">
          Intentar de nuevo
        </button>
      `;
    }
    
    if (loading && products.length === 0) {
      return html`<span class="stat">📦 Cargando productos...</span>`;
    }
    
    return html`
      <span class="stat">📦 ${products.length} productos analizados</span>
      <button onClick=${onRefresh} class="refresh-btn" disabled=${loading}>
        ${loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
      </button>
      ${lastUpdated && html`
        <span class="stat last-updated">
          ⏰ Última actualización: ${lastUpdated.toLocaleTimeString('es-AR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })}
        </span>
      `}
    `;
  };

  return html`
    <header class="header">
      <h1>🔍 ML Product Finder</h1>
      <p>Análisis de productos con IA y búsqueda en Mercado Libre</p>
      <div class="stats">
        ${getStatsContent()}
      </div>
    </header>
  `;
}
