declare const __MOVEFIELD_PUBLIC_BASE__:string;
export function publicPath(path:string):string {
 const base=typeof __MOVEFIELD_PUBLIC_BASE__==='string'?__MOVEFIELD_PUBLIC_BASE__:'/';
 return base.replace(/\/$/,'')+'/'+path.replace(/^\//,'');
}
