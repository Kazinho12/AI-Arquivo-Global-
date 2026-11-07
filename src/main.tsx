import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Em desenvolvimento, carrega a utilidade de teste da API na consola global sem pedidos automáticos
if (import.meta.env.DEV) {
  import('./lib/api');
}

createRoot(document.getElementById('root')!).render(<App />);
