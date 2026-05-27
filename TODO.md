# VEYLIX API Gateway - TODO

## ✅ Phase 2: Production Readiness & Hardening — DONE

### 1. Global API Wrapper in `veylix-dapp` (Cross-repo dependency)
- [x] Create `withAuth.ts` HOC/middleware in `veylix-dapp/lib/api`.
- [x] Implement fallback logic: Validate `Authorization: Bearer` (API Key) OR Wallet Session Cookie.
- [x] Wrap all public-facing API endpoints with `withAuth`.

### 2. Gateway Security Hardening (`veylix-api`)
- [x] Install and configure `helmet` for HTTP security headers.
- [x] Install and configure `express-rate-limit` to prevent DDoS.
- [x] Install and configure `morgan` for structured API access logging.
- [x] Fine-tune `http-proxy-middleware` timeout for long-running 3D tasks.
- [x] **Fix CORS:** Replace permissive `cors()` with explicit origin whitelist.

## ✅ Phase 3: Developer Experience — DONE
- [x] Refactor `index.ts` → `createApp()` factory for testability.
- [x] Setup Vitest + supertest test framework.
- [x] Write `gateway.test.ts` — 13 tests (health, 404, CORS, header normalization, Helmet).
- [x] Integrate `swagger-jsdoc` + `swagger-ui-express` for OpenAPI documentation.
- [x] Expose `/api/docs` (Swagger UI) and `/api/docs.json` (raw spec) routes.
- [x] Setup GitHub Actions CI/CD workflow (test on push/PR, deploy on merge to main).

## 🚀 Next: Deployment Setup
- [ ] Choose cloud provider: Railway / Fly.io / Render.
- [ ] Configure deploy step in `.github/workflows/ci.yml`.
- [ ] Set `DEPLOY_TOKEN` and `DAPP_URL` secrets in GitHub repo Settings.
- [ ] Set `ALLOWED_ORIGIN` env var if deploying to a non-standard domain.
