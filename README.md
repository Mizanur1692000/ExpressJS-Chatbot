🚀 1. Introduction

The Car Marketplace Chatbot is an AI-powered conversational assistant designed for a car marketplace website. It acts as a virtual customer support agent that can engage users in natural conversation, provide company-related information, and assist with queries about cars and services.

The system integrates:

LangChain → for structured prompt chaining and chat history management.

Gemini API → as the large language model (LLM) backend.

Express.js → for REST API and server routing.

HTML/CSS/JS → for a simple frontend UI.

This chatbot simulates how an intelligent assistant would interact with users on a car marketplace platform.

⚙️ 2. Objectives

Build an AI chatbot capable of understanding user input and responding naturally.

Integrate Google Gemini API via LangChain for high-quality language generation.

Maintain conversational context using in-memory chat history.

Automatically reset chat history upon server restart.

Provide clear REST API endpoints for future frontend integration.

Include a simple HTML interface for testing and demonstration.

🏗️ 3. Project Architecture
🧩 Overview Diagram
            ┌──────────────────────┐
            │     User / Client    │
            │  (Browser / Next.js) │
            └──────────┬───────────┘
                       │ HTTP Request (JSON)
                       ▼
               ┌───────────────┐
               │  Express.js   │
               │   index.js    │
               └──────┬────────┘
                      │
                      ▼
             ┌────────────────┐
             │ chatService.js │
             │ LangChain Flow │
             └──────┬─────────┘
                    │
                    ▼
          ┌──────────────────────┐
          │ Gemini API (LLM)     │
          │ Text Generation      │
          └──────────────────────┘

🧠 4. Components Description
File	Purpose
index.js	Main Express server — defines routes, handles requests, connects to chat logic
chatService.js	Contains LangChain + Gemini integration, manages chat history
systemPrompt.js	Contains a detailed company profile (used as the system prompt)
public/index.html	Simple frontend to test chatbot interaction
.env	Stores secret Gemini API key
package.json	Project configuration and dependencies
README.md	Developer documentation and setup guide
🧩 5. Functionality Overview
Functionality	Description
Conversational Chat	Users can chat freely; the chatbot replies naturally.
System Prompt Context	The chatbot behaves like a customer support agent of a fictional car company (AutoGalaxy).
In-memory Chat History	Each user session maintains context until the page is refreshed or server restarts.
Session Reset	Sessions are cleared automatically on server restart or manually via /chat/reset.
API Communication	REST API endpoints allow message exchange with frontend or external services.
Frontend UI	Simple HTML-based UI for chat testing (no framework required).
💬 6. Communication Flow Between Components
Step-by-Step Request Cycle:

User Interaction:

The user types a message in the chat window (index.html).

The frontend sends an HTTP POST request to /chat/message.

Server Receives Request:

index.js receives the request.

Extracts sessionId and message from the body.

Processing Chat via LangChain:

index.js calls getChatResponse(sessionId, message) in chatService.js.

LangChain builds a prompt:

System message (from systemPrompt.js)

Conversation history (previous messages)

User’s new message.

Gemini API Call:

LangChain sends the structured prompt to Gemini API.

Gemini generates a natural, context-aware response.

Response Handling:

The generated text is returned to index.js.

Express sends the response back to the frontend as JSON.

Frontend Display:

The response is displayed as a chat bubble under the bot’s name.

The conversation continues until the user ends or reloads the page.

🧩 7. API Endpoints and Communication
1️⃣ POST /chat/session

Creates a new chat session.

Request:

{}


Response:

{
  "status": "ok",
  "sessionId": "3c9e2b7b-bbc2-43c9-88df-7cc5f2b20f14"
}

2️⃣ POST /chat/message

Sends a message and gets a response from the bot.

Request:

{
  "sessionId": "3c9e2b7b-bbc2-43c9-88df-7cc5f2b20f14",
  "message": "What are your latest SUV offers?"
}


Response:

{
  "status": "ok",
  "sessionId": "3c9e2b7b-bbc2-43c9-88df-7cc5f2b20f14",
  "reply": "Currently, AutoGalaxy offers three new SUVs — Galaxy X5, Aurora V8, and Stellar ZR..."
}

3️⃣ POST /chat/reset

Resets (clears) a specific session’s history.

Request:

{
  "sessionId": "3c9e2b7b-bbc2-43c9-88df-7cc5f2b20f14"
}


Response:

{
  "status": "ok",
  "message": "Session reset successfully."
}

4️⃣ GET /chat/history/:sessionId

Retrieves a specific session’s stored messages.

Example:

GET /chat/history/3c9e2b7b-bbc2-43c9-88df-7cc5f2b20f14


Response:

{
  "sessionId": "3c9e2b7b-bbc2-43c9-88df-7cc5f2b20f14",
  "history": [
    { "role": "user", "content": "Hello!" },
    { "role": "ai", "content": "Hi! Welcome to AutoGalaxy — your trusted car marketplace." }
  ]
}

🧰 8. Key Libraries and Their Roles
Library	Purpose
Express.js	Backend server and routing
LangChain	Chaining prompts, managing memory, integrating Gemini
@langchain/google-genai	Google Gemini model interface
dotenv	Loads environment variables from .env
body-parser	Parses incoming JSON request bodies
uuid	Generates unique session IDs
💡 9. Environment Configuration

Your .env file:

GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000

🧪 10. Frontend Interaction (Simple HTML UI)

public/index.html uses:

Fetch API → sends user messages to /chat/message

DOM manipulation → displays chat bubbles dynamically

Session ID persistence → keeps conversation continuous in the same browser tab

Communication is done purely via HTTP POST requests — easily portable to a Next.js frontend later.

🧩 11. Example Conversation

User:

Hello, what services does AutoGalaxy provide?

Bot:

Hello! AutoGalaxy offers a wide range of car services — from buying and selling vehicles to test drives, insurance, and maintenance packages.

User:

Can I book a test drive?

Bot:

Absolutely! Just tell me which car model you’re interested in, and I can guide you through our test drive booking process.

⚙️ 12. Running the Application

1️⃣ Install dependencies

npm install


2️⃣ Add your .env file

GEMINI_API_KEY=your_key_here


3️⃣ Start the server

node index.js


4️⃣ Open your browser:

http://localhost:3000

🔍 13. Internal Logic Summary
Step	Component	Task
1	index.js	Receives user input via API
2	chatService.js	Builds prompt with history + system prompt
3	LangChain	Formats and manages chat messages
4	Gemini API	Generates response text
5	chatService.js	Updates session memory
6	index.js	Returns response as JSON
7	public/index.html	Displays message visually