import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
const SaturnExperience = lazy(() => import('./components/saturn-experience'));
const view = new URLSearchParams(window.location.search).get('view');
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{view === 'saturn' || view === 'earth' || view === 'jupiter' || view === 'mars' || view === 'venus' ? <Suspense fallback={<p style={{padding:40}}>กำลังเปิดฉากตัวอย่าง…</p>}><SaturnExperience planetName={view}/></Suspense> : <App />}</React.StrictMode>);
