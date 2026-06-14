import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A friendly 1-2 sentence summary of the current weather."
    },
    clothing: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of recommended items to wear."
    },
    activities: {
      type: Type.OBJECT,
      properties: {
        recommended: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Recommended activities based on the weather."
        },
        avoid: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Activities to avoid."
        }
      },
      required: ["recommended", "avoid"]
    },
    funFact: {
      type: Type.STRING,
      description: "A short, interesting fun fact about the current weather conditions."
    }
  },
  required: ["summary", "clothing", "activities", "funFact"]
};

// API Endpoint for Weather Insights
app.post("/api/insights", async (req, res) => {
  const { location, weather } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key is not configured." });
  }

  const prompt = `
    You are an expert weather agent called SkyCast AI.
    Provide weather insights for ${location}.
    Current Weather: ${weather.current.temp}°C, ${weather.current.description}.
    Humidity: ${weather.current.humidity}%, Wind Speed: ${weather.current.windSpeed} km/h.
    3-Day Forecast: ${weather.daily.map((d: any) => `${d.date}: ${d.minTemp}-${d.maxTemp}°C, ${d.description}`).join("; ")}.

    Give me a summary, clothing advice, recommended/avoided activities, and a fun fact.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const insights = JSON.parse(result.text || "{}");
    res.json(insights);
  } catch (error) {
    console.error("AI Insight Error:", error);
    res.status(500).json({ error: "Failed to generate AI insights" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
