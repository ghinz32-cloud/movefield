import {publicPath} from '../lib/public-path';
/** Display the uploaded JPEG directly; no redrawing or recoloring of its artwork. */
export function GrizzlyMark({className}: {className?:string}) {
 return <span className={'grizzly-logo-frame '+(className||'')} aria-hidden="true"><img src={publicPath('/brand/grizzly-fitness-logo.jpg')} width="1280" height="593" alt="" className="grizzly-logo-image"/></span>;
}

/** Long, connected claws render inline so an old cached mask cannot hide them. */
export function GrizzlyPaw() {
 return <svg className="grizzly-hero-paw grizzly-talon-mark" viewBox="0 0 128 144" aria-hidden="true" focusable="false" fill="currentColor"><path data-bear-claw="1" d="M12 67C4 42 9 21 21 7L21 61Z"/><path data-bear-claw="2" d="M35 56C29 33 35 12 48 0L44 52Z"/><path data-bear-claw="3" d="M58 50C56 28 65 9 77 0L68 50Z"/><path data-bear-claw="4" d="M83 57C85 31 97 15 111 9L94 61Z"/><path data-bear-claw="5" d="M106 70C114 51 122 44 128 42L115 76Z"/><path d="M10 76 17 66 27 68 33 80 29 94 18 99 8 87ZM33 63 44 54 55 62 57 76 48 89 36 85 29 74ZM57 58 69 51 81 59 80 77 69 86 57 77ZM82 68 93 60 106 69 107 84 97 96 86 91 79 78ZM108 83 117 77 126 85 122 103 111 106 103 96Z"/><path fillRule="evenodd" d="M22 111 33 98 44 99 57 87 74 87 91 104 101 103 113 118 108 128 111 138 95 143 81 136 66 144 49 139 33 144 20 135 17 121ZM47 111l-7 20 9-9 6-20ZM69 107l-6 26 10-13 4-20ZM89 115l-6 19 9-10 6-17Z"/></svg>;
}

export function GrizzlyWilderness(){
 return <svg className="grizzly-wilderness" viewBox="0 0 800 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><path fill="currentColor" d="M0 176 110 30l66 95 81-124 113 140 84-95 90 105 99-122 157 167v44H0Z"/><g fill="#050a0e"><path d="m44 172 22-57 22 57H74l22 41H36l23-41Zm104 12 30-75 30 75h-20l26 56h-72l26-56Zm396 0 28-80 28 80h-18l28 56h-76l28-56Zm109-2 39-101 39 101h-25l33 58h-94l33-58Z"/></g></svg>;
}

export function GrizzlyClaws(){
 return <svg className="grizzly-claws" viewBox="0 0 180 190" aria-hidden="true" focusable="false"><g fill="currentColor"><path d="m37 4 20 7-7 21 3 6-14 30 2 8-17 39 1 14L5 188l12-75-1-13 12-42-2-9Z"/><path d="m97 0 20 5-11 24 3 8-18 33 2 9-20 42-2 17-24 46 16-69-2-13 15-43-1-13Z"/><path d="m157 7 21 6-16 28 2 9-21 34 1 13-24 42-4 18-23 30 20-61-1-13 17-43-2-14Z"/></g></svg>;
}
