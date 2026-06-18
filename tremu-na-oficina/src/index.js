/* ============================================================
   index.js
   ------------------------------------------------------------
   Ponto de entrada da aplicação React: encontra o elemento
   <div id="root"> no public/index.html e "monta" o componente
   <App /> dentro dele. Não precisa de alterações normalmente.
   ============================================================ */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
