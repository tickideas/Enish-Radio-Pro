// Test setup and configuration for backend testing

const { syncSchema } = require('../drizzle/db');
const testDatabase = require('./testDatabase');

// Global test setup
beforeAll(async () => {
  // Set up test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = testDatabase.getConnectionString();
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';

  console.log('🧪 Setting up test database...');
  
  try {
    // Initialize test database schema
    await testDatabase.initialize();
    
    // Sync database schema
    await syncSchema();
    
    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
});

// Global test teardown
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Clean up test database
    await testDatabase.cleanup();
    console.log('✅ Test cleanup completed');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});

// Global test hooks for each test
beforeEach(async () => {
  // Start a database transaction for each test
  await testDatabase.beginTransaction();
});

afterEach(async () => {
  // Rollback the transaction after each test
  await testDatabase.rollbackTransaction();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Mock external services
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  }));
});

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        public_id: 'test-public-id',
        secure_url: 'https://test-cloudinary-url.com/test.jpg',
        width: 800,
        height: 600,
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
}));

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Uncomment to silence specific console methods during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Custom matchers for common testing patterns
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toHaveValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toBeWithinRange(received, minimum, maximum) {
    const pass = received >= minimum && received <= maximum;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${minimum} - ${maximum}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${minimum} - ${maximum}`,
        pass: false,
      };
    }
  },

  toBeIsoDateString(received) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    const isValidDate = !isNaN(Date.parse(received));
    const pass = dateRegex.test(received) && isValidDate;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ISO date string`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ISO date string`,
        pass: false,
      };
    }
  },

  toBeSecurePassword(received) {
    // At least 8 characters, one uppercase, one lowercase, one number, one special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const pass = passwordRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a secure password`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a secure password`,
        pass: false,
      };
    }
  },
});

// Test utilities
global.testUtils = {
  // Generate test data
  generateUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'SecurePass123!',
    role: 'user',
    isActive: true,
    ...overrides,
  }),

  generateSocialLink: (overrides = {}) => ({
    id: 'test-social-link-id',
    platform: 'facebook',
    url: 'https://facebook.com/test',
    displayName: 'Test Facebook',
    icon: 'logo-facebook',
    isActive: true,
    order: 1,
    ...overrides,
  }),

  generateAdBanner: (overrides = {}) => ({
    id: 'test-ad-banner-id',
    title: 'Test Ad Banner',
    imageUrl: 'https://example.com/image.jpg',
    cloudinaryPublicId: 'test-public-id',
    targetUrl: 'https://example.com',
    description: 'Test ad banner description',
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000), // Tomorrow
    clickCount: 0,
    impressionCount: 0,
    priority: 1,
    ...overrides,
  }),

  // Create mock request/response objects
  createMockRequest: (overrides = {}) => ({
    method: 'GET',
    url: '/api/test',
    headers: {},
    params: {},
    query: {},
    body: {},
    user: null,
    ...overrides,
  }),

  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  },

  // Wait for async operations
  waitFor: (condition, timeout = 5000, interval = 100) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
        } else {
          setTimeout(check, interval);
        }
      };
      
      check();
    });
  },

  // Clean up all test data
  cleanDatabase: async () => {
    await testDatabase.cleanup();
  },

  // Create test JWT token
  createTestToken: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
        ...payload,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  // Simulate network delay
  networkDelay: (ms = 100) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

// Performance testing utilities
global.performanceUtils = {
  measureExecutionTime: async (fn, iterations = 1) => {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await fn();
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1000000); // Convert to milliseconds
    }
    
    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      iterations: times.length,
    };
  },

  measureMemoryUsage: async (fn) => {
    const initialMemory = process.memoryUsage();
    await fn();
    const finalMemory = process.memoryUsage();
    
    return {
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      external: finalMemory.external - initialMemory.external,
      rss: finalMemory.rss - initialMemory.rss,
    };
  },
};

console.log('🧪 Backend test environment setup complete');