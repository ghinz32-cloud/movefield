export type AccountSession={id:string;createdAt:number;updatedAt:number;expiresAt:number;current:boolean};
export type SessionList={ownerId:string;sessions:AccountSession[];hasMore:boolean};
export function readSessionList(raw:unknown,ownerId:string):SessionList{
 const v=raw as SessionList;
 if(!v||v.ownerId!==ownerId||typeof v.hasMore!=='boolean'||!Array.isArray(v.sessions)||v.sessions.length>100)throw Error('This session list does not belong to the current account.');
 if(v.sessions.some(s=>!s||typeof s.id!=='string'||!s.id||s.id.length>128||typeof s.current!=='boolean'||Object.keys(s).some(k=>!['id','createdAt','updatedAt','expiresAt','current'].includes(k))||[s.createdAt,s.updatedAt,s.expiresAt].some(n=>!Number.isSafeInteger(n)||n<0)))throw Error('The session list could not be verified.');
 if(new Set(v.sessions.map(s=>s.id)).size!==v.sessions.length)throw Error('The session list has duplicate IDs.');
 return v;
}
