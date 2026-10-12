/** Original provisional bear mark. Replace only after retrieving the gym's logo. */
export function GrizzlyMark({className}: {className?:string}) {
 return <svg className={className} viewBox="0 0 64 64" width="48" height="48" aria-hidden="true" focusable="false">
  <rect width="64" height="64" rx="18" fill="#24221d"/>
  <g fill="var(--brand-from, #f5cb79)">
   <circle cx="17" cy="18" r="9"/><circle cx="47" cy="18" r="9"/>
   <path d="M13 28 21 18 32 15 43 18 51 28 49 43 40 53H24L15 43Z"/>
  </g>
  <g fill="#24221d"><circle cx="17" cy="18" r="4"/><circle cx="47" cy="18" r="4"/>
   <path d="m21 29 7 2-5 3Zm22 0-7 2 5 3Z"/>
   <path d="m32 34 8 5-4 6h-8l-4-6Z"/>
   <path d="M30 43h4v5h-4Z"/>
  </g>
 </svg>;
}

export function GrizzlyPaw() {
 return <svg className="grizzly-hero-paw" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false"><g fill="currentColor"><ellipse cx="5" cy="8" rx="2.5" ry="3.2" transform="rotate(-24 5 8)"/><ellipse cx="10" cy="5" rx="2.5" ry="3.2"/><ellipse cx="16" cy="5" rx="2.5" ry="3.2"/><ellipse cx="21" cy="9" rx="2.3" ry="3" transform="rotate(24 21 9)"/><path d="M5 18c0-4 4-8 7-8s8 4 8 8c0 5-5 2-8 2s-7 3-7-2Z"/></g></svg>;
}
