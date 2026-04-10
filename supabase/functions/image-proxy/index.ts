import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

// Validate URL to prevent SSRF attacks
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    if (parsed.protocol !== 'https:') return false;
    
    const hostname = parsed.hostname.toLowerCase();
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '::') return false;
    if (hostname.match(/^10\./)) return false;
    if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) return false;
    if (hostname.match(/^192\.168\./)) return false;
    if (hostname.match(/^169\.254\./)) return false;
    if (hostname === '0.0.0.0') return false;
    
    return true;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Support GET requests with ?url= query param (streams raw image)
    if (req.method === 'GET') {
      const reqUrl = new URL(req.url);
      const imageUrl = reqUrl.searchParams.get('url');

      if (!imageUrl) {
        return new Response('Missing url parameter', { status: 400, headers: corsHeaders });
      }

      if (!isValidImageUrl(imageUrl)) {
        return new Response('Invalid image URL', { status: 400, headers: corsHeaders });
      }

      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        return new Response('Failed to fetch image', { status: response.status, headers: corsHeaders });
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const body = await response.arrayBuffer();

      return new Response(body, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // POST: existing base64 JSON response
    const body = await req.json().catch(() => ({} as any));
    const imageUrl = body?.imageUrl as string | undefined;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidImageUrl(imageUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid image URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = new Uint8Array(await response.arrayBuffer());
    const base64 = uint8ToBase64(buffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;

    return new Response(
      JSON.stringify({ dataUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in image-proxy:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
