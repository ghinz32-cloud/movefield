import React from 'react';
import {createRoot} from 'react-dom/client';
import App from '../app/page';
import {AppPreferencesProvider} from '../components/app-preferences';
import '../app/globals.css';
import './grizzly.css';
import {GrizzlyMark} from './grizzly-mark';
createRoot(document.getElementById('root')!).render(<AppPreferencesProvider><div className="grizzly-preview-banner"><span className="grizzly-preview-title"><GrizzlyMark/><span><b>Grizzly Fitness · Wautoma</b><small>Design prototype</small></span></span><details><summary>About this version</summary><div><p>Separate profile. Shared training features. The bear mark and colors are provisional while the gym’s official logo is being retrieved.</p><a href="https://www.fitnessgrizzly.com/" target="_blank" rel="noopener noreferrer">Visit the gym website</a><a href="/movefield/review/">Open Movefield</a></div></details></div><App/></AppPreferencesProvider>);
