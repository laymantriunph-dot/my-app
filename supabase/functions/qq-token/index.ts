const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function base64UrlEncode(value: string | Uint8Array) {
  const bytes =
    typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

async function signPayload(payload: Record<string, unknown>) {
  const secret = Deno.env.get('QQ_PROXY_SECRET');

  if (!secret) {
    throw new Error('QQ_PROXY_SECRET is not configured.');
  }

  const header = base64UrlEncode(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  );
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${header}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data),
  );

  return `${data}.${base64UrlEncode(new Uint8Array(signature))}`;
}

function parseJsonOrJsonp(raw: string) {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith('callback(')
    ? trimmed.slice('callback('.length, trimmed.lastIndexOf(')'))
    : trimmed;

  return JSON.parse(jsonText) as Record<string, unknown>;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  try {
    const form = await request.formData();
    const code = String(form.get('code') ?? '');
    const clientId = String(form.get('client_id') ?? '');
    const clientSecret = String(form.get('client_secret') ?? '');
    const redirectUri = String(form.get('redirect_uri') ?? '');

    if (!code || !clientId || !clientSecret || !redirectUri) {
      return json({ error: 'invalid_request' }, 400);
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      fmt: 'json',
    });
    const tokenResponse = await fetch('https://graph.qq.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams,
    });
    const tokenData = parseJsonOrJsonp(await tokenResponse.text());

    if (!tokenResponse.ok || !tokenData.access_token) {
      return json({ error: 'qq_token_exchange_failed' }, 502);
    }

    const openIdResponse = await fetch(
      `https://graph.qq.com/oauth2.0/me?access_token=${encodeURIComponent(
        String(tokenData.access_token),
      )}&fmt=json`,
    );
    const openIdData = parseJsonOrJsonp(await openIdResponse.text());

    if (!openIdResponse.ok || !openIdData.openid) {
      return json({ error: 'qq_openid_lookup_failed' }, 502);
    }

    const proxyToken = await signPayload({
      iss: 'sanfen-qq-proxy',
      sub: String(openIdData.openid),
      app_id: clientId,
      qq_access_token: String(tokenData.access_token),
      exp: Math.floor(Date.now() / 1000) + 600,
    });

    return json({
      access_token: proxyToken,
      token_type: 'Bearer',
      expires_in: 600,
      scope: String(tokenData.scope ?? 'get_user_info'),
    });
  } catch {
    return json({ error: 'qq_token_proxy_error' }, 500);
  }
});
