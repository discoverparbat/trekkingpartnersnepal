// Forwards this path to Supabase – see src/lib/sbproxy.ts
import { proxyToSupabase } from '../../../src/lib/sbproxy';
export const onRequest = ({ request }: { request: Request }) => proxyToSupabase(request);
