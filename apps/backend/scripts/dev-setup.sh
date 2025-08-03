#!/bin/bash

# Egify Backend Development Setup Script
echo "🚀 Setting up Egify Backend for development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your configuration before continuing."
    echo "   Required: DATABASE_URL, REDIS_URL, JWT_SECRET"
else
    echo "✅ .env file already exists"
fi

# Check if PostgreSQL is running (basic check)
if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
        echo "✅ PostgreSQL is running"
    else
        echo "⚠️  PostgreSQL might not be running. Please start PostgreSQL."
    fi
else
    echo "⚠️  pg_isready not found. Please ensure PostgreSQL is installed and running."
fi

# Check if Redis is running (basic check)
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis might not be running. Please start Redis."
    fi
else
    echo "⚠️  redis-cli not found. Please ensure Redis is installed and running."
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Check if database exists and is accessible
echo "🗄️  Checking database connection..."
if npm run db:migrate:status > /dev/null 2>&1; then
    echo "✅ Database connection successful"
    
    # Ask if user wants to seed the database
    read -p "🌱 Do you want to seed the database with sample data? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌱 Seeding database..."
        npm run db:seed
    fi
else
    echo "❌ Database connection failed. Please check your DATABASE_URL in .env"
    echo "   Make sure PostgreSQL is running and the database exists."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update .env file with your configuration"
echo "   2. Ensure PostgreSQL and Redis are running"
echo "   3. Run: npm run dev"
echo ""
echo "🔗 Useful URLs:"
echo "   - API: http://localhost:4000"
echo "   - Health Check: http://localhost:4000/health"
echo "   - API Docs: http://localhost:4000/api-docs"
echo ""
echo "🧪 Test credentials (if seeded):"
echo "   - Admin: admin@egify.com / Admin123!"
echo "   - Store Owner: store@egify.com / Store123!"
echo "   - Customer: customer@egify.com / Customer123!"
echo "" 