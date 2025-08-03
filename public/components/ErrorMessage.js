import { h } from 'https://esm.sh/preact@10.23.1';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

export function ErrorMessage({ error }) {
  return html`
    <div class="error">
      <h2>❌ Error</h2>
      <p>No se pudieron cargar los productos: ${error}</p>
    </div>
  `;
}
