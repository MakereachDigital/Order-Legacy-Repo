import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
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
      console.error("Failed to extract required fields:", product);
      return new Response(
        JSON.stringify({ 
          error: "Could not extract product information",
          product 
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully extracted product:", product);

    return new Response(
      JSON.stringify({ product }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error scraping product:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
