import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
const SaturnExperience = lazy(() => import('./components/saturn-experience'));
const sample = new URLSearchParams(window.location.search).get('view') === 'saturn';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{sample ? <Suspense fallback={<p style={{padding:40}}>กำลังเปิดฉากตัวอย่าง…</p>}><SaturnExperience/></Suspense> : <App />}</React.StrictMode>);
