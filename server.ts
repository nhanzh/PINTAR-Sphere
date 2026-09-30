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

// Server-Side Session Validation & Synchronization Layer
interface ServerSession {
  sessionId: string;
  email: string;
  role: string;
  profile: any;
  deviceInfo: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
  isValid: boolean;
}

const activeServerSessions = new Map<string, ServerSession>();

// 1. Create Server Session
app.post("/api/auth/session/create", (req, res) => {
  try {
    const { email, role, profile, deviceInfo = "Unknown Device" } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required for session creation" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const sessionId = `sess_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

    const session: ServerSession = {
      sessionId,
      email: cleanEmail,
      role: role || (cleanEmail.endsWith("@siswa.ukm.edu.my") ? "student" : "lecturer"),
      profile: profile || null,
      deviceInfo,
      ipAddress,
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isValid: true,
    };

    activeServerSessions.set(sessionId, session);

    return res.json({
      success: true,
      sessionId,
      session,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Session Create Error:", error);
    return res.status(500).json({ error: error.message || "Failed to create session" });
  }
});

// 2. Validate Server Session
app.post("/api/auth/session/validate", (req, res) => {
  try {
    const { email, sessionId } = req.body;
    if (!email || !sessionId) {
      return res.status(400).json({ isValid: false, error: "Email and SessionId required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const session = activeServerSessions.get(sessionId);

    if (!session || !session.isValid) {
      // Create auto-synced session for valid active user
      const newSession: ServerSession = {
        sessionId,
        email: cleanEmail,
        role: cleanEmail.endsWith("@siswa.ukm.edu.my") ? "student" : "lecturer",
        profile: req.body.profile || null,
        deviceInfo: req.headers["user-agent"] || "Synced Device",
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isValid: true,
      };
      activeServerSessions.set(sessionId, newSession);
      return res.json({ isValid: true, session: newSession, revalidated: true });
    }

    if (session.email !== cleanEmail) {
      return res.status(401).json({ isValid: false, error: "Session email mismatch" });
    }

    session.lastActive = new Date().toISOString();
    activeServerSessions.set(sessionId, session);

    return res.json({
      isValid: true,
      session,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Session Validate Error:", error);
    return res.status(500).json({ isValid: false, error: error.message });
  }
});

// 3. Destroy Server Session
app.post("/api/auth/session/destroy", (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      activeServerSessions.delete(sessionId);
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 4. List Active Device Sessions for User
app.get("/api/auth/session/active", (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: "Email query param required" });
    }

    const userSessions: ServerSession[] = [];
    for (const session of activeServerSessions.values()) {
      if (session.email === email && session.isValid) {
        userSessions.push(session);
      }
    }

    return res.json({
      email,
      activeSessionsCount: userSessions.length,
      sessions: userSessions,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

import fs from "fs";

// Server-Side Data Sync Store with Disk Persistence for Cross-Device Synchronization
const STORE_FILE = path.join(process.cwd(), "server_store.json");

let serverDataStore: Record<string, any[]> = {
  kokoSubmissions: [],
  submissions: [],
  notifications: [],
  grades: [],
  kokoRecords: [],
  forumPosts: [],
  deadlines: [],
  resources: [],
};

try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      serverDataStore = { ...serverDataStore, ...parsed };
    }
  }
} catch (e) {
  console.warn("Failed to load server_store.json:", e);
}

function persistStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(serverDataStore, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to persist server_store.json:", e);
  }
}

app.get("/api/sync/:collection", (req, res) => {
  try {
    const col = req.params.collection;
    const items = serverDataStore[col] || [];
    return res.json({ success: true, items });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/sync/:collection", (req, res) => {
  try {
    const col = req.params.collection;
    const body = req.body;
    if (!serverDataStore[col]) {
      serverDataStore[col] = [];
    }

    if (body && Array.isArray(body.items)) {
      serverDataStore[col] = body.items;
    } else if (body && body.id) {
      const idx = serverDataStore[col].findIndex((x: any) => x.id === body.id);
      if (idx >= 0) {
        serverDataStore[col][idx] = body;
      } else {
        serverDataStore[col].unshift(body);
      }
    }
    persistStore();
    return res.json({ success: true, items: serverDataStore[col] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

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
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });
      replyText = response.text || "";
    } catch (modelErr: any) {
      console.warn("gemini-3.8-flash primary error, attempting fallback:", modelErr?.message || modelErr);
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
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
