import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate URL to prevent SSRF attacks
function isValidScrapeUrl(url: string): boolean {
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
    if (hostname.match(/^10\./)) {
      console.log('Rejected URL: private IP (10.x.x.x)');
      return false;
    }
    
    if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
      console.log('Rejected URL: private IP (172.16-31.x.x)');
      return false;
    }
    
    if (hostname.match(/^192\.168\./)) {
      console.log('Rejected URL: private IP (192.168.x.x)');
      return false;
    }
    
    // Block cloud metadata endpoints
    if (hostname.match(/^169\.254\./)) {
      console.log('Rejected URL: cloud metadata IP');
      return false;
    }
    
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Request rejected: missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('Request rejected: invalid JWT', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Authenticated user:', user.id);

    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL to prevent SSRF
    if (!isValidScrapeUrl(url)) {
      console.log('Request rejected: invalid URL', url);
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scraping product from URL:", url);

    // Fetch the product page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    console.log("Fetched HTML, length:", html.length);

    // Extract product information
    const product: any = {};

    // Extract name (multiple patterns)
    const namePatterns = [
      /<h1[^>]*class="[^"]*product[_-]?title[^"]*"[^>]*>(.*?)<\/h1>/is,
      /<h1[^>]*>(.*?)<\/h1>/is,
    ];
    for (const pattern of namePatterns) {
      const nameMatch = html.match(pattern);
      if (nameMatch) {
        product.name = nameMatch[1].replace(/<[^>]*>/g, "").trim();
        break;
      }
    }

    // Extract price (multiple patterns)
    const pricePatterns = [
      /<span class="[^"]*woocommerce-Price-amount[^"]*amount[^"]*"[^>]*>(.*?)<\/span>/is,
      /<span class="[^"]*amount[^"]*">(.*?)<\/span>/is,
      /<bdi>(.*?)<\/bdi>/is,
    ];
    for (const pattern of pricePatterns) {
      const priceMatch = html.match(pattern);
      if (priceMatch) {
        product.price = priceMatch[1].replace(/<[^>]*>/g, "").trim();
        break;
      }
    }

    // Extract SKU
    const skuPatterns = [
      /SKU:\s*<span class="sku">(.*?)<\/span>/is,
      /SKU:\s*([A-Z0-9\-]+)/is,
      /"sku":\s*"([^"]+)"/is,
    ];
    for (const pattern of skuPatterns) {
      const skuMatch = html.match(pattern);
      if (skuMatch) {
        product.sku = skuMatch[1].trim();
        break;
      }
    }

    // Extract main image (multiple patterns)
    const imagePatterns = [
      /<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]+)"/is,
      /<img[^>]*class="[^"]*attachment-[^"]*"[^>]*src="([^"]+)"/is,
      /<div[^>]*class="[^"]*woocommerce-product-gallery__image[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/is,
      /"image":\s*"([^"]+)"/is,
    ];
    for (const pattern of imagePatterns) {
      const imageMatch = html.match(pattern);
      if (imageMatch) {
        product.image = imageMatch[1].trim();
        break;
      }
    }

    // Validate we got at least name and image
    if (!product.name || !product.image) {
      console.error("Failed to extract required fields");
      return new Response(
        JSON.stringify({ error: "Could not extract product information" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully extracted product:", product.name);

    return new Response(
      JSON.stringify({ product }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error scraping product:", error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
