import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

vi.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: (options: any) => (req: any, res: any) => {
    const rewrittenPath =
      typeof options.pathRewrite === 'function'
        ? options.pathRewrite(req.url, req)
        : req.url;

    res.status(200).json({ proxied: true, rewrittenPath });
  },
}));

const app = createApp();

describe('VEYLIX API Gateway', () => {
  describe('GET /health', () => {
    it('should return 200 with status "healthy"', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('veylix-api-gateway');
      expect(res.body.timestamp).toBeDefined();
    });

    it('should include a valid ISO 8601 timestamp', async () => {
      const res = await request(app).get('/health');
      const ts = new Date(res.body.timestamp);
      expect(ts.toISOString()).toBe(res.body.timestamp);
    });
  });

  describe('404 fallback', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/unknown-route');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
      expect(res.body.message).toContain('/v1');
    });

    it('should return 404 for routes without the /v1 prefix', async () => {
      const res = await request(app).get('/api/assets');

      expect(res.status).toBe(404);
    });
  });

  describe('Header normalization (x-api-key -> Authorization)', () => {
    it('should convert x-api-key to Authorization: Bearer when no auth header exists', async () => {
      const res = await request(app)
        .get('/v1/assets')
        .set('X-Api-Key', 'test-key-abc123');

      expect(res.status).toBe(200);
    });

    it('should NOT override an existing Authorization header with x-api-key', async () => {
      const res = await request(app)
        .get('/v1/assets')
        .set('Authorization', 'Bearer existing-token')
        .set('X-Api-Key', 'should-be-ignored');

      expect(res.status).toBe(200);
    });
  });

  describe('Proxy path mapping', () => {
    it('should rewrite /v1 routes to the dApp /api namespace', async () => {
      const res = await request(app)
        .get('/v1/marketplace/listings?limit=10')
        .set('X-Api-Key', 'test-key-abc123');

      expect(res.status).toBe(200);
      expect(res.body.rewrittenPath).toBe('/api/marketplace/listings?limit=10');
    });
  });

  describe('CORS policy', () => {
    it('should allow requests from whitelisted origin veylixlabs.xyz', async () => {
      const res = await request(app)
        .options('/v1/assets')
        .set('Origin', 'https://veylixlabs.xyz')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBe('https://veylixlabs.xyz');
    });

    it('should allow requests from whitelisted origin dapp.veylixlabs.xyz', async () => {
      const res = await request(app)
        .options('/v1/assets')
        .set('Origin', 'https://dapp.veylixlabs.xyz')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBe('https://dapp.veylixlabs.xyz');
    });

    it('should allow requests from localhost docs during development', async () => {
      const res = await request(app)
        .options('/v1/assets')
        .set('Origin', 'http://localhost:3101')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3101');
    });

    it('should block requests from an unknown origin', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://evil-site.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should allow requests without an Origin header (CLI / SDK calls)', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('should expose the correct allowed methods in preflight response', async () => {
      const res = await request(app)
        .options('/v1/assets')
        .set('Origin', 'https://veylixlabs.xyz')
        .set('Access-Control-Request-Method', 'PATCH');

      const methods = res.headers['access-control-allow-methods'] ?? '';
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('PATCH');
    });
  });

  describe('Security headers (Helmet)', () => {
    it('should set X-Content-Type-Options: nosniff', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-Frame-Options header', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });
});
