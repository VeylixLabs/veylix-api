<div align="center">
  <br />
  <img src="https://raw.githubusercontent.com/VeylixLabs/veylix-dapp/main/public/logo.png" alt="VEYLIX Logo" width="120" />
  <h1>VEYLIX API Gateway</h1>
  <p>
    <strong>The High-Performance, Secure, and Scalable Reverse Proxy for the VEYLIX Ecosystem.</strong>
  </p>
  <p>
    <a href="https://veylixlabs.xyz"><img src="https://img.shields.io/badge/Platform-VEYLIX-8B5CF6?style=flat-square&logo=react" alt="Platform" /></a>
    <a href="https://github.com/VeylixLabs/veylix-api/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-ISC-purple.svg?style=flat-square" alt="License" /></a>
    <a href="https://typescriptlang.org"><img src="https://img.shields.io/badge/Language-TypeScript_5.x-blue.svg?style=flat-square&logo=typescript" alt="TypeScript" /></a>
    <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Framework-Express-lightgray.svg?style=flat-square&logo=express" alt="Express" /></a>
  </p>
</div>

<br />

## 📖 Overview

**`veylix-api`** is the official API Gateway and Reverse Proxy for the VEYLIX Network. It serves as the secure bridge between external third-party developers and the core `veylix-dapp` engine. 

By abstracting away the complex routing of the underlying dApp infrastructure, `veylix-api` provides a clean, predictable, and highly performant `v1` RESTful interface. It automatically handles API Key parsing, format normalization, and secure traffic forwarding.

## ✨ Features

- 🚀 **Blazing Fast Proxying:** Built on top of Express and `http-proxy-middleware` for minimal overhead and ultra-low latency.
- 🔐 **Smart Auth Resolution:** Seamlessly supports both `x-api-key` headers and `Authorization: Bearer` tokens.
- 🧱 **Decoupled Architecture:** Pure reverse proxy design. Zero database dependencies; all business logic and rate-limiting are securely evaluated downstream by the VEYLIX dApp.
- 🛡️ **TypeScript Native:** 100% strongly typed codebase for maximum reliability and maintainability.
- 🌍 **CORS Ready:** Pre-configured Cross-Origin Resource Sharing for modern web applications.

---

## 🏗️ Architecture Flow

```mermaid
sequenceDiagram
    participant Client as External Developer
    participant Gateway as veylix-api (Gateway)
    participant DApp as veylix-dapp (Core Engine)
    participant DB as VEYLIX Database Node

    Client->>Gateway: POST /v1/text-to-3d (Header: x-api-key)
    Gateway->>Gateway: Normalize Auth to Bearer Token
    Gateway->>DApp: Forward to /api/text-to-3d
    DApp->>DB: Validate API Key & Update Usage
    DB-->>DApp: Validation Success (200 OK)
    DApp-->>Gateway: Return 3D Asset Data
    Gateway-->>Client: Final JSON Response
```

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later)
- [npm](https://npmjs.com) or [pnpm](https://pnpm.io)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/VeylixLabs/veylix-api.git
cd veylix-api
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=8080
DAPP_URL=https://dapp.veylixlabs.xyz
```

### 4. Development

Run the gateway in watch mode with `tsx`:

```bash
npm run dev
```

### 5. Production Build

Compile the TypeScript code and start the server:

```bash
npm run build
npm start
```

---

## 💻 Usage Example

Once the gateway is running, you can interact with the VEYLIX core APIs securely from any external server. 

> **Note:** You must generate a Developer API Key from the VEYLIX dApp Developer Console first.

```bash
# Example: Triggering a Text-to-3D generation task
curl -X POST http://localhost:8080/v1/text-to-3d/create-task \
  -H "Authorization: Bearer veylix_YourApiKeyHere..." \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic crystal carriage glowing in neon purple"
  }'
```

---

## 🔒 Security Posture

- **Stateless Proxy:** The gateway does not store, cache, or log sensitive payload data.
- **Key Hashes:** The VEYLIX ecosystem only stores hashes of your API keys. If you lose your API key, it cannot be recovered and must be revoked and regenerated via the dApp dashboard.

---

<div align="center">
  <br />
  <p>Built with 💜 by the <a href="https://github.com/VeylixLabs">VeylixLabs Team</a></p>
</div>
