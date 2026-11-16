# 🏛️ OENEXA ECOSYSTEM: AI AGENT & DEVELOPER MAPPING DIRECTORY

> **Workspace Root:** `C:\workspace\oenexarepo`  
> **Architecture Pattern:** Workspace Umbrella / Polyrepo Architecture  
> **GitHub Organization:** `github.com/oenexa`  
> **Status:** Synchronized & Verified  

---

## 🎯 Purpose & Conflict Prevention Guide

To prevent confusion, routing conflicts, and cross-contamination between AI agents and human developers, every repository in the `oenexarepo` workspace belongs to a clearly defined architectural pair with explicit symbolic roles.

---

## 🗺️ System Pairs & Symbolic Mapping

```
                                 [ OENEXA ECOSYSTEM ]
                                          │
       ┌──────────────────────────────────┼──────────────────────────────────┐
       │                                  │                                  │
       ▼                                  ▼                                  ▼
[ AI CORE & WEB STACK ]         [ BLOCKCHAIN SUITE ]              [ COMMERCE STACK ]
       │                                  │                                  │
  ⚡ CORE (BACKEND)                  ⛓️ ENGINE                          🍔 API
  oenexa-ai-core                    oenexa-node                        oengo-api
       ↕                                  ↕                                  ↕
  💻 WEB (FRONTEND)                  🔍 EXPLORER                        📱 WEB
  oenexa-ai-web                     oenexa-explorer                    oengo-web
```

---

## 📦 Explicit Pair Directory & Roles

### Pair 1: 🤖 OENEXA AI (AI Operating System Platform)

#### GitHub Repositories:
- **Backend:** `https://github.com/oenexa/oenexa-ai-core`
- **Frontend:** `https://github.com/oenexa/oenexa-ai-web`

#### Naming Conventions:
- **Product Name:** `OENEXA AI`
- **Backend Service Name:** `OENEXA AI Core` (`oenexa-ai-core`)
- **Frontend Application Name:** `OENEXA AI Web` (`oenexa-ai-web`)

| Component | Symbolic Role | Repository Directory | Stack & Framework | Primary Target |
|:---|:---|:---|:---|:---|
| **Core (Backend)** | `[AI-CORE] ⚡` | `oenexa-ai-core/` | Java 25, Spring Boot 4.1.1, Spring MVC REST | `http://localhost:8080/api` |
| **Web (Frontend)** | `[AI-WEB] 💻` | `oenexa-ai-web/` | React 18, Vite 5, TypeScript, Monaco Editor | `http://localhost:5173` |

#### Repository Definitions:

##### `oenexa-ai-core`
Primary backend repository containing:
- Authentication & Authorization
- AI Gateway
- LLM Integrations
- AI Agents (10-Agent Autonomous DAG Engine)
- RAG / Knowledge Base
- Memory System (7-Layer Memory Hierarchy & NVMe Context Cache)
- Billing & Stripe Subscriptions
- Admin APIs
- Notifications
- Core Business Logic (Hexagonal Clean Architecture)
- Database Migrations (PostgreSQL / Flyway)
- Security Layer (OWASP Compliance, Argon2id, RBAC)

##### `oenexa-ai-web`
Primary frontend repository containing:
- AI Chat Interface
- Agent Dashboard & Telemetry Modals
- Workspace Management
- Knowledge Base UI
- Billing Portal & Quota Gauges
- User Settings
- Administration Dashboard
- Responsive Web Application
- Dark / Light Theme
- Real-Time Communications (SSE Streams & WebSockets)

* **Relationship & Communication:**
  - `oenexa-ai-web` proxies all `/api/*` requests directly to `oenexa-ai-core` at `http://localhost:8080`.
  - The frontend features Monaco Code Editor, 10-Agent Autonomous DAG views, and 7-layer memory telemetry.
  - The backend provides clean hexagonal architecture: `domain`, `application`, `infrastructure` (PostgreSQL/H2, Redis), and `api` REST controllers.

---

### Pair 2: ⛓️ Blockchain & Ledger Platform (Consensus & Explorer)
| Component | Symbolic Role | Repository Directory | Stack & Framework | Primary Target |
|:---|:---|:---|:---|:---|
| **Core Engine** | `[CHAIN-NODE] ⛓️` | `oenexa-node/` | Go 1.26, libp2p, LevelDB, Wazero, NIST PQC | JSON-RPC on port `8545` |
| **Explorer** | `[CHAIN-UI] 🔍` | `oenexa-explorer/` | React 18, Vite 6, TypeScript, Tailwind CSS | `http://localhost:5173` |

* **Relationship & Communication:**
  - `oenexa-explorer` queries `oenexa-node` via JSON-RPC 2.0 at `http://localhost:8545` (`onxc_blockHeight`, `onxc_getBalance`, `onxc_chainInfo`, etc.).
  - `oenexa-node` is the quantum-resistant post-quantum consensus engine with ML-DSA-65 signatures, ML-KEM-768 key encapsulation, and EIP-1559 gas mechanics.

---

### Pair 3: 🛍️ OenGo D-Commerce & Banking System (Merchant & Delivery Platform)
| Component | Symbolic Role | Repository Directory | Stack & Framework | Primary Target |
|:---|:---|:---|:---|:---|
| **Backend API** | `[COMMERCE-BE] 🍔` | `oengo-api/` | Go 1.26, Gin Web Framework, GORM, PostgreSQL | `http://localhost:8081` |
| **Frontend Web** | `[COMMERCE-FE] 📱` | `oengo-web/` | Next.js 16, React 19, TypeScript, Tailwind CSS | `http://localhost:3000` |

* **Relationship & Communication:**
  - `oengo-web` connects directly to `oengo-api` (`NEXT_PUBLIC_API_URL=http://localhost:8081/api`).
  - Implements multi-role portals: Customer Storefront (`/`), Restaurant KDS Kitchen (`/restaurant`), Courier Rider App (`/courier`), and Customer KYC (`/kyc`).
  - Backend enforces double-entry banking ledgers (`debit == credit`), EU AMLD5/AMLD6 KYC tiers, SEPA IBAN escrow payouts, and RFC-7807 error envelopes.

---

## 🚫 AI Agent Conflict Prevention Rules

1. **NEVER mix dependencies:**
   - Do not add Gradle or Maven build configurations to `oenexa-ai-web` or `oengo-web`.
   - Do not add `npm` / `package.json` into `oenexa-ai-core`, `oenexa-node`, or `oengo-api`.
2. **NEVER mix port assignments:**
   - `8080`: AI Core Backend REST API
   - `8081`: OenGo Commerce Go Backend API
   - `8545`: Oenexa Blockchain JSON-RPC 2.0
   - `3000`: OenGo Web (Next.js)
   - `5173`: AI Web / Explorer (Vite)
3. **NEVER use directories outside `C:\workspace\oenexarepo`:**
   - All work, changes, and commits must strictly execute inside `C:\workspace\oenexarepo\<target-repo>`.
4. **ALWAYS use the Polyrepo Tooling:**
   - To check status: `.\git-sync.ps1 -Action status`
   - To test all services: `.\git-sync.ps1 -Action test`
   - To build all services: `.\git-sync.ps1 -Action build`
