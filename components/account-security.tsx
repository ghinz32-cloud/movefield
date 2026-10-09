"use client";
export function AccountSecurity({compact=false}:{compact?:boolean;onContinue?:()=>void;storageKey?:string}){
 return <section className={compact?'profile-account-note':'card profile-account-note'}><h2>Profile &amp; sign-in</h2><p>Your training profile is stored on this device. No password or sign-in is needed to use it.</p><details><summary>Use training across devices</summary><p>Create a transfer file in Settings, then restore it on your other device. Movefield accounts, Google sign-in and passkeys are not connected yet.</p></details></section>;
}
