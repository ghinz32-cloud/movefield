declare const __MOVEFIELD_REVIEW_BASE__: string;
export const staticReviewBase=typeof __MOVEFIELD_REVIEW_BASE__==='string'?__MOVEFIELD_REVIEW_BASE__:'';
export const publicPath=(path:string)=>staticReviewBase&&path.startsWith('/')?staticReviewBase+path.slice(1):path;
