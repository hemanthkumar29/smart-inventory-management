# Smart Inventory API Documentation

Base URL (local): `http://localhost:5000/api`

## Response Format

Success:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## Authentication

### POST /auth/register
Create a new enterprise workspace (admin) or join an existing enterprise (staff).

Body:

```json
{
  "name": "Alex Retail",
  "email": "alex@example.com",
  "password": "StrongPass123",
  "companyName": "Acme Retail Pvt Ltd",
  "companyCode": "ACME-12AB34"
}
```

Rules:
- If `companyCode` is provided, user joins that enterprise as `staff`.
- If `companyCode` is not provided, `companyName` is required and a new enterprise is created with user role `admin`.
- If the same email is retried with the same password (for example after a network interruption), the API returns a successful signed-in response instead of failing the retry.

### POST /auth/login
Login user.

Body:

```json
{
  "email": "alex@example.com",
  "password": "StrongPass123"
}
```

### GET /auth/me
Get current user profile.

Headers: `Authorization: Bearer <token>`

### GET /auth/users
Admin-only users list with pagination.

Query: `page`, `limit`

### PATCH /auth/users/:id/role
Admin-only role update.

Body:

```json
{
  "role": "admin"
}
```

## Products

### GET /products
List products with search/filter/pagination.

Query:
- `page`, `limit`
- `search`
- `category`
- `supplier`
- `lowStock` (`true`/`false`)
- `sortBy` (`name|price|quantity|createdAt`)
- `sortOrder` (`asc|desc`)

### GET /products/:id
Get product details.

### POST /products
Create product (multipart for image).

Fields:
- `name`, `sku` (optional), `price`, `quantity`, `category`
- `supplier` (optional)
- `lowStockThreshold` (optional)
- `image` (optional file)

### PUT /products/:id
Update product (multipart for image).

### PATCH /products/:id/stock
Update product stock.

Body:

```json
{
  "quantity": 35
}
```

### DELETE /products/:id
Admin-only delete.

## Suppliers

### GET /suppliers
List suppliers.

### POST /suppliers
Create supplier.

Body:

```json
{
  "name": "ABC Wholesale",
  "email": "sales@abc.com",
  "phone": "9999999999",
  "address": "Main market"
}
```

### PUT /suppliers/:id
Update supplier.

### DELETE /suppliers/:id
Delete supplier.

## Orders

### GET /orders
List orders in the logged-in enterprise.

Query:
- `page`, `limit`
- `from`, `to` (ISO date)

### GET /orders/:id
Get order details.

### POST /orders
Create a new order and auto-deduct inventory.

Body:

```json
{
  "items": [
    { "product": "<productId>", "quantity": 2 },
    { "product": "<productId>", "quantity": 1 }
  ],
  "tax": 12,
  "discount": 10,
  "paymentMethod": "cash",
  "customerName": "Walk-in",
  "customerPhone": ""
}
```

### GET /orders/:id/invoice
Download invoice PDF.

## Dashboard

### GET /dashboard/summary
Returns:
- `totalRevenue`
- `totalProducts`
- `lowStockItems`
- `totalOrders`

### GET /dashboard/sales-trend
Query: `range` (days, max 365)

### GET /dashboard/top-products
Query: `limit` (max 20)

### GET /dashboard/insights
Query: `range`

Returns:
- `frequentlySoldProducts`
- `restockSuggestions`

## Reports

### GET /reports/sales
Query: `from`, `to`

Returns:
- `summary`
- `dailySales`
- `paymentBreakdown`

### GET /reports/inventory
Inventory health/status report.

## Notifications

### GET /notifications
List notifications for logged-in role.

Query:
- `page`, `limit`
- `unread=true`

### PATCH /notifications/:id/read
Mark a notification as read.

## Real-time Notifications (Socket.io)

Socket endpoint: `http://localhost:5000`

Auth on connect:

```js
io(socketUrl, {
  auth: { token: "<jwt-token>" }
});
```

Events:
- `notification:connected`
- `notification:new`
