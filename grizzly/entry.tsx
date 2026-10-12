import React from 'react';
import {createRoot} from 'react-dom/client';
import App from '../app/page';
import {AppPreferencesProvider} from '../components/app-preferences';
import '../app/globals.css';
import './grizzly.css';
import {GrizzlyMark} from './grizzly-mark';
import {GrizzlyCustomize} from './customize';
createRoot(document.getElementById('root')!).render(<AppPreferencesProvider><div className="grizzly-preview-banner"><span className="grizzly-preview-title"><GrizzlyMark/><span><b>Grizzly Fitness · Wautoma</b><small>Design prototype</small></span></span><GrizzlyCustomize/></div><App/></AppPreferencesProvider>);
