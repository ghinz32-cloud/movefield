import {useId} from 'react';
export function BrandMark({className}: {className?: string}) {
  const gradient=useId().replace(/:/g,'');
  return <svg className={className} viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" focusable="false">
    <defs><linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--brand-from, #c4f275)"/><stop offset="1" stopColor="var(--brand-to, #56dfae)"/></linearGradient></defs>
    <rect width="40" height="40" rx="11" fill="#132325"/>
    <path className="monogram-fill" d="M7 29V11h5l8 10 8-10h5v18h-6V20l-7 8-7-8v9Z" fill={`url(#${gradient})`}/>
  </svg>;
}
