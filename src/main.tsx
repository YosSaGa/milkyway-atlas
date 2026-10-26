import SceneLoading from './components/scene-loading';
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
const App = lazy(() => import('./App'));
const GalaxyHub = lazy(() => import('./components/galaxy-hub'));
import './index.css';
const SaturnExperience = lazy(() => import('./components/saturn-experience'));
const view = new URLSearchParams(window.location.search).get('view');
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{view === 'saturn' || view === 'earth' || view === 'jupiter' || view === 'mars' || view === 'venus' || view === 'mercury' || view === 'uranus' || view === 'neptune' ? <Suspense fallback={<SceneLoading/>}><SaturnExperience planetName={view}/></Suspense> : <Suspense fallback={<SceneLoading/>}>{view === 'about' ? <App /> : <GalaxyHub />}</Suspense>}</React.StrictMode>);
