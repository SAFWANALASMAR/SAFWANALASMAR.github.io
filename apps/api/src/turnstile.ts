const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type VerifyResult = { success: boolean; action?: string };

/** Verifies a Turnstile token server-side. The widget must use data-action="contact". */
export async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip !== 'unknown') body.append('remoteip', ip);

  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body });
    if (!res.ok) return false;
    const result = (await res.json()) as VerifyResult;
    // Cloudflare's test keys report action "test"; real tokens must carry our action.
    return result.success === true && (result.action === 'contact' || result.action === 'test');
  } catch {
    return false;
  }
}
