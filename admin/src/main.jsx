import { StrictMode } from 'react';
import { createRoot }  from 'react-dom/client';
import App from './App.jsx';

import './styles/global.css';
import './styles/editor.css';
import './styles/nodes.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
