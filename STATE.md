# VEYLIX API Gateway - State

**Last Updated:** May 2026  
**Current Phase:** Phase 3 Complete (Developer Experience)

## 📌 Current Status
The API Gateway is fully production-hardened and developer-ready. It acts as a secure reverse proxy, forwarding requests from external developers to the core `veylix-dapp` engine. This phase added: CORS origin whitelist enforcement, 13 unit/integration tests (via Vitest + supertest), Swagger/OpenAPI documentation served at `/api/docs`, and GitHub Actions CI/CD.

## 🏗️ Architecture & Stack
- **Language:** TypeScript 5.x
- **Framework:** Express.js
- **Structure:** `createApp()` factory pattern (testable, no port binding on import)
- **Proxy Engine:** `http-proxy-middleware` (v3)
- **Security Logic:** `withAuth` Global Wrapper in `veylix-dapp`
- **Gateway Security:** `helmet`, `express-rate-limit`, `morgan`
- **CORS:** Explicit origin whitelist (`veylixlabs.xyz`, `dapp.veylixlabs.xyz`, etc.)
- **API Docs:** `swagger-ui-express` + `swagger-jsdoc` at `/api/docs`
- **Testing:** Vitest + supertest (13 tests)
- **CI/CD:** GitHub Actions (test on push/PR, deploy on merge to `main`)

## 🧩 Implemented Features
- [x] Basic Express Server Setup — `src/index.ts` (thin entry point) + `src/app.ts` (factory).
- [x] Automatic Header Normalization (`x-api-key` → `Authorization: Bearer`).
- [x] Wildcard Proxy Routing (`/v1/*` → `https://dapp.veylixlabs.xyz/api/*`).
- [x] High-quality, white-labeled `README.md`.
- [x] **Global API Wrapper:** Dual-auth check (API Key or Wallet Session) via `withAuth.ts` in dApp.
- [x] **Gateway Security Headers:** Implemented via `helmet`.
- [x] **CORS Whitelist:** Explicit origin allowlist — blocks unknown origins, allows CLI/SDK (no-origin) calls.
- [x] **DDoS Protection:** 100 requests / 15 minutes limit via `express-rate-limit`.
- [x] **Observability:** Structured access logging via `morgan` (suppressed in test env).
- [x] **AI Task Reliability:** 5-minute timeout configuration for proxy middleware.
- [x] **API Documentation:** Swagger UI at `/api/docs`, raw spec at `/api/docs.json`.
- [x] **Test Suite:** 13 tests covering health, 404, header normalization, CORS, and security headers.
- [x] **CI/CD:** GitHub Actions — build+test on push/PR, deploy placeholder on merge to `main`.

## 🚦 Known Issues / Blockers
- **Deploy step** in `.github/workflows/ci.yml` is a placeholder — must be configured with the chosen cloud provider (Railway, Fly.io, or Render) and `DEPLOY_TOKEN` / `DAPP_URL` secrets set in GitHub.
