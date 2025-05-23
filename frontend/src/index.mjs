export default {
  async fetch(request, env, ctx) {
    try {
      const { prompt } = await request.json();
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Prompt is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const styleDescription = "cinematic lighting, photorealistic, ultra detailed";
      const finalPrompt = `${prompt}, ${styleDescription}`;

      const ai = env.AI;
      const model = "@cf/black-forest-labs/flux-1-schnell";
      const inputs = { prompt: finalPrompt };
      const response = await ai.run(model, inputs);

      const base64 = response.image;
      const imageDataURI = `data:image/png;base64,${base64}`;

      return new Response(
        JSON.stringify({ image_url: imageDataURI }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: `Image generation failed: ${error.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
