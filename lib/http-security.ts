import {QWEN_CONNECT_SOURCES} from './qwen-network-policy';

// The app has no public write API. Revisit this boundary when real accounts and
// server-side saves are added; do not replace it with a blanket POST allowance.
export function blockedRequest(request:Request):Response|null {
  const path=new URL(request.url).pathname;
  if(path==='/_next/image'||path.startsWith('/__vinext/'))return new Response('Not found',{status:404});
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  return null;
}
export function securityContext(request:Request){
  const bytes=crypto.getRandomValues(new Uint8Array(24));
  const nonce=btoa(String.fromCharCode(...bytes));
  const policy=["default-src 'self'",`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,"worker-src 'self'","style-src 'self' 'unsafe-inline'","img-src 'self' data:","font-src 'self' data:",`connect-src 'self' ${QWEN_CONNECT_SOURCES.join(' ')}`,"object-src 'none'","base-uri 'none'","form-action 'self'","frame-src 'none'","frame-ancestors 'self' https://chatgpt.com","upgrade-insecure-requests"].join('; ');
  const headers=new Headers(request.headers);
  // Vinext reads this header to nonce its own scripts. Never trust a nonce
  // supplied by the browser and never add nonces to arbitrary HTML scripts.
  headers.set('Content-Security-Policy',policy);
  headers.delete('Content-Security-Policy-Report-Only');
  return {request:new Request(request,{headers}),policy,nonce};
}
export function secureResponse(response:Response,policy?:string){
  const result=new Response(response.body,response);
  result.headers.set('X-Content-Type-Options','nosniff');
  result.headers.set('Referrer-Policy','no-referrer');
  result.headers.set('X-Robots-Tag','noindex, nofollow');
  result.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()');
  if(policy){
    result.headers.set('Content-Security-Policy',policy);
    result.headers.set('Strict-Transport-Security','max-age=31536000');
    // HTML and RSC responses must not reuse another request's nonce.
    result.headers.set('Cache-Control','private, no-store');
  }
  result.headers.delete('X-Powered-By');
  return result;
}
