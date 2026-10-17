// Cloudflare Pages Function helper: forwards /rest/v1, /auth/v1, /storage/v1, /realtime/v1 and
// /functions/v1 on trekkingpartnersnepal.com to Supabase.
// Why: some internet providers block *.supabase.co. Visitors only ever talk to our own domain,
// so sign-in, posts, replies and notifications keep working on those networks.
export const SUPABASE_UPSTREAM = 'https://waorryrsgdfvhujreuvq.supabase.co';

export async function proxyToSupabase(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = SUPABASE_UPSTREAM + url.pathname + url.search;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('cookie');                     // site cookies are not needed by Supabase
  const isWebSocket = (request.headers.get('upgrade') || '').toLowerCase() === 'websocket';
  if (isWebSocket) {
    // Realtime (notification bell): pass the WebSocket straight through
    return fetch(target, { method: 'GET', headers });
  }
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  return fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: 'manual',
    // @ts-ignore – needed for streaming request bodies on Workers
    duplex: hasBody ? 'half' : undefined,
  });
}
