import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fontName, handwritingSample } = await req.json();

    if (!fontName || !handwritingSample) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI to analyze handwriting and generate font metadata
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are a font generation assistant. Analyze the provided handwriting sample and generate CSS font-face properties that mimic the style. Focus on letter spacing, line height, font weight, and slant. Return a JSON object with CSS properties.",
            },
            {
              role: "user",
              content: `Generate font properties for this handwriting sample: "${handwritingSample}". The font will be called "${fontName}".`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("AI API error:", error);
      throw new Error("Failed to generate font properties");
    }

    const aiData = await response.json();
    const fontProperties =
      aiData.choices[0]?.message?.content || "{}";

    // Create a simple font-face CSS that uses a handwriting-style font with custom properties
    const fontData = `
      @font-face {
        font-family: '${fontName}';
        src: local('Caveat'), local('Permanent Marker');
        font-style: normal;
        letter-spacing: 0.05em;
        font-variation-settings: "wght" 400;
      }
    `;

    // Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("custom_fonts")
      .insert([
        {
          font_name: fontName,
          font_data: JSON.stringify({
            css: fontData,
            properties: fontProperties,
            sample: handwritingSample,
          }),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log("Font generated successfully:", fontName);

    return new Response(
      JSON.stringify({
        success: true,
        font: data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-font function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
