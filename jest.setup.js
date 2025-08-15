// Jest setup file
global.console = {
  ...console,
  // Suppress console.error for cleaner test output
  error: jest.fn(),
  warn: jest.fn(),
};