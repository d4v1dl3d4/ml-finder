// Main application entry point
import { render, h } from 'https://esm.sh/preact@10.23.1';
import htm from 'https://esm.sh/htm';
import { App } from './components/App.js';

// Initialize htm with Preact
const html = htm.bind(h);

// Render the app
render(html`<${App} />`, document.getElementById('app'));
