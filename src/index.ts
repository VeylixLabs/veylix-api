import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const DAPP_URL = process.env.DAPP_URL || 'https://dapp.veylixlabs.xyz';

app.use(cors());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'veylix-api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Middleware to extract API key from headers and format it properly for the dApp
const formatAuthHeader = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  
  if (!authHeader && apiKey && typeof apiKey === 'string') {
    // If x-api-key is provided but no Authorization header, set the Authorization header
    req.headers['authorization'] = `Bearer ${apiKey}`;
  }
  
  // Clean up to prevent conflicts
  delete req.headers['x-api-key'];
  
  next();
};

app.use(formatAuthHeader);

// Proxy configuration
// All requests to /v1/* will be proxied to the dApp's /api/*
app.use(
  '/v1',
  createProxyMiddleware({
    target: DAPP_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/v1': '/api', // rewrite path /v1/foo -> /api/foo
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Log proxy requests for debugging
        console.log(`[Proxy] ${req.method} ${req.url} -> ${DAPP_URL}${proxyReq.path}`);
      },
      error: (err, req, res) => {
        console.error('[Proxy Error]', err);
        // Cast res to any to avoid type issues with headersSent
        const response = res as any;
        if (!response.headersSent) {
          response.status(502).json({
            error: 'Bad Gateway',
            message: 'Unable to reach the upstream VEYLIX dApp'
          });
        }
      }
    }
  })
);

// Fallback for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested API route does not exist. Use /v1 prefix.'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 VEYLIX API Gateway is running on port ${PORT}`);
  console.log(`🔄 Proxying /v1/* to ${DAPP_URL}/api/*`);
});
