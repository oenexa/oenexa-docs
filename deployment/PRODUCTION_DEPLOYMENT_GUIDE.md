# OENEXA AI — Production Deployment & Real Scenario Guide

> **Target Goal:** Enable genuine live AI intelligence (equivalent to Anthropic Claude, OpenAI GPT-4o, and DeepSeek) and provide the exact production deployment pipeline for upcoming launch.

---

## 1. Why Was It Not Working Like Claude or Live AI Previously?

### The Root Cause:
1. **Fallback to Offline Templates:** The application previously relied exclusively on a local Ollama daemon at `http://localhost:11434`. When Ollama was not installed, not running, or had no models downloaded, the system caught the connection timeout and fell back to static synthetic templates (`ChatResponseSynthesisEngine` and `scenarioResponseEngine`).
2. **Missing Live Cloud Gateway:** The backend lacked direct live API integrations for Anthropic Claude, OpenAI, DeepSeek, and Google Gemini.
3. **Simulated Swarm Threads:** The multi-agent virtual thread orchestrator ran with simulated execution delays rather than querying live LLM models per agent persona.

---

## 2. What We Have Built to Fix It

### 1. Universal Live LLM Gateway (`OenexaLiveLlmGatewayService.java`)
We engineered a live multi-provider gateway using standard non-blocking `java.net.http.HttpClient` with zero framework lock-in. It directly communicates with:
* **Anthropic Claude API:** `https://api.anthropic.com/v1/messages` (Claude 3.5 Sonnet)
* **OpenAI API:** `https://api.openai.com/v1/chat/completions` (GPT-4o, o3-mini)
* **DeepSeek API:** `https://api.deepseek.com/chat/completions` (DeepSeek V3, DeepSeek R1)
* **Google Gemini API:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash`
* **Local/Self-Hosted Ollama:** `http://localhost:11434/api/generate` (DeepSeek-R1 8B, Llama 3.3)

### 2. Live Agent Virtual Thread Execution
In [`OenexaAgentThreadOrchestratorService.java`](file:///C:/workspace/oenexarepo/oenexa-ai-core/application/src/main/java/com/oenexa/application/OenexaAgentThreadOrchestratorService.java), each specialized virtual thread (`ARCHITECT`, `SOFTWARE_ENGINEER`, `SECURITY`, `QA`, `DEVOPS`, `DATA_ENGINEER`) now submits its specific persona prompt directly to the live gateway, generating genuine technical blueprints and code for the user's specific goal.

---

## 3. How to Make It Work in Real Scenarios (Recommendations)

To make OENEXA AI generate real-time intelligent responses like Claude:

### Option A: Use a Live Cloud API Key (Recommended for Quickest Cloud Deployment)
Set **at least one** of the following environment variables:

```bash
# For Anthropic Claude 3.5 Sonnet (Best for Architecture, PRDs, and Code):
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# OR for OpenAI GPT-4o:
export OPENAI_API_KEY="sk-proj-..."

# OR for DeepSeek V3 / R1 (Extremely Cost-Effective & Powerful):
export DEEPSEEK_API_KEY="sk-..."

# OR for Google Gemini 2.5 Flash (Ultra-Fast):
export GEMINI_API_KEY="AIzaSy..."
```

### Option B: Use Local Sovereign AI via Ollama (100% Free & Air-Gapped)
If you want zero cloud dependencies and 100% private execution:
1. Install Ollama from [ollama.com](https://ollama.com).
2. Pull the model:
   ```bash
   ollama run deepseek-r1:8b
   # or
   ollama run llama3.3
   ```
3. OENEXA AI automatically connects to Ollama on `http://localhost:11434` with zero configuration needed.

---

## 4. Production Deployment Pipeline (Step-by-Step)

We have created the full production deployment stack in [`docker-compose.prod.yml`](file:///C:/workspace/oenexarepo/docker-compose.prod.yml).

### Step 1: Prepare Environment File
```bash
cd C:\workspace\oenexarepo
cp .env.production.example .env.production
```
Edit `.env.production` and paste your `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` or `DEEPSEEK_API_KEY`.

### Step 2: Build and Launch Containers
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

This starts:
1. `oenexa-postgres`: PostgreSQL 17 + pgvector on `:5432`
2. `oenexa-redis`: Redis 7 on `:6379`
3. `oenexa-ai-core`: Java 25 Virtual Thread backend on `:8080`
4. `oenexa-ai-web`: Production Nginx web frontend on `:5173` and `:80`

### Step 3: Verify Health Probes
```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check backend health
curl http://localhost:8080/actuator/health
```

### Step 4: Access the Live Platform
* **Web UI:** Open `http://localhost:5173` (or `http://localhost` if using port 80).
* **API Documentation:** `http://localhost:8080/swagger-ui.html`.
* **Swarm Orchestrator:** Navigate to `⚡ Swarm Threads` in the web cockpit.
