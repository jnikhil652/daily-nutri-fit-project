// Mock react-native modules that don't work in test environment
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-razorpay
jest.mock('react-native-razorpay', () => ({
  open: jest.fn(() => Promise.resolve({
    razorpay_payment_id: 'pay_test123',
    razorpay_order_id: 'order_test123',
    razorpay_signature: 'signature_test123',
  })),
}));

// Mock React Native Alert specifically
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Enhanced Supabase mock with proper auth object
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(() => Promise.resolve({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    })),
    getSession: jest.fn(() => Promise.resolve({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null,
    })),
    signInWithPassword: jest.fn(() => Promise.resolve({
      data: { user: { id: 'test-user-id' }, session: {} },
      error: null,
    })),
    signUp: jest.fn(() => Promise.resolve({
      data: { user: { id: 'test-user-id' }, session: {} },
      error: null,
    })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
  },
  functions: {
    invoke: jest.fn(() => Promise.resolve({
      data: { success: true },
      error: null,
    })),
  },
  rpc: jest.fn(() => Promise.resolve({
    data: {},
    error: null,
  })),
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ 
      data: { 
        id: 'test-id',
        balance: 1000,
        user_id: 'test-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, 
      error: null 
    })),
    maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
};

jest.mock('./lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Mock useAuth hook
jest.mock('./contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      phone: '9876543210',
    },
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  })),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  })),
  useRoute: jest.fn(() => ({
    params: {},
  })),
  NavigationContainer: ({ children }) => children,
}));

// Mock React Navigation Stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  })),
}));

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Setup testing environment
global.__DEV__ = true;

// Suppress console errors and warnings in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
