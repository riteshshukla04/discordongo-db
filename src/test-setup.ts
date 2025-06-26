// Test setup file
import 'jest';

// Mock global fetch for tests
global.fetch = jest.fn();

// Suppress console errors during tests unless needed
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}; 