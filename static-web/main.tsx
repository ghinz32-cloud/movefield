import React from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import {AppPreferencesProvider,AppearanceShortcut} from '../components/app-preferences';
import {OfflineSupport} from '../components/offline-support';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><AppPreferencesProvider><Home/><AppearanceShortcut/></AppPreferencesProvider><OfflineSupport/></React.StrictMode>);
