# 🌡️ IoT Temp Watch

A full-stack mini project that retrieves real-time temperature data from a public sensor API and displays it on a modern dashboard with AI-powered chat capabilities.

> ⏱ Designed as a 2-day technical challenge for junior or technician-level developers.

---

## Project Goal

Build a small IoT-enabled web app that:
- Retrieves temperature or humidity data from a public sensor API
- Stores and exposes the data via a backend service
- Displays the data in real time or at regular intervals via a frontend interface
- **🤖 NEW: AI-powered chatbot with RAG capabilities for weather data analysis**
- Implements IoT best practices and security measures

## 🤖 AI Chatbot Feature

### RAG-Powered Weather Analysis
Intelligent chatbot that analyzes historical temperature data using Retrieval-Augmented Generation:

**Key Capabilities:**
- Natural language queries about weather patterns
- Statistical analysis of temperature trends
- Comparative analysis between time periods
- Anomaly detection and insights

**Example Queries:**
- "What was the average temperature last week?"
- "Were there any temperature anomalies this month?"
- "Compare January and February temperatures"
- "Show me the 30-day temperature trend"

**Tech Stack:**
- **Backend**: Sentence-Transformers embeddings, ChromaDB vector store
- **LLM**: OpenAI GPT or Hugging Face models
- **Frontend**: React chat interface with real-time WebSocket

---

## TODO – Practical Tasks

- Analyze existing code to understand its structure and logic
- Review a pull request, leaving at least one meaningful comment in English
- Submit a small technical implementation via a pull request (PR)
- Create a clear and relevant GitHub Issue, describing a problem or suggesting an improvement

---

## ⚙️ Stack Suggestions

### Backend
- Python (Flask)
- SQLite3 for persistence
- **AI**: Sentence-Transformers, ChromaDB, OpenAI/Hugging Face

### Frontend
- React (preferred)
- **Chat UI**: Tailwind CSS, Framer Motion, Socket.IO

### Optional
- WebSocket for real-time updates
- Docker/Docker Compose
- GitHub Actions CI

---

## 🌐 Data Source

Use one of the following free/public sensor APIs:
- [Open-Meteo API](https://open-meteo.com/en/docs)
- [ThingSpeak](https://thingspeak.com/)
- Any dummy IoT API or mock sensor server

---

## ✅ Assessment Criteria

| Category | Details |
|----------|---------|
| 🎨 **Figma Design** | Propose or improve a design in Figma |
| 🏗 **Project Setup** | Proper use of JHipster to scaffold and configure the app |
| 🔒 **Authentication** | Secure login system using JWT and protected API routes |
| 💻 **Frontend** | Functional React UI with proper state handling |
| 🤖 **AI Integration** | RAG chatbot implementation and natural language processing |
| 📦 **API Usage** | Clean and secure usage of RESTful APIs |
| 🧼 **Code Quality** | Maintainable, modular, and readable code |
| 🔁 **Git Practices** | Git flow, meaningful commits, and clean pull requests |

## Evaluation Criteria
| Area | Importance |
|------|------------|
| Git usage | ★★★★☆ |
| Backend functionality | ★★★★☆ |
| Frontend UX | ★★★★☆ |
| **AI/RAG Implementation** | ★★★★☆ |
| Code quality | ★★★★☆ |
| Documentation | ★★★★☆ |
| IoT Integration | ★★★★☆ |
| Bonus features | ★★☆☆☆ |

---

## 🚀 Quick Setup

### Backend Setup
1. **Python Environment**
   ```bash
   python3.10 -m venv iot-env
   # Windows: iot-env\Scripts\activate
   # Linux/Mac: source iot-env/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Environment Variables** (`.env`)
   ```
   PORT=5000
   DATABASE_PATH=temperature.db
   DEBUG=True
   OPENAI_API_KEY=your_openai_key  # For AI features
   ```

4. **Run Backend**
   ```bash
   python app.py
   ```

### Frontend Setup
1. **Install Dependencies**
   ```bash
   cd frontend/ReactApp
   npm install
   ```

2. **Environment Variables** (`.env.local`)
   ```
   VITE_API_URL=https://api.open-meteo.com/v1/forecast
   VITE_API_BASE_URL=http://localhost:5000
   ```

3. **Run Frontend**
   ```bash
   npm run dev
   ```

---

## 📡 API Endpoints

### Weather Data
- `GET /data/latest` – Get latest temperature with trend
- `GET /data/history` – Get temperature history

### AI Chatbot
- `POST /api/chat/message` – Send message to chatbot
- `GET /api/chat/history` – Get chat history
- `WebSocket /chat` – Real-time chat connection

---

## 🏗️ Project Structure

```
iot-temp-watch/
├── backend/
│   ├── services/
│   │   ├── chatbot/
│   │   │   ├── rag_engine.py      # RAG implementation
│   │   │   ├── embeddings.py      # Vector embeddings
│   │   │   └── llm_interface.py   # LLM integration
│   │   └── weather_fetcher.py
│   └── app.py
├── frontend/
│   └── ReactApp/
│       ├── components/
│       │   ├── ChatBot/
│       │   │   ├── ChatInterface.jsx
│       │   │   └── MessageBubble.jsx
│       │   └── Dashboard/
│       └── hooks/
└── README.md
```

---

## 🎯 Getting Started

1. **Fork** this repository
2. **Clone** your fork locally
3. Follow the **Quick Setup** instructions
4. Implement the **TODO tasks**
5. Submit your **pull request**

Good luck! 🚀
