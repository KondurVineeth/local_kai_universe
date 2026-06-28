import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Design tokens live inline in src/index.html (populated by `npm run tokens:build`).
// They load before any JS runs — the only path that survived this Electron+Vite setup.
import './index.css';

import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
