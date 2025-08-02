# Egify Backend API

A robust, scalable backend API for the Egify e-commerce platform built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **E-commerce Management**: Complete store, product, order, and customer management
- **Real-time Notifications**: Socket.IO integration for real-time updates
- **File Upload**: AWS S3 integration for file storage
- **Payment Processing**: Stripe integration for payment processing
- **Search & Analytics**: Advanced search functionality and business analytics
- **Email Notifications**: Transactional email system
- **API Documentation**: Swagger/OpenAPI documentation
- **Testing**: Comprehensive test suite with Jest
- **Docker Support**: Containerized deployment with Docker Compose

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Search**: Elasticsearch
- **Authentication**: JWT with Passport.js
- **File Storage**: AWS S3
- **Payments**: Stripe
- **Email**: Nodemailer
- **Real-time**: Socket.IO
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd egify-platform/apps/backend
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Run migrations and seed data**
   ```bash
   docker-compose exec backend npm run migrate
   docker-compose exec backend npm run seed
   ```

5. **Access the API**
   - API: http://localhost:5000
   - Health Check: http://localhost:5000/health
   - API Documentation: http://localhost:5000/api-docs

### Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb egify_db
   
   # Run migrations
   npm run migrate
   
   # Seed data
   npm run seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── controllers/          # HTTP request handlers
├── middleware/          # Express middleware
├── models/             # Data models (Prisma schema)
├── routes/             # API route definitions
├── services/           # Business logic layer
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── tests/              # Test files
└── index.ts            # Application entry point
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | - |
| `SMTP_HOST` | SMTP server host | - |
| `AWS_ACCESS_KEY_ID` | AWS access key | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |

### Database Schema

The application uses Prisma ORM with the following main entities:

- **Users**: Authentication and user management
- **Stores**: E-commerce store management
- **Products**: Product catalog with variants
- **Orders**: Order management and tracking
- **Customers**: Customer management
- **Categories**: Product categorization
- **Reviews**: Product reviews and ratings
- **Payments**: Payment processing records

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user profile

### Stores
- `GET /api/v1/stores` - List user's stores
- `POST /api/v1/stores` - Create new store
- `GET /api/v1/stores/:id` - Get store details
- `PUT /api/v1/stores/:id` - Update store
- `DELETE /api/v1/stores/:id` - Delete store

### Products
- `GET /api/v1/products` - List products
- `POST /api/v1/products` - Create product
- `GET /api/v1/products/:id` - Get product details
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order details
- `PUT /api/v1/orders/:id/status` - Update order status

### Customers
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/:id` - Get customer details
- `PUT /api/v1/customers/:id` - Update customer

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- authService.test.ts
```

### Test Structure
- **Unit Tests**: Test individual functions and methods
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Test complete user workflows

## 📊 Monitoring & Logging

### Logging
The application uses Winston for structured logging with different levels:
- `error`: Application errors
- `warn`: Warning messages
- `info`: General information
- `debug`: Debug information

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check with dependencies

## 🔒 Security

### Authentication
- JWT-based authentication
- Refresh token rotation
- Password hashing with bcrypt
- Role-based access control

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- XSS protection
- CSRF protection

### Input Validation
- Express-validator for request validation
- Sanitization of user inputs
- SQL injection prevention (Prisma ORM)

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
# Build production image
docker build -t egify-backend .

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Configurations
- **Development**: Hot reload, detailed logging
- **Staging**: Production-like environment
- **Production**: Optimized for performance and security

## 📚 API Documentation

### Swagger UI
Access the interactive API documentation at:
```
http://localhost:5000/api-docs
```

### OpenAPI Specification
Download the OpenAPI specification:
```
http://localhost:5000/api-docs/swagger.json
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the test files for usage examples

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete e-commerce functionality
- Authentication and authorization
- Real-time notifications
- File upload support
- Payment processing
- Search and analytics 