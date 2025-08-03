import { h } from 'https://esm.sh/preact@10.23.1';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

export function Footer() {
  return html`
    <footer class="footer">
      <p>Powered by Claude AI & Mercado Libre API</p>
    </footer>
  `;
}
