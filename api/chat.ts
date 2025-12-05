import type { VercelRequest, VercelResponse } from "@vercel/node";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured on server" });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request: messages array required" });
    }

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        return res.status(401).json({ error: "Invalid API key configured on server" });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: "Rate limit exceeded. Please wait a moment and try again." });
      }
      
      return res.status(response.status).json({ 
        error: errorData.error?.message || `OpenAI API error: ${response.status}` 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({ error: "Failed to connect to OpenAI API" });
  }
}

