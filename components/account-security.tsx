"use client";
export function AccountSecurity({compact=false}:{compact?:boolean;onContinue?:()=>void;storageKey?:string}){
 return <section className={compact?'profile-account-note':'card profile-account-note'}><h2>Profile &amp; sign-in</h2><p>Your training profile is stored on this device. No password or sign-in is needed to use it.</p><details><summary>Use training across devices</summary><p>Create a transfer file in Settings, then restore it on your other device. Optional encrypted browser account sync is available in Settings on the authenticated hosted app. Phone account sync, Google sign-in and passkeys are unavailable.</p></details></section>;
}
