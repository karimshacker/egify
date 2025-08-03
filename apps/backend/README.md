# Egify Backend API

A comprehensive SaaS e-commerce platform backend built with Node.js, Express, TypeScript, and Prisma.

## Features

- **User Management**: Authentication, authorization, and user profiles
- **Store Management**: Multi-tenant store creation and management
- **Product Management**: Product catalog with variants and inventory
- **Order Management**: Complete order lifecycle management
- **Payment Processing**: Stripe and PayPal integration
- **Shipping**: Shipping zones, rates, and tracking
- **Marketing**: Email campaigns, templates, and subscriber management
- **Analytics**: Comprehensive analytics and reporting
- **Admin Panel**: Platform administration and monitoring
- **Webhooks**: External service integrations
- **Real-time Updates**: Socket.IO for real-time notifications

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with refresh tokens
- **File Upload**: AWS S3
- **Payments**: Stripe, PayPal
- **Email**: Nodemailer
- **Search**: Elasticsearch
- **Real-time**: Socket.IO
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Logging**: Winston

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- AWS S3 (for file uploads)
- Elasticsearch 7+ (optional, for search)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apps/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed the database (optional)
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Environment Variables

Copy `env.example` to `.env` and configure the following variables:

### Required
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `REDIS_URL`: Redis connection string

### Optional
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment (development/production)
- `AWS_*`: AWS S3 configuration for file uploads
- `STRIPE_*`: Stripe payment configuration
- `SMTP_*`: Email configuration
- `ELASTICSEARCH_URL`: Elasticsearch connection

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: `http://localhost:4000/api-docs`
- OpenAPI JSON: `http://localhost:4000/api-docs.json`

## Project Structure

```
src/
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/         # Data models (Prisma schema)
├── routes/         # API route definitions
├── services/       # Business logic
├── utils/          # Utility functions
├── validations/    # Request validation schemas
├── app.ts          # Express app configuration
├── index.ts        # Server entry point
└── types/          # TypeScript type definitions
```

## Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm test`: Run tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues
- `npm run db:generate`: Generate Prisma client
- `npm run db:migrate`: Run database migrations
- `npm run db:seed`: Seed the database
- `npm run db:studio`: Open Prisma Studio
- `npm run db:reset`: Reset the database

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password
- `GET /api/users/addresses` - Get user addresses
- `POST /api/users/addresses` - Create address
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address

### Stores
- `GET /api/stores` - Get user stores
- `POST /api/stores` - Create store
- `GET /api/stores/:id` - Get store details
- `PUT /api/stores/:id` - Update store
- `DELETE /api/stores/:id` - Delete store

### Products
- `GET /api/products` - Get store products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get store orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order status

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/refund` - Process refund

### Shipping
- `GET /api/shipping/methods` - Get shipping methods
- `POST /api/shipping/calculate` - Calculate shipping costs
- `GET /api/shipping/track/:trackingNumber` - Track shipment

### Marketing
- `GET /api/marketing/campaigns` - Get campaigns
- `POST /api/marketing/campaigns` - Create campaign
- `GET /api/marketing/email-templates` - Get email templates
- `POST /api/marketing/subscribers` - Add subscriber

### Analytics
- `GET /api/analytics/dashboard` - Get store analytics
- `GET /api/analytics/revenue` - Get revenue analytics
- `GET /api/analytics/products` - Get product analytics

### Admin (Admin only)
- `GET /api/admin/dashboard` - Get admin dashboard
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stores` - Get all stores
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/analytics` - Get platform analytics

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhooks
- `POST /api/webhooks/paypal` - PayPal webhooks
- `POST /api/webhooks/shipping` - Shipping webhooks
- `POST /api/webhooks/email` - Email webhooks

## Database Schema

The database schema is defined in `prisma/schema.prisma` and includes:

- **Users**: User accounts and profiles
- **Stores**: Multi-tenant stores
- **Products**: Product catalog with variants
- **Orders**: Order management
- **Payments**: Payment processing
- **Customers**: Customer management
- **Categories**: Product categorization
- **Reviews**: Product reviews
- **Notifications**: User notifications
- **Addresses**: User and store addresses

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build Docker image
docker build -t egify-backend .

# Run container
docker run -p 4000:4000 egify-backend
```

### Environment Variables for Production

Make sure to set the following environment variables in production:

- `NODE_ENV=production`
- `DATABASE_URL`: Production database URL
- `REDIS_URL`: Production Redis URL
- `JWT_SECRET`: Strong secret key
- `AWS_*`: Production AWS credentials
- `STRIPE_*`: Production Stripe keys

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository. 