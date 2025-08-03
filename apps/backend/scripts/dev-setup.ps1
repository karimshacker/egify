# Egify Backend Development Setup Script (PowerShell)
Write-Host "🚀 Setting up Egify Backend for development..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check Node.js version
$nodeMajorVersion = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
if ($nodeMajorVersion -lt 18) {
    Write-Host "❌ Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "⚠️  Please update .env file with your configuration before continuing." -ForegroundColor Yellow
    Write-Host "   Required: DATABASE_URL, REDIS_URL, JWT_SECRET" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Check if PostgreSQL is running (basic check)
try {
    $pgTest = pg_isready 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL might not be running. Please start PostgreSQL." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  pg_isready not found. Please ensure PostgreSQL is installed and running." -ForegroundColor Yellow
}

# Check if Redis is running (basic check)
try {
    $redisTest = redis-cli ping 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis might not be running. Please start Redis." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  redis-cli not found. Please ensure Redis is installed and running." -ForegroundColor Yellow
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate

# Check if database exists and is accessible
Write-Host "🗄️  Checking database connection..." -ForegroundColor Yellow
try {
    $dbTest = npm run db:migrate:status 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
        
        # Ask if user wants to seed the database
        $seedResponse = Read-Host "🌱 Do you want to seed the database with sample data? (y/n)"
        if ($seedResponse -eq 'y' -or $seedResponse -eq 'Y') {
            Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
            npm run db:seed
        }
    } else {
        Write-Host "❌ Database connection failed. Please check your DATABASE_URL in .env" -ForegroundColor Red
        Write-Host "   Make sure PostgreSQL is running and the database exists." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Database connection failed. Please check your DATABASE_URL in .env" -ForegroundColor Red
    Write-Host "   Make sure PostgreSQL is running and the database exists." -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update .env file with your configuration" -ForegroundColor White
Write-Host "   2. Ensure PostgreSQL and Redis are running" -ForegroundColor White
Write-Host "   3. Run: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful URLs:" -ForegroundColor Cyan
Write-Host "   - API: http://localhost:4000" -ForegroundColor White
Write-Host "   - Health Check: http://localhost:4000/health" -ForegroundColor White
Write-Host "   - API Docs: http://localhost:4000/api-docs" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test credentials (if seeded):" -ForegroundColor Cyan
Write-Host "   - Admin: admin@egify.com / Admin123!" -ForegroundColor White
Write-Host "   - Store Owner: store@egify.com / Store123!" -ForegroundColor White
Write-Host "   - Customer: customer@egify.com / Customer123!" -ForegroundColor White
Write-Host "" 