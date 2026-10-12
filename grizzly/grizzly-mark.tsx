import {publicPath} from '../lib/public-path';
/** Display the uploaded JPEG directly; no redrawing or recoloring of its artwork. */
export function GrizzlyMark({className}: {className?:string}) {
 return <span className={'grizzly-logo-frame '+(className||'')} aria-hidden="true"><img src={publicPath('/brand/grizzly-fitness-logo.jpg')} width="1280" height="593" alt="" className="grizzly-logo-image"/></span>;
}

export function GrizzlyPaw() {
 return <svg className="grizzly-hero-paw" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false"><g fill="currentColor"><ellipse cx="5" cy="8" rx="2.5" ry="3.2" transform="rotate(-24 5 8)"/><ellipse cx="10" cy="5" rx="2.5" ry="3.2"/><ellipse cx="16" cy="5" rx="2.5" ry="3.2"/><ellipse cx="21" cy="9" rx="2.3" ry="3" transform="rotate(24 21 9)"/><path d="M5 18c0-4 4-8 7-8s8 4 8 8c0 5-5 2-8 2s-7 3-7-2Z"/></g></svg>;
}
