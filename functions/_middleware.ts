// Runs before every request on Cloudflare Pages.
// Sends http:// and www. visits to the one real address, https://trekkingpartnersnepal.com,
// with a permanent (301) redirect, so Google only sees and ranks one version of each page.
// Normal requests pass straight through.
const HOST = 'trekkingpartnersnepal.com';

export async function onRequest(context: any) {
  const url = new URL(context.request.url);
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.endsWith('.pages.dev');
  if (!isLocal && (url.hostname !== HOST || url.protocol === 'http:')) {
    url.protocol = 'https:';
    url.hostname = HOST;
    url.port = '';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
