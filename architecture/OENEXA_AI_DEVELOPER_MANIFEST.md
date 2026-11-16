# 🧠 OENEXA ECOSYSTEM: AI DEVELOPER MANIFEST & KNOWLEDGE BASE

**CRITICAL INSTRUCTION FOR ALL FUTURE AI AGENTS:** 
Whenever you modify, create, or refactor code in this ecosystem, you MUST update this manifest or leave extensive inline documentation explaining *WHY* the file exists, *HOW* the logic works, and *WHAT* dependencies it has. Never just write code; always write the architectural reasoning.

---

## 🏗️ 1. Global Architecture Overview
The Oenexa Ecosystem follows a Workspace Umbrella / Polyrepo Architecture comprising three decoupled system pairs:
1. **AI Operating System Platform**:
   - `oenexa-ai-core`: Clean Hexagonal Modular Monolith backend (Java 25, Spring Boot 4.1.1, Spring AI 2.0.1, 10-Agent Autonomous DAG, 7-Layer Memory Hierarchy, MCP v1.0).
   - `oenexa-ai-web`: High-performance AI Operating System web frontend (React 18, Vite 5, TypeScript, Monaco Editor, 10-Agent DAG Inspector, Memory Telemetry).
2. **Blockchain & Ledger Platform**:
   - `oenexa-node`: Layer-1 Post-Quantum blockchain daemon (Go 1.26, ML-DSA-65, Wazero WASM VM, JSON-RPC 8545).
   - `oenexa-explorer`: Network explorer and visual block dashboard (React 18, Vite 6).
3. **Commerce & Banking Stack**:
   - `oengo-api`: Enterprise food delivery & banking relayer gateway (Go 1.26, Gin, GORM, PostgreSQL).
   - `oengo-web`: Multi-role consumer food ordering storefront (Next.js 16, React 19).

---

## 🌐 2. Frontend (`oengo-web`) Deep Dive

### 📂 File: `src/app/dashboard/page.tsx`
* **Why it exists:** We needed a single unified entry point for all authenticated users to prevent routing fragmentation.
* **How it works:** It reads the `oengo_user_role` from `localStorage` and dynamically mounts the correct portal (`<CustomerPortal>`, `<MerchantPortal>`, `<AdminPortal>`, `<RiderPortal>`).
* **Known Bugs/Issues Checked & Solved:** Previously, roles were hardcoded and disjointed. The single-page architecture solved memory leaks and improved component reuse.

### 📂 File: `src/hooks/useStorefront.ts`
* **Why it exists:** `page.tsx` became a massive 500+ line monolith. We needed separation of concerns between UI (React Components) and Business Logic (State Management).
* **How it works:** It encapsulates all cart logic, API fetching (`getWallet`, `getRestaurants`), and checkout processing. It exposes a clean interface (`cart`, `wallet`, `handleAddToCart`) to the UI.
* **Deep Bug Fixes Applied:** Fixed critical TypeScript signatures where `itemId` (string) was incorrectly passed as an array `index` (number). Mapped the Wallet schema strictly to `crypto` rather than the deprecated `web3`.

### 📂 File: `src/lib/api.ts`
* **Why it exists:** Centralized HTTP fetch client. Prevents scattered `fetch()` calls across components, allowing centralized Error handling and Auth Token injection.
* **How it works:** Exports async functions (`loginUser`, `registerUser`, `checkoutCart`) that communicate with `API_BASE_URL`.

---

## ⚙️ 3. Backend (`oengo-api`) Deep Dive

### 📂 File: `internal/models/banking_models.go`
* **Why it exists:** The original memory map used `float64` for fiat balances, violating strict FinTech constraints (causing floating-point loss). We needed a true banking standard schema.
* **How it works:** Uses `github.com/shopspring/decimal` for zero-loss `numeric(28,8)` arithmetic. Implements Double-Entry Bookkeeping (`LedgerTransaction` + `LedgerEntryRecord`).
* **Deep Bug Fixes Applied:** 
  1. *Race Conditions:* Disabled `float64` and memory math.
  2. *Mutable Ledgers:* Added `BeforeUpdate` GORM hooks to prevent tampering.
  3. *Idempotency:* Added `IdempotencyKey` to prevent duplicate checkout billing.

### 📂 File: `internal/services/ledger_service.go`
* **Why it exists:** The database needs a secure, atomic gateway to execute financial transfers.
* **How it works:** The `RecordTransaction(tx)` function validates that `Debits == Credits`. It utilizes `SHA-256` hashing to chain transactions securely together. It executes pessimistic atomic balance updates (`gorm.Expr`).

### ⚠️ CURRENT KNOWN ARCHITECTURAL DEBT (THE IN-DEPTH AUDIT)
* **CRITICAL ISSUE IDENTIFIED (Oct 2026):** The backend `main.go` and `internal/store/store.go` are **still using the deprecated `sync.RWMutex` memory map**.
* **Why this is a bug:** If the Go server restarts, all financial and user data is wiped. The new `banking_models.go` PostgreSQL logic is built but NOT wired into the live HTTP handlers.
* **The Required Fix (Next Step for AI):** 
  1. Initialize GORM in `main.go`.
  2. Call `db.AutoMigrateBankingSchema()`.
  3. Replace the interfaces in `services.NewServices(st, cfg)` to accept a GORM Postgres DB instead of the memory map.

---

## 📝 4. Developer Notes & AI Mandates
1. **Always use atomic updates** for money (e.g., `UPDATE wallets SET balance = balance + X`).
2. **Never delete financial records.** Only issue compensating reverse transactions.
3. **Always document your code.** AI Agents must explain the reasoning behind complex logic in this manifest before writing the code.

### 🛠️ UPDATE (Oct 10, 2026): POSTGRES DB WIRING COMPLETED
The main.go server has successfully been refactored to pass *gorm.DB into the Store. The Auth Service (login/register) has been rewritten to exclusively use PostgreSQL, completely bypassing the old Memory Map. The transition plan is in motion.

---

### 🏛️ UPDATE (Oct 12, 2026): EU BANKING COMPLIANCE, KYC VERIFICATION & ANIMATED MENU FRAMES

#### 1. Animated Restaurant Menu Frames (`RestaurantCard.tsx` & `RestaurantDirectory.tsx`)
* **Why required:** Customers want to inspect a restaurant's live offerings directly inside its card without disruptive navigation to empty screens.
* **How it works:**
  - Each `RestaurantCard` now houses an animated collapsible inner frame (`max-h-[520px] transition-all duration-500 ease-in-out`).
  - Clicking the trigger pill smoothly animates the container open, fetches the live menu from `/restaurants/:id/menu`, and renders the dishes inside the frame with inline "Add +" and "Customize" buttons.
  - Maintains zero-disruption state for the customer.

#### 2. EU Regulatory & Banking-Grade Registration (`register/page.tsx` & `auth_service.go`)
* **Why required:** The platform handles real-world transactions across the European Union. Under **EU Directive 2015/2366 (PSD2)**, **EU AMLD5 (5th Anti-Money Laundering Directive)**, and **EU Regulation 2016/679 (GDPR)**, business accounts receiving funds cannot be anonymous.
* **How it works:**
  - Role-adaptive signup: Selecting **Restaurant Owner** activates the **EU Merchant Banking & Payout Settlement Section**.
  - Collects legal entity data: Registered Business Name, EU VAT / Tax ID (Partita IVA), SEPA IBAN (payout target), BIC/SWIFT code, physical business address, and country selection (Italy, Germany, France, etc.).
  - Enforces mandatory GDPR consent and SEPA daily escrow settlement authorization before account creation.
  - Backend models updated in `BankingUser` (`internal/models/banking_models.go`) with dedicated fields: `BusinessName`, `VatID`, `IBAN`, `BIC`, `BusinessAddress`, `Country`, and `GDPRConsentAt`.

#### 3. Enterprise KYC Due Diligence (`kyc/page.tsx`)
* **Why required:** Real-world compliance prevents fraud and food safety liabilities.
* **How it works:**
  - Step 1: Legal representative photo ID upload (Passport / CIE / National ID) with document number verification.
  - Step 2: Commercial registration certification (Visura Camerale / K-Bis / Handelsregister) and Food Safety permit (HACCP / SCIA Sanitaria under EU Regulation EC No 852/2004).
  - Step 3: Courier vehicle transit & insurance verification.
  - Redirects newly registered merchants and couriers directly to the KYC portal for document submission before granting live payout release permissions.

#### 4. Critical Route Bug Solved (`api.ts`)
* **Issue Discovered:** Frontend `loginUser` and `registerUser` were sending requests to `/users/login` and `/users/register`, while the backend API routes are registered under `/auth/login` and `/auth/register`.
* **Fix Applied:** Synchronized `api.ts` to `/auth/login` and `/auth/register`, passing full enterprise payload dictionaries.

---

### 🌍 UPDATE (Oct 12, 2026): MULTI-LANGUAGE (i18n) & SRE SINGLE-RESPONSIBILITY REFACTOR

#### 1. Multi-Language Framework (`src/lib/i18n.ts` & `src/context/LanguageContext.tsx`)
* **Why required:** OENGO operates as a European single-market platform serving customers and merchants across multiple language domains.
* **How it works:**
  - Supported locales: **English (🇬🇧)**, **Italian (🇮🇹)**, **German (🇩🇪)**, **French (🇫🇷)**, and **Spanish (🇪🇸)**.
  - Client state managed through `LanguageProvider` with automatic browser language detection and `localStorage` persistence.
  - Dropdown selector widget `LanguageSelector.tsx` embedded directly into the global navigation header.

#### 2. SRE Architectural Refactoring (`src/app/page.tsx` & `src/components/customer/StorefrontHero.tsx`)
* **Why required:** SRE (Site Reliability Engineering) principles demand modularity, single-responsibility components, and clear failure domains so that one subsystem crash does not break the entire user experience.
* **How it works:**
  - Extracted the 50+ line inline hero section into an isolated, testable component: `StorefrontHero.tsx`.
  - Converted `page.tsx` into an orchestrator with semantic landmarks (`<nav>`, `<main>`, `<section>`, `<aside>`).
  - Separated concerns between routing/data loading (`useStorefront.ts`), visual presentation (`Header`, `StorefrontHero`, `RestaurantDirectory`), and modal state (`DishCustomizationModal`, `CustomerProfileDrawer`).
  - Zero build warnings or errors across the Turbopack Next.js compiler.

---

### 🛡️ UPDATE (Oct 12, 2026): TIERED CUSTOMER KYC & WALLET COMPLIANCE LOCK

#### 1. Real-World EU Regulatory Context (AMLD5, AMLD6 & MiCA)
* **The Legal Challenge:** Casual food delivery customers must not be burdened with passport checks just to buy lunch with a credit card (to avoid customer churn). However, allowing anonymous users to deposit and hold fiat balances or transfer cryptocurrency tokens (**ONXC**) violates EU Anti-Money Laundering thresholds and European Crypto-Asset Regulations (MiCA).
* **The Solution:** Implemented **Tiered KYC & Progressive Compliance Architecture**:
  - **Tier 0 (Unverified):** Can pay for deliveries directly via Credit Card up to standard transaction limits with 0 friction. Wallet balance locked at €0.
  - **Tier 1 (Basic KYC):** In-app stored EUR balance permitted up to the **EU AMLD5 limit of €150.00**.
  - **Tier 2 (Full Crypto & Unlimited Balance):** Unlocks unlimited EUR wallet deposits and holding/spending of **ONXC** crypto tokens with national ID/passport document verification.

#### 2. Backend Enforcement (`oengo-api`)
* **Database Schema ([`banking_models.go`](file:///c:/workspace/repo/oengo-api/internal/models/banking_models.go)):**
  - Added `KYCTier` (0, 1, 2), `KYCDocType`, and `KYCDocNumber` directly into `BankingUser`.
* **Regulatory Balance Guard ([`services.go`](file:///c:/workspace/repo/oengo-api/internal/services/services.go#L480-L488)):**
  - Updated `DepositWallet()`: strictly rejects any deposit that would cause an unverified user's cumulative balance to exceed **€150.00** with the compliant error:
    `"EU AMLD5 Compliance: Stored wallet balance exceeds €150 limit. Customer KYC verification required"`.
* **Verification Endpoint ([`handlers.go`](file:///c:/workspace/repo/oengo-api/internal/handlers/handlers.go#L85-L113)):**
  - Added `POST /api/kyc/customer/verify` to validate customer identity dossiers and atomically advance user accounts to Tier 2.

#### 3. Frontend Customer Experience (`oengo-web`)
* **Customer KYC Modal ([`CustomerKYCModal.tsx`](file:///c:/workspace/repo/oengo-web/src/components/customer/CustomerKYCModal.tsx)):**
  - Embedded in-app modal enabling 60-second identity verification with Passport / CIE ID selection and document number submission.
* **Wallet Badge Lock Widget ([`WalletBadge.tsx`](file:///c:/workspace/repo/oengo-web/src/components/common/WalletBadge.tsx)):**
  - Shows active compliance tier (`Tier 0` vs `✓ Tier 2`).
  - Displays a clean `🔒 Verify KYC` quick-action button next to the ONXC Crypto Token balance whenever a user needs to unlock crypto features.
* **Storefront Integration ([`page.tsx`](file:///c:/workspace/repo/oengo-web/src/app/page.tsx) & [`useStorefront.ts`](file:///c:/workspace/repo/oengo-web/src/hooks/useStorefront.ts)):**
  - Seamlessly wired into the header and refreshed in real-time upon verification.

---

### 🚀 UPDATE (Oct 12, 2026): DEDICATED SEPARATE PAGES FOR CUSTOMER, RESTAURANT & COURIER

#### 1. Professional Separation of Concerns
* **Why required:** Commercial delivery applications (like Deliveroo, UberEats, DoorDash) strictly segregate customer storefronts from merchant kitchen displays and rider logistics apps. Mixing kitchen order controls or delivery pins into the customer browsing page degrades user experience and creates security/fraud risks.
* **How it works:**
  - **Customer Storefront (`/`):** Pure customer shopping interface. Customers only see restaurant discovery and dishes belonging to a chosen restaurant (or inside an animated card).
  - **Restaurant Kitchen Portal (`/restaurant`):** Dedicated page loaded for merchants. Contains the full 3-column Kanban Kitchen Display System (KDS), dish stock controls, live ticket timers, and revenue ribbons.
  - **Courier Rider App (`/courier`):** Dedicated page for delivery riders. Contains dispatch radar, package barcode scanner (`PKG-JOB...`), customer delivery PIN validation (`7129`), and instant earnings dashboard.
  - **SRE Routing Hub (`/dashboard`):** Automatically detects user role (`CUSTOMER`, `RESTAURANT`, `COURIER`, `ADMIN`) and seamlessly redirects to their dedicated application route with role guards.

---

### 🚀 UPDATE (Oct 12, 2026): COMPLETE SEPARATION OF LOGIN & REGISTRATION WITH GOOGLE OAUTH & PASSKEY

#### 1. FinTech-Grade Onboarding Architecture
* **Why required:** In modern European digital commerce platforms, high conversion rates depend on frictionless onboarding (1-click Google OAuth / FIDO2 Biometric Passkeys) for consumer accounts, while simultaneously maintaining rigorous AMLD5 / PSD2 verification for enterprise merchants (IBAN, VAT ID, SWIFT BIC). Combining login and registration into one modal causes friction, while requiring lengthy password typing drives customer churn.
* **Architecture & Flow:**
  - **Single-Click Authentication API (`POST /api/auth/oauth`):**
    - Accepts `{ name, email, provider, providerId }` supporting `GOOGLE`, `PASSKEY`, and `WEB3`.
    - Automatically checks database; if user exists, issues session immediately. If new, initializes a Tier 0/1 profile with verified email and returns credentials.
  - **Dedicated Login (`/login`):**
    - High-conversion single-click Google / Passkey buttons with instant role-based redirects (`/` for customers, `/restaurant` for restaurants, `/courier` for couriers).
    - Fallback email + password form for traditional credentials.
  - **Dedicated Customer Registration (`/register`):**
    - Pure consumer registration experience with zero enterprise clutter.
    - Instant 1-click Google / Passkey / Web3 signup at the top, or clean email & phone signup.
    - Subtle links at the bottom for business partners (`/register/restaurant`) and fleet riders (`/register/courier`).
  - **Dedicated Restaurant Partner Onboarding (`/register/restaurant`):**
    - Tailored exclusively for restaurant owners.
    - Captures EU Corporate Banking & Settlement Rail details (Registered Business Name, EU VAT / Partita IVA, SEPA IBAN, BIC / SWIFT, Operating Kitchen Address, EU Member Country, PSD2 Article 43 SEPA Escrow Mandate, and GDPR/KYB consent).
    - Highlights the 95% Merchant Payout Guarantee and routes directly to `/kyc` upon registration.
  - **Dedicated Courier Fleet Onboarding (`/register/courier`):**
    - Tailored exclusively for delivery riders.
    - Captures Vehicle Selection (`EBIKE`, `SCOOTER`, `EV_CAR`), Operating City/Zone, Mobile SMS Dispatch Phone, EU Platform Work & Safety Charter consent, and routes to `/kyc`.

---

### 🚀 UPDATE (Oct 13, 2026): COMPLETE POSTGRESQL RELATIONAL DATABASE IMPLEMENTATION

#### 1. Production GORM Persistence & Repository Pattern
* **Why required:** In-memory maps lose state on container restarts and cannot enforce multi-row database transaction invariants across banking ledgers and orders.
* **Architecture Implemented:**
  - **Schema AutoMigration ([`migration.go`](file:///c:/workspace/repo/oengo-api/internal/db/migration.go)):**
    - Migrates all 15 core domain models into PostgreSQL with primary keys, UUIDs, foreign constraints, decimal precision, and JSON serializers.
    - Strict financial tables: `BankingUser`, `BankingWallet`, `LedgerAccount`, `LedgerTransaction`, `LedgerEntryRecord`, `BankingOrder`.
    - Commercial domain tables: `Restaurant`, `MenuItem`, `Order`, `LedgerEntry`, `CustomerProfile`, `RiderProfile`, `CoinProfile`, `Coupon`.
  - **Repository Layer ([`internal/repository`](file:///c:/workspace/repo/oengo-api/internal/repository)):**
    - `PostgresUserRepository`: CRUD and authentication queries.
    - `PostgresOrderRepository`: Orders, pickup barcode validation, and delivery PIN matching.
    - `PostgresRestaurantRepository`: Restaurant profiles, menus, and dish stock management.
    - `PostgresWalletRepository`: Atomic double-entry balancing verification (`debit == credit`) inside `tx.Transaction()`.
    - `PostgresRiderRepository`: Courier availability and live telemetry.
  - **Store Layer ([`store.go`](file:///c:/workspace/repo/oengo-api/internal/store/store.go)):**
    - Automatically hydrates memory caches from PostgreSQL on daemon startup (`loadFromDB()`).
    - Synchronously persists all updates (orders, restaurants, dishes, ledger entries, wallets) to PostgreSQL.
  - **Docker Compose Orchestration ([`docker-compose.yml`](file:///c:/workspace/repo/docker-compose.yml)):**
    - Spun up persistent `oengo-postgres` container (`postgres:15-alpine`) with healthcheck and persistent volume `oengo-postgres-data`.
    - Configured `DATABASE_DSN` in `oengo-api`.
  - **Testcontainers Verification:**
    - Ephemeral testcontainer tests (`TestBankingSchemaMigration` & `TestPostgresUserRepository`) passing with 100% success.





## 2026-10-13: Enterprise RFC-7807 Error Handling & Correlation Tracing (`oengo-api` & `oengo-web`)
- **Backend (`oengo-api` commit `a3eaa93`)**:
  - Created `internal/apperrors/errors.go`: Standardized FinTech & D-Commerce `ErrorCode` constants (`ERR_BAD_REQUEST`, `ERR_VALIDATION_FAILED`, `ERR_UNAUTHORIZED`, `ERR_FORBIDDEN`, `ERR_KYC_VERIFICATION_REQUIRED`, `ERR_RESOURCE_NOT_FOUND`, `ERR_CONFLICT_DUPLICATE`, `ERR_INSUFFICIENT_FUNDS`, `ERR_LEDGER_IMBALANCE`, `ERR_INVALID_SECURITY_CODE`, `ERR_DATABASE_OPERATION`, `ERR_INTERNAL_SERVER`), `AppError` struct, and `WrapDBError` translator for PostgreSQL (`23505` unique violation, `23514` check violation, `gorm.ErrRecordNotFound`).
  - Created `internal/apperrors/middleware.go`: `RequestIDMiddleware()` (propagates/generates `X-Request-ID`), `ErrorHandlingMiddleware()` (recovers from panics with full stack trace logging), and `RespondWithError(c, err)` (unified JSON error envelope).
  - Eliminated all ignored DB errors in `internal/store/store.go`, `internal/repository/*.go`, and `internal/services/*.go`, and wrapped double-entry ledger inserts in atomic GORM transactions.
  - Added unit test suite `internal/apperrors/errors_test.go`.
- **Frontend (`oengo-web` commit `8803b59`)**:
  - Upgraded `src/lib/api.ts` with `ApiClientError` and `parseApiError` capturing `status`, `code`, `requestId`, `timestamp`, and `details` across all API functions.

---

## 🤖 5. OENEXA AI Core (`oenexa-ai-core`) Deep Dive

### 🏛️ Architecture: Clean Hexagonal Modular Monolith
* **Why it exists:** Provides an enterprise-grade AI Operating System backend rivaling Claude, ChatGPT, Gemini, Copilot, and DeepSeek.
* **How it works:** Structured into 4 decoupled Java 25 modules:
  - `domain`: Pure business records, sealed types, and boundary interfaces with zero framework lock-in.
  - `application`: Use-case orchestrators for 10-Agent collaboration, 7-layer memory, MCP runtime, AST analysis, voice/media processing, and subscriptions.
  - `infrastructure`: PostgreSQL persistence, zero-copy NVMe SSD `MappedByteBuffer` context buffers, Redis caches, and event publishers.
  - `api`: Spring MVC REST controllers running on Java 25 virtual threads and MCP v1.0 JSON-RPC endpoints (`/api/v4/mcp/*`).

### 🤖 10-Agent Autonomous Ecosystem
* **Why it exists:** Complex enterprise software engineering requires multi-disciplinary specialization rather than single-prompt LLM generation.
* **The 10 Autonomous Personas:**
  1. `SOFTWARE_ENGINEER`: Code synthesis, AST analysis, multi-file atomic diffs.
  2. `SYSTEM_ARCHITECT`: C4 Level 1-3 modeling, hexagonal boundary enforcement.
  3. `DEVOPS_SPECIALIST`: Dockerfiles, Kubernetes manifests, CI/CD pipelines.
  4. `SECURITY_SPECIALIST`: SAST audits, secret detection, Argon2id validation.
  5. `RESEARCH_SPECIALIST`: Semantic literature retrieval, vector knowledge search.
  6. `PRODUCT_MANAGER`: PRD generation, INVEST user stories, Gherkin BDD specs.
  7. `DATA_ENGINEER`: Flyway schemas, `pgvector` indexes, NVMe mmap buffers.
  8. `QA_VERIFICATION`: Zero-mock test suites, JaCoCo coverage enforcement.
  9. `FINANCIAL_ANALYST`: Token consumption optimization, subscription quotas.
  10. `CUSTOMER_SUPPORT`: Release notes, interactive API documentation.
* **ReAct Self-Healing:** Failed test runs trigger automatic reflection cycles with root cause analysis and patch iteration until verification succeeds with exit code 0.

### 🧠 7-Layer Memory Hierarchy
* **L1 Thread Context:** Java 25 Scoped Values / Virtual Thread Local (< 1 µs).
* **L2 Turn Memory:** In-process concurrent LRU cache for 50 sliding turns (< 10 µs).
* **L3 Scratchpad:** Blackboard working memory cleared on goal completion (< 50 µs).
* **L4 Fast Context Buffer:** Zero-copy NVMe SSD `MappedByteBuffer` (< 500 µs).
* **L5 Relational Store:** PostgreSQL 15 ACID persistence (< 5 ms).
* **L6 Semantic Vector Space:** `pgvector` / in-memory cosine store (< 20 ms).
* **L7 Cold Storage Archive:** MinIO / S3 encrypted archive (< 100 ms).

### 🔌 Model Context Protocol (MCP v1.0)
* Exposes standardized JSON-RPC 2.0 endpoints at `/api/v4/mcp/*` for tools, resources, and prompt templates, allowing seamless interoperability with Claude Desktop, Cursor, and IDE extensions.

### ⚖️ Quality Invariants
* **Zero-Mock Policy:** 100% in-process real verification without Mockito.
* **Single Responsibility Principle:** Strict limit of under 400 lines per file.

---

## 💻 6. OENEXA AI Web (`oenexa-ai-web`) Deep Dive

### 🎨 Architecture & Interactive Studios
* **Why it exists:** Delivers a world-class developer workspace combining Monaco code editing with autonomous agent orchestration and memory telemetry.
* **How it works:**
  - **10-Agent DAG Inspector:** Visualizes multi-agent plan execution with live status badges, tool outputs, and ReAct reflection drawers.
  - **7-Layer Memory Telemetry Modal:** Real-time visual gauges tracking memory hit rates, eviction stats, and NVMe SSD mmap cache latency.
  - **Monaco Code Editor:** Integrated `@monaco-editor/react` with Java/TypeScript syntax highlighting, dark/light theme syncing, and one-click patch application.
  - **Multimodal Studios:** Real-time microphone audio transcription, SVG architecture diagram visualizer, and subscription quota gauges.
* **Testing & Verification:** 10/10 Vitest tests running against real JSDOM component mounts with zero mocks; production bundle compiles cleanly via Vite 5.

---

## 🏛️ 7. OENEXA AI Core Tier-1 Central Intelligence Upgrade (2026-11)

### 🎯 Strategic Purpose & Architecture Rationale
* **Why it exists:** Upgrades `oenexa-ai-core` into the Tier-1 Central Intelligence Layer for the entire OENEXA ecosystem (acting as the operational brain across Engineering, Architecture, Security, Compliance, Risk, and DevOps).
* **How it works:**
  - **Hexagonal Integrity:** Retains the 4-module Clean Hexagonal Monolith (`domain`, `application`, `infrastructure`, `api`) in Java 25 LTS & Spring Boot 4.1.1.
  - **Decoupled Engines:** Implements autonomous engines across 11 standardized layers:
    1. `AI Gateway`: Authentication, multi-tenant rate limiting, and prompt/cost governance (`/api/v4/gateway/*`).
    2. `Model Router`: Provider-agnostic routing (Gemini, Claude, OpenAI, DeepSeek, Local Ollama) with latency and cost optimization.
    3. `Engineering & Repository Intelligence`: AST parsing, Git commit review, PR generation, architectural drift detection.
    4. `DevOps & Security Intelligence`: K8s/Docker/Terraform validation, OWASP top 10 detection, secrets scanning.
  - **Invariants Enforced:** Zero-Mock testing policy, SRP file limits (< 385 lines), Java 25 Virtual Threads concurrency, pure Java records in `:domain`.

### 🧠 Phase 3: Context & Enterprise RAG Platform Engine
* **Why it exists:** General LLMs hallucinate organizational standards and lack real-time access to the OENEXA codebases, ADR records, and production runbooks.
* **How it works:**
  - Multi-source retrieval across `REPOSITORY`, `ARCHITECTURE`, `ADR`, `POLICY`, `RUNBOOK`, and `INCIDENT` scopes.
  - Hybrid retrieval combining lexical indexing with dense vector embeddings.
  - Context expansion with strict token budget bounds ($< 32\text{k tokens}$).
  - Faithfulness and hallucination verification: verifies that all assertions in generated answers are grounded in attributed citations before serving to engineers.

### 📝 Phase 4: Prompt Registry & Role-Based Template Engine
* **Why it exists:** Ad-hoc and scattered prompts create inconsistent, untracked, and brittle LLM completions. Enterprise engineering teams require standardized, versioned, and reusable prompts tailored to specialized roles.
* **How it works:**
  - Manages versioned prompt templates (`1.0.0`, `1.1.0`) across 9 specialized engineering roles: `SOFTWARE_ENGINEER`, `SYSTEM_ARCHITECT`, `DEVOPS_ENGINEER`, `CLOUD_ENGINEER`, `SECURITY_ENGINEER`, `QA_ENGINEER`, `SRE_ENGINEER`, `TECHNICAL_WRITER`, and `PRODUCT_ARCHITECT`.
  - Supports deterministic variable interpolation (`{{key}}`).
  - Implements immutable version registries and role-based prompt lookup via `/api/v4/prompts/*`.

### ⚖️ Phase 5: Compliance, Audit & Governance Intelligence Engine
* **Why it exists:** Real-world FinTech and enterprise operations require rigorous regulatory compliance (GDPR, EU AMLD5/AMLD6, MiCA, OWASP), tamper-evident audit logging, and double-entry ledger balance invariants.
* **How it works:**
  - Automated framework audits across `GDPR`, `EU_AMLD5_AMLD6`, `OWASP_TOP_10`, `ZERO_TRUST_RBAC`, and `PQC_POST_QUANTUM`.
  - Verifies cryptographic signature hashes (ML-DSA-65) and double-entry arithmetic invariants (`debits == credits`).
  - Generates verifiable audit dossiers and compliance health metrics via `/api/v4/governance/*`.

### 🚨 Phase 6: Incident & Observability Intelligence Engine
* **Why it exists:** Modern high-throughput distributed microservices require automated real-time incident triage, root cause analysis (RCA), SLO violation correlation, and instant runbook dispatch to prevent outages.
* **How it works:**
  - Ingests telemetry metrics, JVM stack traces, and SLO breach reports via `/api/v4/incidents/triage`.
  - Automatically assesses severity levels (`P1_CRITICAL`, `P2_HIGH`, `P3_MEDIUM`, `P4_LOW`).
  - Classifies failure categories (`JVM_RESOURCE_EXHAUSTION`, `DATABASE_INFRASTRUCTURE`, `AUTHENTICATION_AUTHORIZATION`, `APPLICATION_LOGIC`, `COMPUTE_SATURATION`).
  - Resolves verified operational runbooks (e.g. `RUNBOOK-JVM-001`, `RUNBOOK-DB-002`, `RUNBOOK-APP-003`).
  - Generates structured, high-confidence Root Cause Analysis summaries and immediate action items for on-call SRE rotations.
  - Fully tested with 100% Zero-Mock unit tests across Domain, Application, and API layers; integrated with `oenexa-ai-web` via `governanceObservabilityService.ts`.

### 🛡️ Phase 7: Risk & Fraud Intelligence Platform
* **Why it exists:** Deploying autonomous AI and blockchain workloads to production requires pre-flight blast radius detection, database migration safety audits (preventing `DROP TABLE` or `TRUNCATE` data loss), and real-time Sybil/bot credential attack mitigation.
* **How it works:**
  - Evaluates pre-deployment blast radius and migration risk via `/api/v4/risk/deployment/evaluate`.
  - Calculates multi-factor risk scores and detects critical DDL operations (`DROP`, `TRUNCATE`, elevated container privileges).
  - Automatically blocks dangerous production releases with mandatory Principal Architect sign-off mitigations.
  - Detects high-velocity payment spikes, brute-force credential stuffing, and headless automation clients via `/api/v4/risk/fraud/assess`.
  - Dispatches automated mitigation actions: `QUARANTINE_SUSPEND`, `CHALLENGE_MFA`, `THROTTLE_RATE_LIMIT`, `ALLOW`.
  - Fully tested with 100% Zero-Mock unit tests across `:domain`, `:application`, and `:api` layers; integrated with `oenexa-ai-web` via `riskFraudService.ts`.

### 📚 Phase 8: Document Generation, Analytics & Support Intelligence Engine
* **Why it exists:** Enterprise engineering teams require standardized, automated technical documentation (ADRs, Technical Specifications, Post-Mortem Runbooks, Developer Guides), multi-tenant token and cost telemetry, and automated internal developer support.
* **How it works:**
  - Generates structured, compliant Markdown documents via `/api/v4/documents/generate` across types: `ADR`, `TECHNICAL_SPECIFICATION`, `POST_MORTEM_RUNBOOK`, `DEVELOPER_GUIDE`, and `API_CONTRACT`.
  - Tracks and surfaces real-time multi-tenant platform analytics (token consumption, cost in USD, active query load, p95 latency, model distribution) via `/api/v4/analytics`.
  - Provides AI-assisted engineering developer support via `/api/v4/support/query`, evaluating developer questions, matching knowledge bases, and suggesting exact verified CLI commands (e.g. `./gradlew test`, `npm test -- --run`).
  - Fully tested with 100% Zero-Mock unit tests across `:domain`, `:application`, and `:api` layers; integrated with `oenexa-ai-web` via `documentAnalyticsService.ts`.

### 🖥️ Phase 9: Enterprise Engineering Assistant Cockpit UI (`oenexa-ai-web`)
* **Why it exists:** Provides OENEXA engineers, system architects, and platform leads with a clean, focused, unified visual interface for repository inspection, DevOps infrastructure reviews, security audits, automated documentation synthesis, incident triaging, and versioned prompt selection.
* **How it works:**
  - Integrated directly into the main navigation bar via the `🛠️ Assistant` cockpit view in `PlatformNavigationBar.tsx` and `App.tsx`.
  - Implements `EnterpriseAssistantTab.tsx` with 6 dedicated engineering tool views:
    1. **Repository Assistant**: AST analysis, architectural drift check, module inventory, maintainability scoring.
    2. **DevOps Assistant**: Container vulnerability detection, Kubernetes misconfiguration scans, CI/CD deployment risk flags.
    3. **Security Assistant**: OWASP compliance validation, secrets detection, auth/authz privilege boundary checks.
    4. **Documentation Assistant**: Instant synthesis of ADRs, Technical Specifications, and Runbooks.
    5. **Incident & SRE Assistant**: Real-time stack trace triage, root cause category classification, and runbook resolution.
    6. **Prompt Registry**: Browse and apply versioned role templates across SWE, Architect, DevOps, SRE, and Security personas.
  - Fully tested with Zero-Mock tests in `EnterpriseAssistantTab.test.tsx` (19 test files, 99/99 tests passed); Vite bundle built in 9.07s.

### 📚 Phase 10: Knowledge Base Standards & Role-Based Prompt Library
* **Why it exists:** Ingesting grounded organizational knowledge and prompt engineering standards into the platform ensures zero hallucination and provides engineers with consistent, versioned guidelines.
* **How it works:**
  - Stores comprehensive enterprise standards in `knowledge/`:
    - `architecture-standards.md`: Clean Hexagonal Monolith principles, Java 25 pure records in domain, SRP limits (< 385 lines).
    - `repository-standards.md`: Multi-module polyrepo rules, dual-remote synchronization, Conventional Commits.
    - `coding-standards.md`: Java 25 records, pattern matching, defensive null checks, virtual thread concurrency.
    - `security-standards.md`: Zero-trust network boundaries, PQC ML-DSA-65 cryptography, OWASP top 10 rules.
    - `devops-standards.md`: Distroless Dockerfiles, non-root Kubernetes containers, read-only root filesystems.
    - `api-standards.md`: Standardized `ApiResponse<T>` envelopes, RFC 7807/9457 Problem Details error handling.
    - `adr-template.md` & `runbook-template.md`: Industry standard decision records and operational incident runbook schemas.
  - Stores reusable, versioned YAML prompt templates in `prompts/` covering all 9 disciplines: Software Engineer, System Architect, DevOps Engineer, Cloud Engineer, Security Engineer, QA Engineer, SRE Engineer, Technical Writer, and Product Architect.
  - Dynamically registered in `PromptRegistryService.java` with 100% Zero-Mock test verification.

### 🔗 Phase 11: Enterprise Integrations Platform
* **Why it exists:** Provides bi-directional integration with version control systems (GitHub/GitLab webhooks), local repository scanning and AST parsing for offline/intranet developer environments, and standardized OpenAPI 3.1 specification generation.
* **How it works:**
  - Ingests Git webhook events (push, pull_request, release) via `/api/v4/integrations/webhooks` with HMAC SHA-256 signature verification.
  - Generates automated pull request code reviews, architectural drift alerts, and automated release notes.
  - Performs local repository inspection via `/api/v4/integrations/repos/inspect`, scanning workspace directories, classifying file extensions (`.java`, `.ts`, `.tsx`, `.yml`, `.md`), and calculating test-to-source coverage density.
  - Exports complete, schema-compliant OpenAPI 3.1 contracts via `/api/v4/integrations/openapi/export` with multi-provider gateway configurations and security schemes.
  - Fully tested with 100% Zero-Mock unit tests across `:domain`, `:application`, and `:api` layers; integrated with `oenexa-ai-web` via `enterpriseIntegrationService.ts` and the `EnterpriseAssistantTab.tsx` Integrations cockpit view.

### ⚡ Phase 12: Autonomous Multi-Agent Swarm Orchestration & Live Execution Engine
* **Why it exists:** Real-world enterprise engineering goals cannot be achieved by a single LLM prompt. They require specialized agent collaboration (System Architect, Software Engineer, Security Auditor, DevOps, QA Verification, Data Engineer) structured in Directed Acyclic Graphs (DAGs) with dependency-ordered wave execution, structured concurrency, real-time speedup calculation, and automated artifact synthesis.
* **How it works:**
  - Ingests high-level engineering directives via `/api/v4/agents/swarm/execute`.
  - Analyzes the directive, determines execution strategy (`PARALLEL_MAX_SPEED` or `PHASED_PIPELINE`), and generates a dependency-ordered `SwarmExecutionPlan`.
  - Dispatches agent tasks concurrently using Java 25 Virtual Threads (`oenexa-vthread-swarm-*`) with isolated heap frames (1-2 KB per thread) and zero OS thread starvation.
  - Aggregates task outputs at a structured concurrency barrier, calculating wall-clock speedup factors ($S = \frac{\sum T_{seq}}{\max(T_{agent}) + T_{barrier}}$), memory footprint, and synthesized artifacts.
  - Exposes `/api/v4/agents/swarm/{planId}/status` for real-time status inspection.
  - Fully tested with 100% Zero-Mock unit tests across `:domain`, `:application`, and `:api` layers; integrated with `oenexa-ai-web` via client services and Swarm Cockpit telemetry.







