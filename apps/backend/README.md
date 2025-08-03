# Egify Backend API

A comprehensive SaaS e-commerce platform backend built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

- **Multi-tenant Architecture**: Support for multiple stores with isolated data
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Product Management**: Complete product catalog with variants, categories, and inventory
- **Order Management**: Full order lifecycle from creation to fulfillment
- **Payment Processing**: Stripe integration with webhook support
- **Customer Management**: Customer profiles, addresses, and preferences
- **Shipping & Fulfillment**: Shipping zones, rates, and tracking
- **Marketing Tools**: Email campaigns, templates, and subscriber management
- **Analytics**: Sales, customer, and product analytics
- **Real-time Updates**: Socket.IO for live notifications
- **File Upload**: AWS S3 integration for media storage
- **Search**: Elasticsearch integration for product search
- **Admin Panel**: Centralized administration interface

## 🏗️ Architecture

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── routes/          # API route definitions
├── middleware/      # Custom middleware
├── validations/     # Request validation schemas
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
└── tests/           # Test files
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT, Passport.js
- **File Storage**: AWS S3
- **Payment**: Stripe
- **Email**: Nodemailer
- **Search**: Elasticsearch
- **Real-time**: Socket.IO
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- AWS S3 bucket (for file uploads)
- Stripe account (for payments)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apps/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/egify"
   
   # Redis
   REDIS_URL="redis://localhost:6379"
   
   # JWT
   JWT_SECRET="your-jwt-secret"
   JWT_REFRESH_SECRET="your-refresh-secret"
   
   # AWS S3
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET="your-bucket-name"
   
   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   
   # Email
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   
   # App
   NODE_ENV="development"
   PORT=4000
   FRONTEND_URL="http://localhost:3000"
   STOREFRONT_URL="http://localhost:3001"
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed database (optional)
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

The application uses Prisma ORM with the following main entities:

- **Users**: Platform users (admin, store owners, customers)
- **Stores**: Multi-tenant store instances
- **Products**: Product catalog with variants
- **Orders**: Order management and fulfillment
- **Customers**: Customer profiles and data
- **Payments**: Payment processing and tracking
- **Shipping**: Shipping zones and rates
- **Marketing**: Campaigns and email templates

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Stores
- `GET /api/stores` - List stores
- `POST /api/stores` - Create store
- `GET /api/stores/:id` - Get store details
- `PUT /api/stores/:id` - Update store
- `DELETE /api/stores/:id` - Delete store

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `POST /api/orders/:id/cancel` - Cancel order

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Payments
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/:id/refund` - Process refund

### Shipping
- `GET /api/shipping/methods` - Get shipping methods
- `POST /api/shipping/calculate` - Calculate shipping costs
- `GET /api/shipping/track/:number` - Track shipment

### Marketing
- `GET /api/marketing/campaigns` - List campaigns
- `POST /api/marketing/campaigns` - Create campaign
- `GET /api/marketing/email-templates` - List email templates

### Analytics
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/customers` - Customer analytics
- `GET /api/analytics/products` - Product analytics

## 🔐 Authentication

The API uses JWT-based authentication with the following flow:

1. **Login**: User provides credentials and receives access + refresh tokens
2. **Access**: Include `Authorization: Bearer <token>` header for protected routes
3. **Refresh**: Use refresh token to get new access token when expired
4. **Logout**: Invalidate refresh token

### Role-based Access Control

- **ADMIN**: Full platform access
- **STORE_OWNER**: Store-specific access
- **CUSTOMER**: Limited access to own data

## 📊 Validation

Request validation is handled using `express-validator` with centralized validation schemas:

```typescript
import { validateRequest } from '@/validations';
import { productValidation } from '@/validations/productValidation';

router.post('/products', 
  validateRequest(productValidation.createProduct), 
  productController.createProduct
);
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- productService.test.ts
```

## 📚 API Documentation

API documentation is automatically generated using Swagger/OpenAPI:

- **Development**: http://localhost:4000/api-docs
- **OpenAPI JSON**: http://localhost:4000/api-docs.json

## 🔄 Webhooks

The application supports webhooks for:

- **Stripe**: Payment events
- **Shipping**: Tracking updates
- **Email**: Delivery status
- **Custom**: Store-specific events

## 📈 Monitoring

- **Health Check**: `GET /health`
- **Logging**: Winston with daily rotation
- **Error Tracking**: Centralized error handling
- **Performance**: Request logging and metrics

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t egify-backend .

# Run container
docker run -p 4000:4000 egify-backend
```

### Environment Variables

Ensure all required environment variables are set in production:

```bash
NODE_ENV=production
DATABASE_URL=...
REDIS_URL=...
JWT_SECRET=...
# ... other variables
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:

- **Documentation**: Check the API docs at `/api-docs`
- **Issues**: Create an issue in the repository
- **Email**: support@egify.com

## 🔄 Changelog

### v1.0.0
- Initial release
- Multi-tenant e-commerce platform
- Complete API with authentication, products, orders, payments
- Real-time updates with Socket.IO
- Comprehensive validation and error handling 