require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const { createSession, resetSession, getHistory, sendMessage, saveUserEmail } = require("./chatService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Create session
app.post("/chat/session", (req, res) => {
  const sessionId = createSession();
  res.json({ status: "ok", sessionId });
});

// Save user email
app.post("/chat/email", (req, res) => {
  const { sessionId, email } = req.body;
  if (!sessionId || !email) {
    return res.status(400).json({ status: "error", message: "sessionId and email are required" });
  }
  const ok = saveUserEmail(sessionId, email);
  res.json({ status: ok ? "ok" : "not_found", sessionId });
});

// Send message
app.post("/chat/message", async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ status: "error", message: "message is required" });
    }

    const result = await sendMessage(sessionId, message);
    res.json({ status: "ok", sessionId: result.sessionId, reply: result.reply });
  } catch (err) {
    console.error("Message endpoint error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get history
app.get("/chat/history", (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId)
    return res.status(400).json({ status: "error", message: "sessionId is required" });
  res.json({ status: "ok", history: getHistory(sessionId) });
});

// Reset session
app.post("/chat/reset", (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ status: "error", message: "sessionId is required" });
  const ok = resetSession(sessionId);
  res.json({ status: ok ? "ok" : "not_found" });
});

app.listen(PORT, () => {
  console.log(`BelowMSRP Chatbot running at http://localhost:${PORT}`);
})
;