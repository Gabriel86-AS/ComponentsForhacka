import "dotenv/config";
import express from "express";
import { streamText, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/* ------------------------------------------------------------------ */
/*  Load JSON data once at startup                                     */
/* ------------------------------------------------------------------ */
const __dirname = dirname(fileURLToPath(import.meta.url));
const mockData = JSON.parse(
  readFileSync(join(__dirname, "../Data/mock_data.json"), "utf-8")
);

/* ------------------------------------------------------------------ */
/*  Express setup                                                      */
/* ------------------------------------------------------------------ */
const app = express();
app.use(express.json());

/* ------------------------------------------------------------------ */
/*  POST /api/chat                                                     */
/* ------------------------------------------------------------------ */
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, system, model, excelData } = req.body;

    const activeData = Array.isArray(excelData) && excelData.length > 0 ? excelData : mockData;

    // Merge the JSON data context with any persona-level system prompt from the frontend
    const dataContext = `\
You have access to the following store data in JSON format. Use it to answer questions accurately.

<store_data>
${JSON.stringify(activeData, null, 2)}
</store_data>
`;

    const fullSystem = dataContext + (system ? `\n\n${system}` : "");

    const result = streamText({
      model: anthropic(model ?? "claude-haiku-4-5"),
      system: fullSystem,
      messages: convertToModelMessages(messages),
    });

    result.pipeUIMessageStreamToResponse(res);
  } catch (err) {
    console.error("[/api/chat] Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/* ------------------------------------------------------------------ */
/*  404 + error handler                                                */
/* ------------------------------------------------------------------ */
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[server] Unhandled error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  Start                                                              */
/* ------------------------------------------------------------------ */
const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`✅ API server listening on http://localhost:${PORT}`);
});
