import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config({ path: '.env.test' });

// Set test environment
process.env['NODE_ENV'] = 'test';

// Jest types
declare global {
  var beforeAll: (fn: () => void | Promise<void>) => void;
  var afterAll: (fn: () => void | Promise<void>) => void;
  var beforeEach: (fn: () => void | Promise<void>) => void;
  var afterEach: (fn: () => void | Promise<void>) => void;
  var jest: any;
}

// Global test setup
beforeAll(() => {
  // Setup any global test configuration
  console.log('Setting up test environment...');
});

afterAll(() => {
  // Cleanup after all tests
  console.log('Cleaning up test environment...');
});

// Global test utilities
global.testUtils = {
  // Add any global test utilities here
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  
  createMockStore: () => ({
    id: 'test-store-id',
    name: 'Test Store',
    slug: 'test-store',
    description: 'A test store',
    ownerId: 'test-user-id',
    status: 'ACTIVE',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  
  createMockProduct: () => ({
    id: 'test-product-id',
    name: 'Test Product',
    slug: 'test-product',
    description: 'A test product',
    price: 99.99,
    storeId: 'test-store-id',
    status: 'ACTIVE',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })
};

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Extend global types for test utilities
declare global {
  var testUtils: {
    createMockUser: () => any;
    createMockStore: () => any;
    createMockProduct: () => any;
  };
} 