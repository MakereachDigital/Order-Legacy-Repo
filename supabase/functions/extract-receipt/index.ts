import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error("No image data provided");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing receipt with Lovable AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this receipt/invoice image and extract product information. 
                
For each product found, extract:
- SKU (product code/item number)
- Product name
- Quantity

Return ONLY a valid JSON array with this exact structure:
[
  {
    "sku": "OPC",
    "name": "Oxford Pant Cassic",
    "quantity": 50
  }
]

Rules:
- If no SKU is visible, use an empty string ""
- If quantity is not specified, default to 1
- Extract ALL products visible in the image
- Return valid JSON only, no markdown formatting
- If no products found, return []`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI Response received");

    // Parse the JSON from the response
    let extractedProducts;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedProducts = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response");
      throw new Error("Invalid JSON response from AI");
    }

    console.log("Extracted products count:", extractedProducts.length);

    return new Response(
      JSON.stringify({ products: extractedProducts }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in extract-receipt function:", error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});