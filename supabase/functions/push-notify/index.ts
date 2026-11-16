// Supabase Edge Function: push-notify
// Triggered by a Database Webhook on INSERT into `public.notifications`.
// Sends a real FCM v1 push to the founder's phone(s) via device_tokens.
//
// Required Edge Function secrets:
//   FCM_SERVICE_ACCOUNT_JSON  - full Firebase service-account JSON
//   FCM_PROJECT_ID            - Firebase project id
// See PUSH_SETUP.md for exact setup steps.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const b64u = (bytes: Uint8Array): string => {
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

function pemToDer(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const bin = atob(body);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64u(new TextEncoder().encode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })));
  const unsigned = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned)
  );
  const jwt = `${unsigned}.${b64u(new Uint8Array(signature))}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || 'FCM token failed');
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    // Supabase Database Webhook sends { type, table, record }
    const row = payload.record ?? payload;
    if (payload.type && payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ skipped: 'not an INSERT' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const saJson = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON');
    const projectId = Deno.env.get('FCM_PROJECT_ID');
    if (!saJson || !projectId) {
      return new Response(
        JSON.stringify({ error: 'FCM secrets not configured — see PUSH_SETUP.md' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: tokens, error } = await supabaseAdmin
      .from('device_tokens')
      .select('token')
      .eq('user_id', row.user_id);
    if (error) throw error;
    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no device tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getAccessToken(JSON.parse(saJson));
    let sent = 0;
    for (const t of tokens) {
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token: t.token,
              notification: { title: row.title, body: row.body || 'dorymo আপডেট' },
              data: { link: row.link || '#/', type: row.type || 'general' },
              android: { priority: 'high' },
              apns: { payload: { aps: { sound: 'default', badge: 1 } } },
            },
          }),
        }
      );
      if (res.ok) sent++;
    }

    return new Response(JSON.stringify({ sent, total: tokens.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
