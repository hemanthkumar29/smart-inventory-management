# Deployment Guide

## 1. Backend Deployment (Render or Railway)

### Required Environment Variables

Set these in your backend hosting dashboard:

- `NODE_ENV=production`
- `PORT=5000` (or host-assigned)
- `MONGO_URI=<mongo connection string>`
- `JWT_SECRET=<long random secret>`
- `JWT_EXPIRES_IN=1d`
- `BCRYPT_SALT_ROUNDS=12`
- `CLIENT_URL=<frontend domain>`
- `LOW_STOCK_DEFAULT_THRESHOLD=10`
- `CLOUDINARY_CLOUD_NAME=<cloudinary cloud name>`
- `CLOUDINARY_API_KEY=<cloudinary key>`
- `CLOUDINARY_API_SECRET=<cloudinary secret>`

Optional for initial admin seed:
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Render

1. Create a new `Web Service` from backend repo/folder.
2. Set Root Directory to `backend`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add all environment variables.
6. Deploy.

### Railway

1. Create project and link repository.
2. Set service root to `backend`.
3. Railway auto-runs `npm install` and `npm start`.
4. Configure environment variables.
5. Deploy.

## 2. Frontend Deployment (Vercel or Netlify)

### Required Environment Variables

- `VITE_API_BASE_URL=<backend-url>/api`
- `VITE_SOCKET_URL=<backend-url>`

### Vercel

1. Import project.
2. Set Root Directory to `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add frontend env vars.
6. Deploy.

### Netlify

1. Connect repository.
2. Base directory: `frontend`.
3. Build command: `npm run build`.
4. Publish directory: `frontend/dist` (or `dist` if base set).
5. Add env vars.
6. Deploy.

## 3. Post-deploy Checklist

1. Confirm `/api/health` responds from backend.
2. Create or seed admin user (`npm run seed:admin`) if needed.
3. Login and test full flow:
   - Add supplier
   - Add product with image upload
   - Create order
   - Download invoice PDF
   - Observe low-stock notifications
4. Verify Socket.io works in production domain (CORS values).
5. Verify Cloudinary images upload and persist.
6. Enable MongoDB backups and monitoring for production.

## 4. Security Hardening Recommendations

1. Rotate `JWT_SECRET` regularly.
2. Restrict MongoDB network access by IP or VPC peering.
3. Enforce HTTPS-only domains.
4. Add WAF/rate-limit policies at gateway/CDN layer.
5. Configure log aggregation and alerting (e.g., Datadog, Grafana, Sentry).
