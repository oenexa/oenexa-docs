# OENEXA Unified Ecosystem: Independent Service Deployment SOP
**Document Version:** 1.0.0  
**Classification:** Enterprise Engineering Standard  
**Target Roles:** CTO, DevOps Engineers, Cloud Architects, Full-Stack Developers  

---

## 1. Executive Strategy & Philosophy

In modern hyper-scale platforms (e.g. Netflix, Stripe, Uber), **Polyrepo (separate repositories)** combined with **Independent Containerized CI/CD** and a **Unified Edge Gateway** represents the industry gold standard.

### Core Architectural Axioms
1. **Repository Isolation:** Each of the 30 repositories has its own Git history, issue tracking, dependency tree, and code ownership.
2. **Blast Radius Containment:** A failure, memory leak, or deployment rollback in one service (e.g., Quick Commerce `oengo-merchant`) has **zero blast radius** on mission-critical services (e.g., L1 Blockchain `oenexa-node` or AI Central Intelligence `oenexa-ai-core`).
3. **Independent CI/CD:** Developers build, lint, and test solely the codebase they modified. Build times stay under 3 minutes instead of 45+ minutes.
4. **Zero-Downtime Hot-Swapping (`--no-deps`):** Deploying a new release replaces only the designated container. The Edge Reverse Proxy (Caddy) dynamically routes new requests to the upgraded container using Docker's internal DNS with **zero downtime**.
5. **Unified Domain Experience (`https://oenexa.com`):** Despite running as independent microservices and SPAs, end-users, mobile apps, and merchants interact with a single, unified domain.

---

## 2. Service Tier Mapping & Container Registry

| Service Name | Source Repository | Language / Stack | Internal Port | Public URL Path | Docker Profile |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caddy` | Root Workspace | Caddy 2.8 Alpine | 80, 443 | `https://oenexa.com` | Core / All |
| `oenexa-ai-core` | `oenexa-ai-core` | Java 25 / Spring Boot 4 | 8080 | `/api/v4/*` | `ai`, `all` |
| `oenexa-ai-web` | `oenexa-ai-web` | React 18 / Vite 5 / Nginx | 80 | `/ai/*` | `ai`, `all` |
| `oenexa-node` | `oenexa-node` | Go 1.26 / LevelDB | 8545, 8765 | `/rpc`, `/ws` | `blockchain`, `all` |
| `oenexa-explorer` | `oenexa-explorer` | React 18 / Vite 5 / Nginx | 80 | `/explorer/*` | `blockchain`, `all` |
| `oenexa-ui` | `oenexa-ui` | React 18 / Next.js / Nginx | 80 | `/*` (Root) | `portal`, `all` |
| `oengo-api` | `oengo-api` | Go 1.26 / PostgreSQL | 3001 | `/oengo-api/*` | `commerce`, `all` |
| `oengo-web` | `oengo-web` | Next.js 16 SSR | 3000 | `/food/*` | `commerce`, `all` |
| `oenexa-postgres` | Official Image | PostgreSQL 17 + pgvector | 5432 | Internal Only | Core / DB |
| `oenexa-redis` | Official Image | Redis 7 Alpine | 6379 | Internal Only | Core / Cache |

---

## 3. How to Deploy a Single Repository (Zero-Downtime Hot-Swap)

### Method A: Via Universal Oenexa CLI (Recommended)

From the workspace root or production server (`/opt/oenexa`), execute:

```powershell
# Windows PowerShell
.\oenexa-cli.ps1 deploy <service-name> [prod|dev]
```

```bash
# Linux / macOS / VPS Server
./oenexa-cli.sh deploy <service-name> [prod|dev]
```

#### Real-World Examples:

1. **Deploying AI Web Frontend Only:**
   ```bash
   ./oenexa-cli.sh deploy oenexa-ai-web
   ```
   * *What happens:*
     * Pulls latest commit in `oenexa-ai-web`.
     * Rebuilds `oenexa/oenexa-ai-web:latest` image.
     * Restarts only the `oenexa-ai-web-prod` container with `--no-deps`.
     * Caddy automatically routes `/ai/*` to the fresh container.
     * All other 29 repositories remain untouched and uninterrupted.

2. **Deploying AI Core Backend Only:**
   ```bash
   ./oenexa-cli.sh deploy oenexa-ai-core
   ```
   * *What happens:*
     * Rebuilds Java 25 fat JAR and native container.
     * Hot-swaps `oenexa-ai-core-prod` with `--no-deps`.
     * Health check validates `http://localhost:8080/actuator/health`.
     * Once healthy, Caddy immediately sends API traffic to the new instance.

3. **Deploying Layer-1 Blockchain Daemon:**
   ```bash
   ./oenexa-cli.sh deploy oenexa-node
   ```
   * *What happens:*
     * Recompiles Go 1.26 binary into scratch container.
     * Re-mounts persistent blockchain volume (`onxc-chain-prod-data`).
     * Hot-swaps the node without dropping peer gossip connections on port 8765.

---

## 4. The Mechanics Behind `--no-deps` Hot-Swapping

When executing:
```bash
docker compose -f docker-compose.prod.yml up -d --no-deps oenexa-ai-web
```

1. **Dependency Bypass (`--no-deps`):** Docker ignores declared `depends_on` relationships. It does NOT restart PostgreSQL, Redis, or upstream backend services.
2. **Network Persistence:** The newly instantiated container connects directly to the existing `oenexa-network` bridge.
3. **Caddy Dynamic DNS Resolution:** Caddy resolves upstream backends by container name (e.g., `http://oenexa-ai-web:80`). When the container IP updates on the bridge network, Caddy’s internal DNS cache refreshes automatically within seconds—requiring **zero Caddy restarts or configuration reloads**.

---

## 5. Instant Rollback Protocol (< 5 Seconds)

If a newly deployed container introduces a critical bug:

```bash
# 1. Check container logs to verify the failure
./oenexa-cli.sh logs <service-name>

# 2. Check out the previous stable git tag/commit in that repository
cd /opt/oenexa/<service-repo>
git checkout <previous-stable-tag>

# 3. Immediately re-run independent deploy
cd /opt/oenexa
./oenexa-cli.sh deploy <service-name>
```

The service is restored to the previous stable version in seconds with zero effect on the rest of the ecosystem.

---

## 6. GitHub Actions Independent CI/CD Pipeline Template

Place this template in `.github/workflows/deploy.yml` inside any service repository to trigger automatic independent deployment whenever code merges to `main`:

```yaml
name: Independent CD Deployment

on:
  push:
    branches: [ main ]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Test Suite
        run: |
          if [ -f package.json ]; then npm test; fi
          if [ -f gradlew ]; then ./gradlew test; fi
          if [ -f go.mod ]; then go test ./...; fi

      - name: Deploy to Production VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PROD_VPS_HOST }}
          username: ${{ secrets.PROD_VPS_USER }}
          key: ${{ secrets.PROD_VPS_SSH_KEY }}
          script: |
            cd /opt/oenexa/${{ github.event.repository.name }}
            git pull origin main
            cd /opt/oenexa
            ./oenexa-cli.sh deploy ${{ github.event.repository.name }}
```

---

## 7. Golden Rules for Developers & DevOps

1. **Never use `docker compose down` on production:** `down` kills the entire ecosystem. Always use `./oenexa-cli.sh deploy <service>` for targeted updates.
2. **Always respect the 385-line SRP rule:** Maintain clean, decoupled code across all repositories.
3. **Zero-Mock Policy:** Always run tests with real domain models and memory buffers before pushing.
4. **Keep Secrets in `.env.production`:** Never hardcode credentials into per-repo files; read them from the root environment.
