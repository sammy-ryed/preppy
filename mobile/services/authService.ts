import { getSupabase } from '../lib/supabase';

let pendingSignIn: Promise<string> | undefined;

export function ensureAnonymousUser(): Promise<string> {
  if (pendingSignIn) return pendingSignIn;
  pendingSignIn = (async () => {
    const client = getSupabase();
    const { data, error } = await client.auth.getSession();
    if (error) throw error; // Do not discard an existing identity on transient auth failure.
    if (data.session) return data.session.user.id;
    const signedIn = await client.auth.signInAnonymously();
    if (signedIn.error) throw signedIn.error;
    if (!signedIn.data.user) throw new Error('Anonymous sign-in did not return a user');
    return signedIn.data.user.id;
  })().finally(() => { pendingSignIn = undefined; });
  return pendingSignIn;
}
