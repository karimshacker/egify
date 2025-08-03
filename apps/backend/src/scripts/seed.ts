import { PrismaClient, UserRole, StoreStatus, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@egify.com' },
    update: {},
    create: {
      email: 'admin@egify.com',
      username: 'admin',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create store owner
  const storeOwnerPassword = await bcrypt.hash('Store123!', 12);
  const storeOwner = await prisma.user.upsert({
    where: { email: 'store@egify.com' },
    update: {},
    create: {
      email: 'store@egify.com',
      username: 'storeowner',
      password: storeOwnerPassword,
      firstName: 'Store',
      lastName: 'Owner',
      role: UserRole.STORE_OWNER,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create customer
  const customerPassword = await bcrypt.hash('Customer123!', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@egify.com' },
    update: {},
    create: {
      email: 'customer@egify.com',
      username: 'customer',
      password: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create store
  const store = await prisma.store.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
      description: 'A demonstration store for testing purposes',
      ownerId: storeOwner.id,
      status: StoreStatus.ACTIVE,
      isActive: true,
    },
  });

  // Create store settings
  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    update: {},
    create: {
      storeId: store.id,
      currency: 'USD',
      language: 'en',
      timezone: 'America/New_York',
      taxRate: 8.5,
      shippingEnabled: true,
      pickupEnabled: true,
      deliveryEnabled: true,
      autoAcceptOrders: false,
      requireCustomerApproval: false,
    },
  });

  // Create categories
  const electronicsCategory = await prisma.category.upsert({
    where: { slug_storeId: { slug: 'electronics', storeId: store.id } },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      storeId: store.id,
      isActive: true,
      sortOrder: 1,
    },
  });

  const clothingCategory = await prisma.category.upsert({
    where: { slug_storeId: { slug: 'clothing', storeId: store.id } },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      storeId: store.id,
      isActive: true,
      sortOrder: 2,
    },
  });

  // Create products
  const laptop = await prisma.product.upsert({
    where: { slug_storeId: { slug: 'macbook-pro', storeId: store.id } },
    update: {},
    create: {
      name: 'MacBook Pro',
      slug: 'macbook-pro',
      description: 'Powerful laptop for professionals',
      sku: 'MBP-001',
      price: 1299.99,
      comparePrice: 1499.99,
      costPrice: 1000.00,
      weight: 3.5,
      categoryId: electronicsCategory.id,
      storeId: store.id,
      status: ProductStatus.ACTIVE,
      isActive: true,
      isFeatured: true,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      lowStockThreshold: 5,
      tags: ['laptop', 'apple', 'professional'],
    },
  });

  const tshirt = await prisma.product.upsert({
    where: { slug_storeId: { slug: 'cotton-tshirt', storeId: store.id } },
    update: {},
    create: {
      name: 'Cotton T-Shirt',
      slug: 'cotton-tshirt',
      description: 'Comfortable cotton t-shirt',
      sku: 'TS-001',
      price: 19.99,
      comparePrice: 24.99,
      costPrice: 12.00,
      weight: 0.5,
      categoryId: clothingCategory.id,
      storeId: store.id,
      status: ProductStatus.ACTIVE,
      isActive: true,
      isFeatured: false,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      lowStockThreshold: 10,
      tags: ['clothing', 'tshirt', 'cotton'],
    },
  });

  // Create product variants
  const laptopVariant = await prisma.productVariant.upsert({
    where: { id: 'laptop-variant-1' },
    update: {},
    create: {
      id: 'laptop-variant-1',
      productId: laptop.id,
      name: '13-inch, 8GB RAM, 256GB SSD',
      sku: 'MBP-001-13-8-256',
      price: 1299.99,
      comparePrice: 1499.99,
      costPrice: 1000.00,
      weight: 3.5,
      inventory: 10,
      attributes: {
        size: '13-inch',
        ram: '8GB',
        storage: '256GB SSD',
        color: 'Space Gray',
      },
      isActive: true,
    },
  });

  const tshirtVariant = await prisma.productVariant.upsert({
    where: { id: 'tshirt-variant-1' },
    update: {},
    create: {
      id: 'tshirt-variant-1',
      productId: tshirt.id,
      name: 'Medium, Black',
      sku: 'TS-001-M-BLK',
      price: 19.99,
      comparePrice: 24.99,
      costPrice: 12.00,
      weight: 0.5,
      inventory: 50,
      attributes: {
        size: 'M',
        color: 'Black',
      },
      isActive: true,
    },
  });

  // Create customer profile
  const customerProfile = await prisma.customer.upsert({
    where: { email_storeId: { email: 'customer@egify.com', storeId: store.id } },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'customer@egify.com',
      phone: '+1234567890',
      storeId: store.id,
      isActive: true,
      isVerified: true,
      tags: ['vip', 'returning'],
    },
  });

  // Create customer address
  await prisma.address.upsert({
    where: { id: 'customer-address-1' },
    update: {},
    create: {
      id: 'customer-address-1',
      customerId: customerProfile.id,
      type: 'BOTH',
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      phone: '+1234567890',
      isDefault: true,
    },
  });

  logger.info('✅ Database seeding completed successfully!');
  logger.info('📧 Admin credentials: admin@egify.com / Admin123!');
  logger.info('🏪 Store owner credentials: store@egify.com / Store123!');
  logger.info('👤 Customer credentials: customer@egify.com / Customer123!');
}

main()
  .catch((e) => {
    logger.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 