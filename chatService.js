// chatService.js
require('dotenv').config();
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} = require("@langchain/core/prompts");

const { SYSTEM_PROMPT } = require("./systemPrompt");

// In-memory stores
const sessionHistories = new Map();
const userEmails = new Map(); // sessionId -> user email

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_APP_PASSWORD,
  },
});

// Lazy model
let modelInstance = null;
function getModel() {
  if (modelInstance) return modelInstance;
  modelInstance = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0.6,
  });
  return modelInstance;
}

// Create session
function createSession() {
  const id = uuidv4();
  sessionHistories.set(id, []);
  return id;
}

// Reset session
function resetSession(sessionId) {
  if (!sessionHistories.has(sessionId)) return false;
  sessionHistories.set(sessionId, []);
  return true;
}

// Get history
function getHistory(sessionId) {
  return sessionHistories.get(sessionId) || [];
}

// Save user email
function saveUserEmail(sessionId, email) {
  if (!sessionId) return false;
  userEmails.set(sessionId, email);
  return true;
}

// Send admin email
async function sendEmailToAdmin(userMessage, sessionId) {
  const userEmail = userEmails.get(sessionId) || "Unknown User";
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: "🚨 BelowMSRP Chatbot: Unrelated Query Alert",
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #0a4d3c 0%, #0d3d56 100%);
          padding: 40px 20px;
          min-height: 100vh;
        }
        
        .email-wrapper {
          max-width: 680px;
          margin: 0 auto;
        }
        
        .email-container {
          background: rgba(15, 50, 45, 0.95);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4), 0 0 80px rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .header {
          background: linear-gradient(135deg, rgba(5, 150, 105, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%);
          padding: 48px 45px;
          position: relative;
          border-bottom: 1px solid rgba(16, 185, 129, 0.3);
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        
        .logo-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #059669 0%, #06b6d4 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        
        .logo-text {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        
        .logo-below {
          color: #e0f2f1;
        }
        
        .logo-msrp {
          color: #10b981;
        }
        
        .alert-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(248, 113, 113, 0.4);
          color: #fca5a5;
          padding: 10px 18px;
          border-radius: 24px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
          backdrop-filter: blur(10px);
        }
        
        .alert-badge::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
          animation: blink 2s ease-in-out infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        
        .header h1 {
          color: #e0f2f1;
          font-size: 34px;
          font-weight: 800;
          margin: 0;
          position: relative;
          z-index: 1;
          letter-spacing: -0.8px;
          line-height: 1.2;
        }
        
        .header-subtitle {
          color: #a7f3d0;
          font-size: 15px;
          margin-top: 10px;
          position: relative;
          z-index: 1;
          font-weight: 500;
        }
        
        .content {
          padding: 45px;
          background: rgba(10, 40, 35, 0.4);
        }
        
        .intro-text {
          font-size: 15px;
          color: #d1fae5;
          line-height: 1.8;
          margin-bottom: 32px;
          font-weight: 400;
        }
        
        .info-card {
          background: rgba(5, 150, 105, 0.08);
          border-radius: 16px;
          padding: 0;
          margin-bottom: 28px;
          border: 1px solid rgba(16, 185, 129, 0.25);
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        
        .info-row {
          display: flex;
          border-bottom: 1px solid rgba(16, 185, 129, 0.2);
          transition: all 0.2s ease;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-row:hover {
          background: rgba(5, 150, 105, 0.12);
        }
        
        .info-label {
          font-weight: 700;
          color: #6ee7b7;
          padding: 22px 26px;
          background: rgba(5, 150, 105, 0.1);
          min-width: 170px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          border-right: 2px solid rgba(16, 185, 129, 0.25);
        }
        
        .info-label::before {
          content: '';
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          margin-right: 12px;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }
        
        .info-value {
          color: #e0f2f1;
          padding: 22px 26px;
          font-size: 15px;
          line-height: 1.7;
          flex: 1;
          word-break: break-word;
          font-weight: 500;
        }
        
        .alert-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.12) 100%);
          border: 2px solid rgba(251, 191, 36, 0.4);
          padding: 26px;
          border-radius: 14px;
          margin-bottom: 32px;
          position: relative;
          backdrop-filter: blur(10px);
        }
        
        .alert-box::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #f59e0b;
          border-radius: 14px 0 0 14px;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);
        }
        
        .alert-box-content {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        
        .alert-icon {
          font-size: 26px;
          flex-shrink: 0;
          line-height: 1;
        }
        
        .alert-text {
          font-size: 14px;
          color: #fde68a;
          line-height: 1.7;
        }
        
        .alert-text strong {
          display: block;
          margin-bottom: 6px;
          font-size: 15px;
          color: #fef3c7;
          font-weight: 700;
        }
        
        .footer {
          background: rgba(5, 150, 105, 0.08);
          padding: 36px 45px;
          text-align: center;
          border-top: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .divider {
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%);
          border-radius: 2px;
          margin: 0 auto 20px;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }
        
        .footer-text {
          font-size: 13px;
          color: #a7f3d0;
          margin: 0;
          line-height: 1.8;
          font-weight: 500;
        }
        
        .brand-name {
          color: #10b981;
          font-weight: 700;
          text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }
        
        @media only screen and (max-width: 600px) {
          body {
            padding: 20px 10px;
          }
          
          .email-container {
            border-radius: 16px;
          }
          
          .header, .content, .footer {
            padding: 32px 28px;
          }
          
          .info-row {
            flex-direction: column;
          }
          
          .info-label {
            min-width: 100%;
            border-right: none;
            border-bottom: 2px solid rgba(16, 185, 129, 0.25);
          }
          
          .header h1 {
            font-size: 28px;
          }
          
          .logo-text {
            font-size: 22px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          <div class="header">
            <div class="logo-section">
              <div class="logo-text">
                <span class="logo-below">Below</span><span class="logo-msrp">MSRP</span>
              </div>
            </div>
            <div class="alert-badge">Priority Alert</div>
            <h1>Unrelated Query Detected</h1>
            <p class="header-subtitle">Chatbot System Notification</p>
          </div>
          
          <div class="content">
            <p class="intro-text">
              Our chatbot system has identified a user query that falls outside the scope of BelowMSRP's car marketplace services. Please review the following details and determine if follow-up action is required.
            </p>
            
            <div class="info-card">
              <div class="info-row">
                <div class="info-label">User Email</div>
                <div class="info-value">${userEmail}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">User Message</div>
                <div class="info-value">${userMessage}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Timestamp</div>
                <div class="info-value">${new Date().toLocaleString()}</div>
              </div>
            </div>
            
            <div class="alert-box">
              <div class="alert-box-content">
                <div class="alert-icon">⚠️</div>
                <div class="alert-text">
                  <strong>Action Required</strong>
                  Please review this query and contact the user if necessary. Consider whether this represents a gap in our service coverage or a potential feature enhancement opportunity.
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="divider"></div>
            <p class="footer-text">
              &copy; ${new Date().getFullYear()} <span class="brand-name">BelowMSRP</span> • All rights reserved<br>
              Automated Alert System • Do Not Reply
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("📧 Admin email sent successfully.");
  } catch (error) {
    console.error("❌ Failed to send admin email:", error.message);
  }
}

// Send message
async function sendMessage(sessionId, userMessage) {
  if (!sessionId) {
    sessionId = createSession();
  }
  if (!sessionHistories.has(sessionId)) {
    sessionHistories.set(sessionId, []);
  }

  sessionHistories.get(sessionId).push({ role: "user", content: userMessage });

  const formattedHistory = (sessionHistories.get(sessionId) || []).map((m) => ({
    role: m.role === "user" ? "human" : "ai",
    content: m.content,
  }));

  const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(SYSTEM_PROMPT),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
  ]);

  try {
    const model = getModel();
    const pipeline = prompt.pipe(model);
    const result = await pipeline.invoke({ history: formattedHistory, input: userMessage });

    let assistantText =
      typeof result === "string"
        ? result
        : result?.text || result?.output || JSON.stringify(result);

    sessionHistories.get(sessionId).push({ role: "assistant", content: assistantText });

        // Detect unrelated query (case-insensitive)
    if (/\[admin\s*email\s*alert/i.test(assistantText)) {
      await sendEmailToAdmin(userMessage, sessionId);
      }

    return { sessionId, reply: assistantText };
  } catch (err) {
    console.error("sendMessage error:", err);
    const errMsg = `Sorry, I encountered an error: ${err?.message}`;
    sessionHistories.get(sessionId).push({ role: "assistant", content: errMsg });
    return { sessionId, reply: errMsg, error: String(err) };
  }
}

module.exports = {
  createSession,
  resetSession,
  getHistory,
  sendMessage,
  saveUserEmail,
};

