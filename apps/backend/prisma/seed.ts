import { PrismaClient, UserRole, StoreStatus, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
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
      profile: {
        create: {
          bio: 'System Administrator',
          preferences: {
            theme: 'dark',
            notifications: true
          }
        }
      }
    }
  });

  // Create store owner
  const storeOwnerPassword = await bcrypt.hash('store123', 12);
  const storeOwner = await prisma.user.upsert({
    where: { email: 'store@egify.com' },
    update: {},
    create: {
      email: 'store@egify.com',
      username: 'storeowner',
      password: storeOwnerPassword,
      firstName: 'John',
      lastName: 'Store Owner',
      role: UserRole.STORE_OWNER,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          bio: 'E-commerce Store Owner',
          preferences: {
            theme: 'light',
            notifications: true
          }
        }
      }
    }
  });

  // Create customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@egify.com' },
    update: {},
    create: {
      email: 'customer@egify.com',
      username: 'customer',
      password: customerPassword,
      firstName: 'Jane',
      lastName: 'Customer',
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          bio: 'Regular Customer',
          preferences: {
            theme: 'auto',
            notifications: true
          }
        }
      }
    }
  });

  // Create sample store
  const store = await prisma.store.upsert({
    where: { slug: 'sample-store' },
    update: {},
    create: {
      name: 'Sample Electronics Store',
      slug: 'sample-store',
      description: 'Your one-stop shop for all electronics and gadgets',
      logo: 'https://via.placeholder.com/150x150/007bff/ffffff?text=Store',
      banner: 'https://via.placeholder.com/1200x300/007bff/ffffff?text=Electronics+Store',
      ownerId: storeOwner.id,
      status: StoreStatus.ACTIVE,
      isActive: true,
      settings: {
        create: {
          currency: 'USD',
          language: 'en',
          timezone: 'America/New_York',
          taxRate: 8.5,
          shippingEnabled: true,
          pickupEnabled: true,
          deliveryEnabled: true,
          autoAcceptOrders: true,
          requireCustomerApproval: false,
          notificationSettings: {
            email: true,
            sms: false,
            push: true
          }
        }
      },
      address: {
        create: {
          type: 'BOTH',
          firstName: 'John',
          lastName: 'Store Owner',
          company: 'Sample Electronics Store',
          address1: '123 Main Street',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '+1-555-0123',
          isDefault: true
        }
      }
    }
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug_storeId: { slug: 'smartphones', storeId: store.id } },
      update: {},
      create: {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Latest smartphones and mobile devices',
        image: 'https://via.placeholder.com/300x200/007bff/ffffff?text=Smartphones',
        storeId: store.id,
        isActive: true,
        sortOrder: 1
      }
    }),
    prisma.category.upsert({
      where: { slug_storeId: { slug: 'laptops', storeId: store.id } },
      update: {},
      create: {
        name: 'Laptops',
        slug: 'laptops',
        description: 'High-performance laptops and computers',
        image: 'https://via.placeholder.com/300x200/28a745/ffffff?text=Laptops',
        storeId: store.id,
        isActive: true,
        sortOrder: 2
      }
    }),
    prisma.category.upsert({
      where: { slug_storeId: { slug: 'accessories', storeId: store.id } },
      update: {},
      create: {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Phone and laptop accessories',
        image: 'https://via.placeholder.com/300x200/ffc107/000000?text=Accessories',
        storeId: store.id,
        isActive: true,
        sortOrder: 3
      }
    })
  ]);

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug_storeId: { slug: 'iphone-15-pro', storeId: store.id } },
      update: {},
      create: {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'The latest iPhone with advanced features and powerful performance',
        sku: 'IPH15PRO-128',
        price: 999.99,
        comparePrice: 1099.99,
        costPrice: 800.00,
        weight: 0.187,
        dimensions: { length: 147.6, width: 71.5, height: 8.25 },
        categoryId: categories[0].id,
        storeId: store.id,
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: true,
        isDigital: false,
        requiresShipping: true,
        trackInventory: true,
        lowStockThreshold: 5,
        seoTitle: 'iPhone 15 Pro - Latest Smartphone',
        seoDescription: 'Get the latest iPhone 15 Pro with advanced features',
        seoKeywords: 'iphone, smartphone, apple, mobile',
        tags: ['smartphone', 'apple', 'iphone', '5g'],
        variants: {
          create: [
            {
              name: '128GB - Natural Titanium',
              sku: 'IPH15PRO-128-NAT',
              price: 999.99,
              comparePrice: 1099.99,
              costPrice: 800.00,
              inventory: 50,
              attributes: { color: 'Natural Titanium', storage: '128GB' },
              isActive: true
            },
            {
              name: '256GB - Natural Titanium',
              sku: 'IPH15PRO-256-NAT',
              price: 1099.99,
              comparePrice: 1199.99,
              costPrice: 900.00,
              inventory: 30,
              attributes: { color: 'Natural Titanium', storage: '256GB' },
              isActive: true
            }
          ]
        },
        images: {
          create: [
            {
              url: 'https://via.placeholder.com/600x600/007bff/ffffff?text=iPhone+15+Pro',
              alt: 'iPhone 15 Pro',
              isPrimary: true,
              sortOrder: 0
            },
            {
              url: 'https://via.placeholder.com/600x600/6c757d/ffffff?text=iPhone+15+Pro+Side',
              alt: 'iPhone 15 Pro Side View',
              isPrimary: false,
              sortOrder: 1
            }
          ]
        }
      }
    }),
    prisma.product.upsert({
      where: { slug_storeId: { slug: 'macbook-pro-14', storeId: store.id } },
      update: {},
      create: {
        name: 'MacBook Pro 14"',
        slug: 'macbook-pro-14',
        description: 'Powerful laptop for professionals with M3 chip',
        sku: 'MBP14-M3-512',
        price: 1999.99,
        comparePrice: 2199.99,
        costPrice: 1600.00,
        weight: 1.55,
        dimensions: { length: 312.6, width: 221.2, height: 15.5 },
        categoryId: categories[1].id,
        storeId: store.id,
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: true,
        isDigital: false,
        requiresShipping: true,
        trackInventory: true,
        lowStockThreshold: 3,
        seoTitle: 'MacBook Pro 14" - Professional Laptop',
        seoDescription: 'Professional laptop with M3 chip for demanding tasks',
        seoKeywords: 'macbook, laptop, apple, professional',
        tags: ['laptop', 'apple', 'macbook', 'professional'],
        variants: {
          create: [
            {
              name: 'M3 Pro - 512GB SSD',
              sku: 'MBP14-M3P-512',
              price: 1999.99,
              comparePrice: 2199.99,
              costPrice: 1600.00,
              inventory: 20,
              attributes: { processor: 'M3 Pro', storage: '512GB' },
              isActive: true
            }
          ]
        },
        images: {
          create: [
            {
              url: 'https://via.placeholder.com/600x600/28a745/ffffff?text=MacBook+Pro+14',
              alt: 'MacBook Pro 14"',
              isPrimary: true,
              sortOrder: 0
            }
          ]
        }
      }
    }),
    prisma.product.upsert({
      where: { slug_storeId: { slug: 'airpods-pro', storeId: store.id } },
      update: {},
      create: {
        name: 'AirPods Pro',
        slug: 'airpods-pro',
        description: 'Wireless earbuds with active noise cancellation',
        sku: 'AIRPODS-PRO',
        price: 249.99,
        comparePrice: 279.99,
        costPrice: 180.00,
        weight: 0.045,
        dimensions: { length: 30.9, width: 18.0, height: 19.2 },
        categoryId: categories[2].id,
        storeId: store.id,
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: false,
        isDigital: false,
        requiresShipping: true,
        trackInventory: true,
        lowStockThreshold: 10,
        seoTitle: 'AirPods Pro - Wireless Earbuds',
        seoDescription: 'Premium wireless earbuds with noise cancellation',
        seoKeywords: 'airpods, wireless, earbuds, apple',
        tags: ['airpods', 'wireless', 'earbuds', 'apple'],
        variants: {
          create: [
            {
              name: 'Standard',
              sku: 'AIRPODS-PRO-STD',
              price: 249.99,
              comparePrice: 279.99,
              costPrice: 180.00,
              inventory: 100,
              attributes: { color: 'White' },
              isActive: true
            }
          ]
        },
        images: {
          create: [
            {
              url: 'https://via.placeholder.com/600x600/ffc107/000000?text=AirPods+Pro',
              alt: 'AirPods Pro',
              isPrimary: true,
              sortOrder: 0
            }
          ]
        }
      }
    })
  ]);

  // Create customer for the store
  const storeCustomer = await prisma.customer.upsert({
    where: { email_storeId: { email: 'jane.customer@example.com', storeId: store.id } },
    update: {},
    create: {
      firstName: 'Jane',
      lastName: 'Customer',
      email: 'jane.customer@example.com',
      phone: '+1-555-0124',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'FEMALE',
      storeId: store.id,
      isActive: true,
      isVerified: true,
      preferences: {
        marketing: true,
        notifications: true
      },
      tags: ['vip', 'returning'],
      address: {
        create: {
          type: 'BOTH',
          firstName: 'Jane',
          lastName: 'Customer',
          address1: '456 Oak Avenue',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          phone: '+1-555-0124',
          isDefault: true
        }
      }
    }
  });

  // Create sample order
  const order = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-001',
      storeId: store.id,
      customerId: storeCustomer.id,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: 1249.98,
      taxAmount: 106.25,
      shippingCost: 0,
      discountAmount: 0,
      total: 1356.23,
      currency: 'USD',
      notes: 'Sample order for demonstration',
      shippingAddress: {
        firstName: 'Jane',
        lastName: 'Customer',
        address1: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90210',
        country: 'US',
        phone: '+1-555-0124'
      },
      billingAddress: {
        firstName: 'Jane',
        lastName: 'Customer',
        address1: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90210',
        country: 'US',
        phone: '+1-555-0124'
      },
      shippingMethod: 'Free Shipping',
      paymentMethod: 'Credit Card',
      paidAt: new Date(),
      items: {
        create: [
          {
            productId: products[2].id, // AirPods Pro
            variantId: (await prisma.productVariant.findFirst({
              where: { productId: products[2].id }
            }))?.id,
            quantity: 2,
            unitPrice: 249.99,
            totalPrice: 499.98,
            productName: 'AirPods Pro',
            variantName: 'Standard',
            productSku: 'AIRPODS-PRO',
            variantSku: 'AIRPODS-PRO-STD'
          },
          {
            productId: products[0].id, // iPhone 15 Pro
            variantId: (await prisma.productVariant.findFirst({
              where: { productId: products[0].id }
            }))?.id,
            quantity: 1,
            unitPrice: 999.99,
            totalPrice: 999.99,
            productName: 'iPhone 15 Pro',
            variantName: '128GB - Natural Titanium',
            productSku: 'IPH15PRO-128',
            variantSku: 'IPH15PRO-128-NAT'
          }
        ]
      },
      payments: {
        create: {
          amount: 1356.23,
          currency: 'USD',
          method: PaymentMethod.CREDIT_CARD,
          status: PaymentStatus.PAID,
          transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
          gateway: 'stripe',
          gatewayData: {
            payment_intent_id: 'pi_' + Math.random().toString(36).substr(2, 9)
          }
        }
      },
      notes: {
        create: [
          {
            note: 'Order placed successfully',
            isInternal: false
          },
          {
            note: 'Payment processed via Stripe',
            isInternal: true
          }
        ]
      }
    }
  });

  // Create sample reviews
  await Promise.all([
    prisma.review.create({
      data: {
        productId: products[0].id,
        customerId: storeCustomer.id,
        rating: 5,
        title: 'Excellent iPhone!',
        comment: 'The iPhone 15 Pro is amazing. Great camera and performance!',
        isVerified: true
      }
    }),
    prisma.review.create({
      data: {
        productId: products[2].id,
        customerId: storeCustomer.id,
        rating: 4,
        title: 'Great sound quality',
        comment: 'AirPods Pro have excellent sound quality and noise cancellation.',
        isVerified: true
      }
    })
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Admin user: admin@egify.com / admin123`);
  console.log(`🏪 Store owner: store@egify.com / store123`);
  console.log(`👤 Customer: customer@egify.com / customer123`);
  console.log(`🏪 Store: ${store.name} (${store.slug})`);
  console.log(`📦 Products created: ${products.length}`);
  console.log(`📋 Order created: ${order.orderNumber}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 