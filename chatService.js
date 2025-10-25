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
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
      <!--[if !mso]><!-->
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <!--<![endif]-->
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #f5f5f5;
          padding: 40px 20px;
          min-height: 100vh;
          margin: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        table {
          border-collapse: collapse;
          border-spacing: 0;
        }
        
        img {
          border: 0;
          outline: none;
          text-decoration: none;
          display: block;
        }
        
        .email-wrapper {
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
        }
        
        .email-container {
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          width: 100%;
        }
        
        .header {
          background: #2563eb;
          padding: 40px 45px;
          position: relative;
          border-bottom: 1px solid #dbeafe;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        
        .logo-section {
          display: table;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        
        .logo-text {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.3px;
          line-height: 1.2;
        }
        
        .logo-below {
          color: #ffffff;
        }
        
        .logo-msrp {
          color: #93c5fd;
        }
        
        .alert-badge {
          display: inline-block;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          color: #92400e;
          padding: 6px 14px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }
        
        .header h1 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          position: relative;
          z-index: 1;
          letter-spacing: -0.3px;
          line-height: 1.4;
        }
        
        .header-subtitle {
          color: #dbeafe;
          font-size: 14px;
          margin-top: 8px;
          position: relative;
          z-index: 1;
          font-weight: 400;
          line-height: 1.5;
        }
        
        .content {
          padding: 40px 45px;
          background: #ffffff;
        }
        
        .intro-text {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.7;
          margin-bottom: 28px;
          font-weight: 400;
        }
        
        .info-card {
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          width: 100%;
        }
        
        .info-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .info-row {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          font-weight: 600;
          color: #6b7280;
          padding: 16px 20px;
          background: #f3f4f6;
          width: 160px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          vertical-align: top;
          border-right: 1px solid #e5e7eb;
        }
        
        .info-value {
          color: #1f2937;
          padding: 16px 20px;
          font-size: 14px;
          line-height: 1.7;
          word-break: break-word;
          font-weight: 400;
          vertical-align: top;
        }
        
        .alert-box {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          border-radius: 6px;
          margin-bottom: 28px;
        }
        
        .alert-icon {
          font-size: 24px;
          line-height: 1;
          margin-bottom: 10px;
          display: block;
        }
        
        .alert-text {
          font-size: 14px;
          color: #78350f;
          line-height: 1.6;
        }
        
        .alert-text strong {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #78350f;
          font-weight: 600;
        }
        
        .footer {
          background: #f9fafb;
          padding: 32px 45px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        
        .divider {
          width: 60px;
          height: 2px;
          background: #d1d5db;
          border-radius: 2px;
          margin: 0 auto 16px;
        }
        
        .footer-text {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          line-height: 1.6;
          font-weight: 400;
        }
        
        .brand-name {
          color: #2563eb;
          font-weight: 600;
        }
        
        /* Mobile-specific styles */
        @media only screen and (max-width: 600px) {
          body {
            padding: 20px 10px !important;
          }
          
          .email-container {
            border-radius: 16px !important;
          }
          
          .header, .content, .footer {
            padding: 32px 20px !important;
          }
          
          .info-label {
            display: block !important;
            width: 100% !important;
            border-right: none !important;
            border-bottom: 2px solid rgba(16, 185, 129, 0.25) !important;
            padding: 18px 20px !important;
          }
          
          .info-value {
            display: block !important;
            width: 100% !important;
            padding: 18px 20px !important;
          }
          
          .header h1 {
            font-size: 28px !important;
          }
          
          .logo-text {
            font-size: 22px !important;
          }
          
          .alert-box {
            padding: 20px !important;
          }
        }
        
        /* Android-specific fixes */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          body {
            -webkit-text-size-adjust: 100%;
          }
        }
        
        /* Force table display on mobile */
        @media only screen and (max-width: 480px) {
          .info-table,
          .info-row,
          .info-label,
          .info-value {
            display: block !important;
            width: 100% !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding: 0;">
            <table role="presentation" class="email-wrapper" width="680" cellpadding="0" cellspacing="0" border="0" style="max-width: 680px; width: 100%;">
              <tr>
                <td class="email-container" style="background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
                  
                  <!-- Header -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td class="header" style="padding: 40px 45px; background: #2563eb; border-bottom: 1px solid #dbeafe;">
                        <div class="logo-section">
                          <div class="logo-text">
                            <span class="logo-below" style="color: #ffffff;">Below</span><span class="logo-msrp" style="color: #93c5fd;">MSRP</span>
                          </div>
                        </div>
                        <div class="alert-badge" style="display: inline-block; background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; padding: 6px 14px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-bottom: 16px;">
                          🚨 PRIORITY ALERT
                        </div>
                        <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0; line-height: 1.4;">Unrelated Query Detection Alert</h1>
                        <p class="header-subtitle" style="color: #dbeafe; font-size: 14px; margin-top: 8px; font-weight: 400;">System Notification · Chatbot Monitoring</p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Content -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td class="content" style="padding: 40px 45px; background: #ffffff;">
                        <p class="intro-text" style="font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 28px 0;">
                          A user query has been flagged by the BelowMSRP chatbot system as falling outside the defined service parameters. Your review and assessment are requested to determine the appropriate course of action.
                        </p>
                        
                        <!-- Info Card -->
                        <table role="presentation" class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f9fafb; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                          <tr class="info-row">
                            <td class="info-label" style="font-weight: 600; color: #6b7280; padding: 16px 20px; background: #f3f4f6; width: 160px; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
                              USER EMAIL
                            </td>
                            <td class="info-value" style="color: #1f2937; padding: 16px 20px; font-size: 14px; line-height: 1.7; word-break: break-word; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
                              ${userEmail}
                            </td>
                          </tr>
                          <tr class="info-row">
                            <td class="info-label" style="font-weight: 600; color: #6b7280; padding: 16px 20px; background: #f3f4f6; width: 160px; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
                              USER MESSAGE
                            </td>
                            <td class="info-value" style="color: #1f2937; padding: 16px 20px; font-size: 14px; line-height: 1.7; word-break: break-word; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
                              ${userMessage}
                            </td>
                          </tr>
                          <tr class="info-row">
                            <td class="info-label" style="font-weight: 600; color: #6b7280; padding: 16px 20px; background: #f3f4f6; width: 160px; font-size: 11px; text-transform: uppercase; vertical-align: top;">
                              TIMESTAMP
                            </td>
                            <td class="info-value" style="color: #1f2937; padding: 16px 20px; font-size: 14px; line-height: 1.7; word-break: break-word; vertical-align: top;">
                              ${new Date().toLocaleString()}
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Alert Box -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td class="alert-box" style="background: #fffbeb; border: 1px solid #fcd34d; padding: 20px; border-radius: 6px; margin-bottom: 28px; border-left: 4px solid #f59e0b;">
                              <span class="alert-icon" style="font-size: 24px; display: block; margin-bottom: 10px;">⚠️</span>
                              <div class="alert-text" style="font-size: 14px; color: #78350f; line-height: 1.6;">
                                <strong style="display: block; margin-bottom: 8px; font-size: 14px; color: #78350f; font-weight: 600;">Administrative Action Required</strong>
                                Please evaluate this query and contact the user if necessary. Assessment should include whether this indicates a service coverage gap or represents a potential enhancement opportunity for the platform.
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Footer -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td class="footer" style="background: #f9fafb; padding: 32px 45px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <div class="divider" style="width: 60px; height: 2px; background: #d1d5db; border-radius: 2px; margin: 0 auto 16px;"></div>
                        <p class="footer-text" style="font-size: 13px; color: #6b7280; margin: 0; line-height: 1.6;">
                          &copy; ${new Date().getFullYear()} <span class="brand-name" style="color: #2563eb; font-weight: 600;">BelowMSRP</span> • All Rights Reserved<br>
                          Automated Notification System • This is an unmonitored mailbox
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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

