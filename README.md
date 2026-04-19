# Smart Inventory Management System (MERN)

Production-ready inventory and sales platform for small and medium retail stores.

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT auth + bcrypt password hashing
- Socket.io real-time notifications
- Cloudinary image uploads
- PDFKit invoice generation

### Frontend
- React (functional components + hooks)
- React Router
- Tailwind CSS
- Axios
- Recharts

## Core Features

- Role-based auth (`admin`, `staff`)
- Multi-tenant enterprise workspaces (SaaS-ready isolation)
- Product CRUD with search, filters, pagination, image upload
- Supplier module
- Sales order creation with automatic stock deduction
- PDF invoice download
- Low stock detection and real-time alerts
- Dashboard analytics and smart insights
- Sales and inventory reports

## Project Structure

```text
smart-inventory-managemet-system/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      sockets/
      utils/
      validations/
  frontend/
    src/
      components/
      context/
      hooks/
      pages/
      services/
      utils/
  docs/
    API.md
    DEPLOYMENT.md
```

## Multi-Tenant Workspace Flow

- Register without enterprise code: creates a new enterprise workspace and user becomes `admin`.
- Register with enterprise code: joins an existing enterprise workspace as `staff`.
- Users in the same enterprise share products, suppliers, orders, dashboard, reports, and notifications.
- Users from different enterprises are fully isolated from each other.

## Local Setup

## 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs at `http://localhost:5000`.

Seed admin user (optional):

```bash
npm run seed:admin
```

## 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Required Backend Environment Variables

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `BCRYPT_SALT_ROUNDS`
- `CLIENT_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `LOW_STOCK_DEFAULT_THRESHOLD`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_TENANT_NAME` (optional)
- `ADMIN_TENANT_CODE` (optional)

## API Documentation

See [docs/API.md](docs/API.md).

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Production Notes

- Security middleware included (`helmet`, `mongo-sanitize`, `hpp`, rate limiting).
- Centralized error handling and validation.
- All private APIs protected by JWT auth and role authorization.
- Stock updates are transaction-safe during order creation.
- Real-time notifications delivered over authenticated socket connections.
