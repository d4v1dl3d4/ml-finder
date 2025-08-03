import { h } from 'https://esm.sh/preact@10.23.1';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

export function LoadingSpinner({ message = "Cargando..." }) {
  return html`
    <div class="loading">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
}
