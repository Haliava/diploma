# Backend

NestJS backend for authentication, user profiles, scan history, webhooks, dashboards, and MongoDB integration.

The backend is intentionally kept as a sibling of `vite-app` so the frontend remains an independent Vite application.

## Development

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`.

3. Start the development server:

```bash
npm run start:dev
```

The API is served under `/api`; Swagger documentation is available at `/api/docs`.
