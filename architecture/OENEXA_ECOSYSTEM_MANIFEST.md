# OENEXA Ecosystem: Master Architecture & Repository Blueprint

This document defines the official production multi-repo architecture, naming conventions, and service boundaries for the **OENEXA** ecosystem, encompassing the AI Operating System platform, Layer-1 blockchain infrastructure, and decentralized applications.

---

## 1. Repository Ecosystem Structure

The ecosystem follows a strict **Workspace Umbrella / Polyrepo Architecture** separating the AI Operating System, Layer-1 consensus, and consumer commerce dApps into decoupled system pairs:

```
c:\workspace\oenexarepo\
├── oenexa-ai-core/        # [AI Core] OENEXA AI Operating System Backend (Java 25 / Spring Boot 4.1.1)
├── oenexa-ai-web/         # [AI Web] OENEXA AI Operating System Web UI (React 18 / Vite 5 / Monaco)
├── oenexa-node/           # [L1 Core] Pure Layer-1 Blockchain Daemon (Go 1.26 / PQC ML-DSA-65)
├── oenexa-explorer/       # [L1 Tool] Official Network Explorer & Dashboard (React 18 / Vite 6)
├── oengo-api/             # [dApp Core] OenGo Commerce Gateway & Banking Ledgers (Go 1.26 / Gin)
└── oengo-web/             # [dApp Web] OenGo Consumer Food Ordering Storefront (Next.js 16 / React 19)
```

### Complete Repository Matrix

| Repository | Scope | Technology Stack | Deployment Target | GitHub Remote |
| :--- | :--- | :--- | :--- | :--- |
| **`oenexa-ai-core`** | AI OS Backend | Java 25, Spring Boot 4.1.1, Spring AI 2.0.1, MCP v1.0 | Docker, Kubernetes, Bare-Metal | `git@github.com:oenexa/oenexa-ai-core.git` |
| **`oenexa-ai-web`** | AI OS Web UI | React 18, Vite 5, TypeScript, Monaco Editor | Docker, Nginx, Cloudflare | `git@github.com:oenexa/oenexa-ai-web.git` |
| **`oenexa-node`** | Layer-1 Blockchain | Go 1.26, Wazero, ML-DSA-65, libp2p | Bare-Metal, Docker, Kubernetes | `git@github.com:oenexa/oenexa-node.git` |
| **`oenexa-explorer`** | Block Explorer | React 18, Vite 6, TypeScript, Tailwind | Cloudflare Pages, Nginx, Docker | `git@github.com:oenexa/oenexa-explorer.git` |
| **`oengo-api`** | Commerce Gateway | Go 1.26, Gin, GORM, PostgreSQL | Docker, Kubernetes, VPS | `git@github.com:oenexa/oengo-api.git` |
| **`oengo-web`** | Storefront | Next.js 16, React 19, TypeScript, Tailwind | Vercel, Cloudflare, Node | `git@github.com:oenexa/oengo-web.git` |

---

## 2. System Pairs & Architectural Boundaries

### Pair 1: 🤖 OENEXA AI (AI Operating System Platform)
- **Backend (`oenexa-ai-core`):** Clean 4-module Hexagonal Architecture (`domain`, `application`, `infrastructure`, `api`), 10-Agent Autonomous Ecosystem DAG, 7-Layer Memory Hierarchy with zero-copy NVMe SSD `MappedByteBuffer` context buffers, Model Context Protocol (MCP v1.0), and banking-grade security.
- **Frontend (`oenexa-ai-web`):** Monaco Code Editor, interactive 10-Agent DAG Inspector, 7-Layer Memory Telemetry Modal, real-time thought terminal, and multimodal audio/vision studios.
- **Port:** Backend on `8080`, Frontend on `5173` (proxies `/api` to `8080`).

### Pair 2: ⛓️ Blockchain & Ledger Platform (Consensus & Explorer)
- **Consensus Engine (`oenexa-node`):** Quantum-resistant Layer-1 blockchain daemon with NIST PQC ML-DSA-65 digital signatures, ML-KEM-768 key encapsulation, EIP-1559 gas mechanics, and Wazero WASM VM.
- **Visual Explorer (`oenexa-explorer`):** Block explorer visual interface querying node via Web3 JSON-RPC 2.0.
- **Port:** Node JSON-RPC on `8545`, P2P on `8765`, Metrics on `9090`, Explorer on `5173`.

### Pair 3: 🛍️ OenGo D-Commerce & Banking System (Merchant & Delivery Platform)
- **Backend API (`oengo-api`):** Enterprise Go REST/WebSocket gateway, double-entry banking ledgers (`debit == credit`), SEPA IBAN escrow payouts, and EU AMLD5/AMLD6 KYC verification.
- **Consumer Web (`oengo-web`):** Next.js storefront, multi-role portal (Customer, Merchant KDS, Courier Rider, KYC).
- **Port:** API on `8081` (or `3001`), Web on `3000` (or `3002`).

---

## 3. Local Development Port Allocations

| Service | Port | Protocol | Description |
| :--- | :--- | :--- | :--- |
| **`oenexa-ai-core`** | `8080` | HTTP / REST / MCP | OENEXA AI Core API & MCP Server |
| **`oenexa-ai-web`** | `5173` | HTTP / Web | OENEXA AI Web Developer UI |
| **`oenexa-node` (RPC)** | `8545` | HTTP / JSON-RPC | Layer-1 Web3 JSON-RPC endpoint |
| **`oenexa-node` (P2P)** | `8765` | TCP / libp2p | Peer-to-peer gossip network |
| **`oenexa-node` (Metrics)** | `9090` | HTTP / Prometheus | Prometheus node telemetry |
| **`oenexa-explorer`** | `5174` | HTTP / Web | Block explorer visual interface |
| **`oengo-api`** | `8081` | HTTP / REST | Order management & banking relayer |
| **`oengo-web`** | `3000` | HTTP / Next.js | Consumer food ordering storefront |

---

## 4. Single-Command Developer Operations (`git-sync.ps1`)

From `C:\workspace\oenexarepo`:

```powershell
# Check status across all 6 repositories
.\git-sync.ps1 -Action status

# Run automated tests across all repos
.\git-sync.ps1 -Action test

# Compile and build all repos
.\git-sync.ps1 -Action build

# Clean temporary build and cache artifacts safely
.\git-sync.ps1 -Action clean

# Push synchronized changes across all repos
.\git-sync.ps1 -Action push
```
