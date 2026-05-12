import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// POST /api/wardrobe/analyze
router.post("/wardrobe/analyze", async (req, res) => {
  const { imageBase64, mimeType } = req.body as {
    imageBase64: string;
    mimeType: string;
  };

  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: "imageBase64 and mimeType are required" });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "low",
              },
            },
            {
              type: "text",
              text: `Analyze this clothing item and return ONLY a valid JSON object with these exact fields (no markdown, no explanation):
{
  "name": "descriptive name for the item",
  "category": "one of: tops, bottoms, dresses, shoes, accessories, outerwear, activewear",
  "colorName": "primary color name",
  "colorHex": "#RRGGBB hex code for the primary color",
  "type": "specific clothing type e.g. floral midi dress, white button-down shirt",
  "season": ["array of applicable: spring, summer, fall, winter"],
  "occasion": ["array of applicable: casual, work, formal, athletic, date"],
  "tags": ["array of 3-5 descriptive style tags"],
  "brand": "brand name if visible or null"
}`,
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Error analyzing clothing");
    res.status(500).json({ error: "Failed to analyze clothing" });
  }
});

// POST /api/wardrobe/outfit-suggestions
router.post("/wardrobe/outfit-suggestions", async (req, res) => {
  const { wardrobeItems, occasion, weather, count = 3 } = req.body as {
    wardrobeItems: {
      id: string;
      name: string;
      category: string;
      colorName: string;
      type: string;
    }[];
    occasion: string;
    weather: string;
    count?: number;
  };

  if (!wardrobeItems || !occasion || !weather) {
    res.status(400).json({ error: "wardrobeItems, occasion, and weather are required" });
    return;
  }

  try {
    const itemList = wardrobeItems
      .map((i) => `- ID: ${i.id} | ${i.name} (${i.category}) - ${i.colorName} ${i.type}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 2000,
      messages: [
        {
          role: "system",
          content:
            "You are an expert fashion stylist. Create cohesive, stylish outfit combinations from the provided wardrobe items. Return only valid JSON.",
        },
        {
          role: "user",
          content: `Create exactly ${count} outfit combination(s) for these conditions:
- Occasion: ${occasion}
- Weather: ${weather}

Available wardrobe items:
${itemList}

Return ONLY a JSON object (no markdown):
{
  "outfits": [
    {
      "name": "outfit name",
      "itemIds": ["exact item IDs from the list above"],
      "description": "brief 1-2 sentence description of the look",
      "tips": "1 specific styling tip"
    }
  ]
}

Rules:
- Only use IDs from the provided list
- Each outfit must include items from at least 2 different categories
- Make sure items work together color-wise and stylistically
- Tailor specifically to the occasion and weather`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{"outfits":[]}';
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Error generating outfit suggestions");
    res.status(500).json({ error: "Failed to generate outfit suggestions" });
  }
});

// POST /api/wardrobe/style-chat (streaming)
router.post("/wardrobe/style-chat", async (req, res) => {
  const { messages, wardrobeSummary } = req.body as {
    messages: { role: string; content: string }[];
    wardrobeSummary?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const systemContent = wardrobeSummary
      ? `You are Aura, a sophisticated AI personal stylist with a warm, confident personality. You give concise, specific, actionable fashion advice. The user's wardrobe: ${wardrobeSummary}. Reference their specific items when relevant.`
      : `You are Aura, a sophisticated AI personal stylist with a warm, confident personality. You give concise, specific, actionable fashion advice. Keep responses to 2-3 short paragraphs max.`;

    const chatMessages = [
      { role: "system" as const, content: systemContent },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 800,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error in style chat");
    res.write(`data: ${JSON.stringify({ error: "Style chat failed" })}\n\n`);
    res.end();
  }
});

export default router;
