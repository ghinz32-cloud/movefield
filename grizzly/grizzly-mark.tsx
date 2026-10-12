import {publicPath} from '../lib/public-path';
/** Display the uploaded JPEG directly; no redrawing or recoloring of its artwork. */
export function GrizzlyMark({className}: {className?:string}) {
 return <span className={'grizzly-logo-frame '+(className||'')} aria-hidden="true"><img src={publicPath('/brand/grizzly-fitness-logo.jpg')} width="1280" height="593" alt="" className="grizzly-logo-image"/></span>;
}

export function GrizzlyPaw() {
 return <svg className="grizzly-hero-paw" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false"><g fill="currentColor"><ellipse cx="5" cy="8" rx="2.5" ry="3.2" transform="rotate(-24 5 8)"/><ellipse cx="10" cy="5" rx="2.5" ry="3.2"/><ellipse cx="16" cy="5" rx="2.5" ry="3.2"/><ellipse cx="21" cy="9" rx="2.3" ry="3" transform="rotate(24 21 9)"/><path d="M5 18c0-4 4-8 7-8s8 4 8 8c0 5-5 2-8 2s-7 3-7-2Z"/></g></svg>;
}

export function GrizzlyClaws(){
 return <svg className="grizzly-claws" viewBox="0 0 180 190" aria-hidden="true" focusable="false"><g fill="currentColor"><path d="m37 4 20 7-7 21 3 6-14 30 2 8-17 39 1 14L5 188l12-75-1-13 12-42-2-9Z"/><path d="m97 0 20 5-11 24 3 8-18 33 2 9-20 42-2 17-24 46 16-69-2-13 15-43-1-13Z"/><path d="m157 7 21 6-16 28 2 9-21 34 1 13-24 42-4 18-23 30 20-61-1-13 17-43-2-14Z"/></g></svg>;
}
