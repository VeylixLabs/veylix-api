import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const DAPP_URL = process.env.DAPP_URL || 'https://dapp.veylixlabs.xyz';

app.use(helmet()); // Security headers
app.use(cors());
app.use(morgan('dev')); // Access logging

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the 100 requests in 15 mins limit. Please try again later.'
  }
});

// Apply rate limiter specifically to the proxy routes
app.use('/v1', apiLimiter);

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
    proxyTimeout: 300000, // 5 minutes to handle long AI tasks
    timeout: 300000,
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
