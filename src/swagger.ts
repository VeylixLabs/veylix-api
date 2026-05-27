import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'VEYLIX API Gateway',
      version: '1.0.0',
      description: `
The **VEYLIX API Gateway** is the public entry point for all external developers integrating with the VEYLIX decentralized 3D AI generation platform.

All requests are authenticated via an **API Key** (sent as \`X-Api-Key\` header or \`Authorization: Bearer <key>\`) and proxied to the VEYLIX dApp backend.

## Authentication

You can authenticate in two ways:
- **Header:** \`X-Api-Key: your_api_key\`
- **Bearer token:** \`Authorization: Bearer your_api_key\`

## Rate Limiting

All \`/v1\` routes are rate-limited to **100 requests per 15 minutes** per IP address.
      `.trim(),
      contact: {
        name: 'VeylixLabs',
        url: 'https://veylixlabs.xyz',
        email: 'dev@veylixlabs.xyz',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'https://api.veylixlabs.xyz',
        description: 'Production',
      },
      {
        url: 'http://localhost:8080',
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Api-Key',
          description: 'Your VEYLIX API key passed as a custom header.',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Your VEYLIX API key passed as a Bearer token.',
        },
      },
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'healthy' },
            service: { type: 'string', example: 'veylix-api-gateway' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Not Found' },
            message: { type: 'string', example: 'The requested API route does not exist. Use /v1 prefix.' },
          },
        },
        RateLimitResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Too Many Requests' },
            message: { type: 'string', example: 'You have exceeded the 100 requests in 15 mins limit.' },
          },
        },
      },
    },
    security: [{ ApiKeyHeader: [] }, { BearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['Gateway'],
          summary: 'Health check',
          description: 'Returns the current health status of the API Gateway. No authentication required.',
          security: [],
          responses: {
            '200': {
              description: 'Gateway is healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                },
              },
            },
          },
        },
      },
      '/v1/marketplace/listings': {
        get: {
          tags: ['Marketplace'],
          summary: 'List active marketplace listings',
          description: 'Returns paginated active 3D asset listings from the VEYLIX marketplace.',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10, maximum: 100 },
              description: 'Maximum number of listings to return.',
            },
          ],
          responses: {
            '200': { description: 'Array of active marketplace listings.' },
            '401': { description: 'Missing or invalid API key.' },
            '429': {
              description: 'Rate limit exceeded.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/RateLimitResponse' },
                },
              },
            },
            '502': { description: 'Upstream dApp unreachable.' },
          },
        },
      },
      '/v1/marketplace/verify': {
        post: {
          tags: ['Marketplace'],
          summary: 'Verify asset spatial integrity',
          description: 'Verifies the cryptographic integrity of a 3D asset before purchase.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['assetId'],
                  properties: {
                    assetId: { type: 'string', example: 'asset-abc123' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Verification result with signature.' },
            '401': { description: 'Missing or invalid API key.' },
            '422': { description: 'Invalid asset ID format.' },
          },
        },
      },
      '/v1/assets/{id}': {
        get: {
          tags: ['Assets'],
          summary: 'Get 3D asset details',
          description: 'Returns detailed metadata for a specific 3D synthetic asset, including topology and texture info.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'The unique asset identifier.',
            },
          ],
          responses: {
            '200': { description: 'Asset details object.' },
            '401': { description: 'Missing or invalid API key.' },
            '404': { description: 'Asset not found.' },
          },
        },
      },
      '/v1/auth/siwe/nonce': {
        post: {
          tags: ['Authentication'],
          summary: 'Generate SIWE nonce',
          description: 'Generates a Sign-In with Ethereum (SIWE) payload including a one-time nonce for wallet authentication.',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['address'],
                  properties: {
                    address: { type: 'string', example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
                    chainId: { type: 'integer', example: 8453, description: 'EVM chain ID (default: Base 8453).' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'SIWE nonce and message payload.' },
          },
        },
      },
      '/v1/auth/siwe/verify': {
        post: {
          tags: ['Authentication'],
          summary: 'Verify SIWE signature',
          description: 'Verifies the signed SIWE message and establishes an authenticated session.',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message', 'signature'],
                  properties: {
                    message: { type: 'string' },
                    signature: { type: 'string', example: '0x...' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Auth token and user session.' },
            '401': { description: 'Invalid signature.' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
