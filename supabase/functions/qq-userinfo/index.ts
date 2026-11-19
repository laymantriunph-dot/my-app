const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

type QqTokenPayload = {
  iss: string;
  sub: string;
  app_id: string;
  qq_access_token: string;
  exp: number;
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

function decodeBase64Url(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

async function verifyToken(token: string): Promise<QqTokenPayload> {
  const secret = Deno.env.get('QQ_PROXY_SECRET');

  if (!secret) {
    throw new Error('QQ_PROXY_SECRET is not configured.');
  }

  const [header, payload, signature] = token.split('.');

  if (!header || !payload || !signature) {
    throw new Error('Invalid token.');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${header}.${payload}`),
  );

  if (base64UrlEncode(new Uint8Array(expected)) !== signature) {
    throw new Error('Invalid token signature.');
  }

  const parsed = JSON.parse(decodeBase64Url(payload)) as QqTokenPayload;

  if (parsed.iss !== 'sanfen-qq-proxy' || parsed.exp < Date.now() / 1000) {
    throw new Error('Expired token.');
  }

  return parsed;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authorization = request.headers.get('authorization') ?? '';
    const token = authorization.replace(/^Bearer\s+/i, '');
    const payload = await verifyToken(token);
    const params = new URLSearchParams({
      access_token: payload.qq_access_token,
      oauth_consumer_key: payload.app_id,
      openid: payload.sub,
      fmt: 'json',
    });
    const profileResponse = await fetch(
      `https://graph.qq.com/user/get_user_info?${params.toString()}`,
    );
    const profile = (await profileResponse.json()) as Record<string, unknown>;

    if (!profileResponse.ok || Number(profile.ret ?? 0) !== 0) {
      return json({ error: 'qq_profile_lookup_failed' }, 502);
    }

    const nickname = String(profile.nickname ?? 'QQ 用户');
    const picture = String(
      profile.figureurl_qq_2 ?? profile.figureurl_qq_1 ?? '',
    );

    return json({
      sub: payload.sub,
      name: nickname,
      preferred_username: nickname,
      picture,
      locale: 'zh-CN',
    });
  } catch {
    return json({ error: 'invalid_qq_proxy_token' }, 401);
  }
});
