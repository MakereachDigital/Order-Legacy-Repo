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
    
    // Only allow HTTPS protocol
    if (parsed.protocol !== 'https:') {
      console.log('Rejected URL: non-HTTPS protocol', parsed.protocol);
      return false;
    }
    
    const hostname = parsed.hostname.toLowerCase();
    
    // Block localhost and loopback addresses
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '::') {
      console.log('Rejected URL: localhost/loopback');
      return false;
    }
    
    // Block private IP ranges (RFC 1918)
    // 10.0.0.0/8
    if (hostname.match(/^10\./)) {
      console.log('Rejected URL: private IP (10.x.x.x)');
      return false;
    }
    
    // 172.16.0.0/12
    if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
      console.log('Rejected URL: private IP (172.16-31.x.x)');
      return false;
    }
    
    // 192.168.0.0/16
    if (hostname.match(/^192\.168\./)) {
      console.log('Rejected URL: private IP (192.168.x.x)');
      return false;
    }
    
    // Block AWS/cloud metadata endpoints (169.254.169.254)
    if (hostname.match(/^169\.254\./)) {
      console.log('Rejected URL: cloud metadata IP');
      return false;
    }
    
    // Block 0.0.0.0
    if (hostname === '0.0.0.0') {
      console.log('Rejected URL: 0.0.0.0');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('Rejected URL: invalid URL format', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const imageUrl = body?.imageUrl as string | undefined;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate URL to prevent SSRF
    if (!isValidImageUrl(imageUrl)) {
      console.log('Request rejected: invalid image URL', imageUrl);
      return new Response(
        JSON.stringify({ error: 'Invalid image URL' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetching image:', imageUrl);

    // Fetch the image from the external server
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = new Uint8Array(await response.arrayBuffer());
    const base64 = uint8ToBase64(buffer);

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;

    console.log('Image fetched successfully, size:', buffer.byteLength);

    return new Response(
      JSON.stringify({ dataUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in image-proxy:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
