# VEYLIX API Gateway - TODO

## 🎯 Phase 2: Production Readiness & Hardening (Current Sprint)

### 1. Global API Wrapper in `veylix-dapp` (Cross-repo dependency)
- [x] Create `withAuth.ts` HOC/middleware in `veylix-dapp/lib/api`.
- [x] Implement fallback logic: Validate `Authorization: Bearer` (API Key) OR Wallet Session Cookie.
- [x] Wrap all public-facing API endpoints (`/api/assets`, `/api/marketplace`, etc.) with `withAuth`.

### 2. Gateway Security Hardening (`veylix-api`)
- [x] Install and configure `helmet` for HTTP security headers.
- [x] Install and configure `express-rate-limit` to prevent DDoS and spam at the gateway level.
- [x] Install and configure `morgan` for structured API access logging.
- [x] Fine-tune `http-proxy-middleware` timeout and proxy error handling for long-running 3D tasks.

## 🎯 Phase 3: Developer Experience (Future)
- [ ] Integrate Swagger/OpenAPI documentation generation.
- [ ] Expose an `/api/docs` route on the Gateway.
- [ ] Setup GitHub Actions CI/CD for automated deployments of the gateway to a cloud provider.
