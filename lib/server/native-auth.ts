/** A deployment trusts one installed app's callback scheme, only after qualification. */
export function nativeCallback(env: Cloudflare.Env): string | null {
  if (env.NATIVE_AUTH_VERIFIED !== 'true') return null;
  if (env.APP_VARIANT === 'grizzly') return 'grizzlyfitness://';
  return !env.APP_VARIANT || env.APP_VARIANT === 'movefield' ? 'movefield://' : null;
}
