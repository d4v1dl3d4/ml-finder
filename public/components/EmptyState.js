import { h } from 'https://esm.sh/preact@10.23.1';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

export function EmptyState() {
  return html`
    <div class="empty-state">
      <h2>📭 No hay productos</h2>
      <p>No se encontraron productos analizados. Ejecuta el análisis de imágenes para ver resultados aquí.</p>
    </div>
  `;
}
