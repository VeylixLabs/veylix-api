import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

dotenv.config();

// ---------------------------------------------------------------------------
// createApp — factory function for testability
// Separates app construction from server binding so tests can import
// the Express app without starting a live HTTP server.
// ---------------------------------------------------------------------------

export function createApp() {
  const DAPP_URL = process.env.DAPP_URL || 'https://dapp.veylixlabs.xyz';

  // Explicit production origin allowlist.
  // Add ALLOWED_ORIGIN env var in dev/staging for local overrides.
  const allowedOrigins: string[] = [
    'https://veylixlabs.xyz',
    'https://dapp.veylixlabs.xyz',
    'https://app.veylixlabs.xyz',
    'https://www.veylixlabs.xyz',
    'http://localhost:3000',
    'http://localhost:3100',
    'http://localhost:3101',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3100',
    'http://127.0.0.1:3101',
    ...(process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN] : []),
  ];

  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — whitelist only known Veylix origins.
  // Requests without an Origin header (curl, mobile SDKs) are allowed through.
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          // No Origin header → server-to-server or tool request → allow
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error(`Origin '${origin}' not permitted by CORS policy`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
    }),
  );

  // Structured access logging (skip in test env to keep output clean)
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate limiting — applied to proxy routes only
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too Many Requests',
      message:
        'You have exceeded the 100 requests in 15 mins limit. Please try again later.',
    },
  });

  app.use('/v1', apiLimiter);

  // API Documentation — Swagger UI (no auth required)
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'VEYLIX API Docs',
    customCss: '.swagger-ui .topbar { background-color: #0f0f23; }',
    swaggerOptions: {
      persistAuthorization: true,
    },
  }));

  // Expose the raw OpenAPI JSON spec
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'veylix-api-gateway',
      timestamp: new Date().toISOString(),
    });
  });

  // Header normalization: x-api-key → Authorization: Bearer <key>
  const formatAuthHeader = (req: Request, _res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];

    if (!authHeader && apiKey && typeof apiKey === 'string') {
      req.headers['authorization'] = `Bearer ${apiKey}`;
    }

    delete req.headers['x-api-key'];
    next();
  };

  app.use(formatAuthHeader);

  // Proxy: /v1/* → dApp /api/*
  app.use(
    '/v1',
    createProxyMiddleware({
      target: DAPP_URL,
      changeOrigin: true,
      proxyTimeout: 300_000, // 5 minutes for long AI tasks
      timeout: 300_000,
      // Express strips the /v1 mount path before the proxy middleware runs.
      // Example: external /v1/marketplace/listings reaches this middleware as
      // /marketplace/listings, so prepend /api explicitly for the dApp backend.
      pathRewrite: (path) => `/api${path}`,
      on: {
        proxyReq: (proxyReq, req) => {
          console.log(`[Proxy] ${req.method} ${req.url} -> ${DAPP_URL}${proxyReq.path}`);
        },
        error: (err, _req, res) => {
          console.error('[Proxy Error]', err);
          const response = res as any;
          if (!response.headersSent) {
            response.status(502).json({
              error: 'Bad Gateway',
              message: 'Unable to reach the upstream VEYLIX dApp',
            });
          }
        },
      },
    }),
  );

  // Fallback 404 for unmatched routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested API route does not exist. Use /v1 prefix.',
    });
  });

  return app;
}
