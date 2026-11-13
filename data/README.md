
# AgentX — AI Research Agent

AgentX is an AI-powered research assistant that investigates questions, searches the web, analyses information, verifies sources and generates structured research reports.

## Features

- AI-powered research planning
- Web search using Tavily
- AI analysis using Groq
- Automated research report generation
- Source verification
- Real-time research progress
- Server-Sent Events (SSE) streaming
- Research history using SQLite
- Agent execution logs
- Basic mathematical problem solving

## Tech Stack

**Frontend**
- HTML
- CSS
- JavaScript

**Backend**
- Python
- FastAPI
- Groq API
- Tavily Search API
- SQLite
- SymPy

## Project Structure

```text
AgentX/
├── backend/
│   ├── main.py
│   ├── agent.py
│   ├── tools.py
│   ├── verifier.py
│   ├── database.py
│   └── models.py
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── data/
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd AgentX
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate it on Windows

```bash
venv\Scripts\activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure API keys

Create a `.env` file in the project root.

Add your own API keys:

```env
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

### 6. Start the backend

```bash
python -m uvicorn backend.main:app --reload
```

### 7. Open the frontend

Use VS Code Live Server to open:

```text
frontend/index.html
```

## Security

Never upload your `.env` file or expose your API keys publicly.

## Project Status

Working MVP — UI, research pipeline, source verification, history and streaming tested.

## Author

AgentX Project
