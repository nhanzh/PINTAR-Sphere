import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health Check API
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "PINTAR@Sphere",
    version: "1.0.0",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Gemini Chat API (Handles both /api/gemini/chat and /api/chat)
const handleGeminiChat = async (req: express.Request, res: express.Response) => {
  try {
    const { message, history = [], context = "", language = "ms" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getAIClient();

    const formattedContext = typeof context === "object" ? JSON.stringify(context) : String(context);

    const systemInstruction = `You are PINTAR AI, the elite academic mentor and intelligent tutor for PINTAR@Sphere (UKM ASASIpintar Pre-University / Foundation Portal).
Respond in the language requested by the student (Malay if language='ms' or user speaks Malay, English if language='en', Chinese if language='zh').
Always provide highly accurate, step-by-step academic solutions, derivations, equations, and explanations.

You specialize in the official UKM ASASIpintar curriculum:
1. Kimia I / Chemistry I (PNAP0133): Reaction kinetics, equilibrium (Kc/Kp), thermodynamics, buffer solutions, electrochemistry, titration curves, atomic structure.
2. Fizik I / Physics I (PNAP0123): Mechanics, rotational dynamics, torque, conservation laws, oscillations, waves, thermodynamics.
3. Biologi I / Biology I (PNAP0113): Cellular respiration (glycolysis, Krebs, ETC), photosynthesis, molecular genetics (DNA replication, transcription, translation), cell cycle, enzymes.
4. Statistik / Statistics (PNAP0154): Probability distributions (Binomial, Poisson, Normal), hypothesis testing, regression analysis, confidence intervals, sample variance.
5. Penaakulan Mantik / Logical Reasoning (PNAP0143): Propositional calculus, natural deduction proofs, truth tables, syllogisms, fallacy detection.
6. Apresiasi Bahasa dan Kesusasteraan / Language and Literary Appreciation (PNAP0162).
7. Pembangunan Jati Diri Kebangsaan (PNAP0172): Auditorium lecture series.
8. Kemahiran Penyelidikan / Research Skills (PNAP0182).

You also know the official assessment structure and UKM academic rules:
- Semester 1 GPA Policy: Calculates GPA using the 2 best science subjects (among Chemistry I, Physics I, Biology I) + Statistics (compulsory 4 credit hours) = 10 Credit Hours total.
- Grading scale: A (80-100, 4.00), A- (75-79, 3.67), B+ (70-74, 3.33), B (65-69, 3.00), B- (2.67), C+ (2.33), C (2.00), D (1.00), E (0.00). Dean's list criteria is GPA >= 3.75.
- Always provide clear, rigorous, educational responses with structured headings, bullet points, math formulas, and precise step-by-step working.
${formattedContext ? `Current User Context: ${formattedContext}` : ""}`;

    // Format conversation contents
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-8)) {
        contents.push({
          role: h.role === "assistant" || h.sender === "assistant" ? "model" : "user",
          parts: [{ text: h.content || h.text || "" }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    let replyText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      replyText = response.text || "";
    } catch (modelErr: any) {
      console.warn("gemini-3.1-flash-lite error, attempting gemini-3.8-flash:", modelErr?.message || modelErr);
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      replyText = fallbackResponse.text || "";
    }

    const reply = replyText || "PINTAR AI could not generate a response. Please try again.";
    return res.json({ reply });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate AI response",
    });
  }
};

app.post("/api/gemini/chat", handleGeminiChat);
app.post("/api/chat", handleGeminiChat);

// Gemini Summarize & Flashcard API
app.post("/api/gemini/summarize", async (req, res) => {
  try {
    const { title, courseCode, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required for summarization" });
    }

    const ai = getAIClient();
    const prompt = `Please summarize the following university academic lecture note / study topic:
Title: ${title || "Untitled Topic"}
Course Code: ${courseCode || "General"}
Content:
${content}

Provide a structured revision breakdown in clean markdown with:
1. 📌 **Core Concept & Definition** (1-2 sentences)
2. 🔑 **Key Takeaways & Formulas / Principles** (bullet points)
3. 🎯 **Common Exam Pitfalls & High-Yield Tips**
4. ❓ **3 Quick Self-Check Revision Questions with Answers**`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert university academic lecturer and revision coach.",
      },
    });

    return res.json({ summary: response.text || "Summary unavailable." });
  } catch (error: any) {
    console.error("Gemini Summarize Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to summarize content",
    });
  }
});

// Gemini Quiz Generator API
app.post("/api/gemini/quiz", async (req, res) => {
  try {
    const { topic, courseCode = "Academic" } = req.body;
    const ai = getAIClient();

    const prompt = `Generate a 3-question multiple-choice practice quiz for university students on the topic: "${topic || "Computer Science Fundamentals"}" in course "${courseCode}".
Return strictly a JSON array of objects with the exact schema:
[
  {
    "id": "q1",
    "question": "Clear question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this answer is correct."
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "[]");
    return res.json({ quiz: parsed });
  } catch (error: any) {
    console.error("Gemini Quiz Error:", error);
    // Fallback quiz if error
    return res.json({
      quiz: [
        {
          id: "q1",
          question: `What is a primary characteristic of ${req.body.topic || "this topic"}?`,
          options: [
            "Optimizes computational or organizational efficiency",
            "Eliminates all runtime requirements",
            "Applies only to single-threaded executions",
            "Deprecates relational constraints",
          ],
          correctIndex: 0,
          explanation: "Standard foundational principle in university academic curriculum.",
        },
      ],
    });
  }
});

// Vite Middleware for Dev, Static serving for Production
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PINTAR@Sphere] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
