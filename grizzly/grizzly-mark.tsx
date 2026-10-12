import {publicPath} from '../lib/public-path';
/** Display the uploaded JPEG directly; no redrawing or recoloring of its artwork. */
export function GrizzlyMark({className}: {className?:string}) {
 return <span className={'grizzly-logo-frame '+(className||'')} aria-hidden="true"><img src={publicPath('/brand/grizzly-fitness-logo.jpg')} width="1280" height="593" alt="" className="grizzly-logo-image"/></span>;
}

/** Five long talons and cut, irregular pads; decorative, never a control. */
export function GrizzlyPaw() {
 return <span className="grizzly-hero-paw grizzly-talon-mark" aria-hidden="true"/>;
}

export function GrizzlyWilderness(){
 return <svg className="grizzly-wilderness" viewBox="0 0 800 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><path fill="currentColor" d="M0 176 110 30l66 95 81-124 113 140 84-95 90 105 99-122 157 167v44H0Z"/><g fill="#050a0e"><path d="m44 172 22-57 22 57H74l22 41H36l23-41Zm104 12 30-75 30 75h-20l26 56h-72l26-56Zm396 0 28-80 28 80h-18l28 56h-76l28-56Zm109-2 39-101 39 101h-25l33 58h-94l33-58Z"/></g></svg>;
}

export function GrizzlyClaws(){
 return <svg className="grizzly-claws" viewBox="0 0 180 190" aria-hidden="true" focusable="false"><g fill="currentColor"><path d="m37 4 20 7-7 21 3 6-14 30 2 8-17 39 1 14L5 188l12-75-1-13 12-42-2-9Z"/><path d="m97 0 20 5-11 24 3 8-18 33 2 9-20 42-2 17-24 46 16-69-2-13 15-43-1-13Z"/><path d="m157 7 21 6-16 28 2 9-21 34 1 13-24 42-4 18-23 30 20-61-1-13 17-43-2-14Z"/></g></svg>;
}
