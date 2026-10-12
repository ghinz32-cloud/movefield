import React from 'react';
import {createRoot} from 'react-dom/client';
import App from '../app/page';
import {AppPreferencesProvider} from '../components/app-preferences';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<AppPreferencesProvider><div className="review-build-banner"><b>Latest additions · review build</b><span>Explore sample training or create a separate review profile.</span><a href="/movefield/">Open current app</a></div><App/></AppPreferencesProvider>);
