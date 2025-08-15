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

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    functions: {
      invoke: jest.fn(() => Promise.resolve({
        data: {},
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
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
  },
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
  })),
  useRoute: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Setup testing environment
global.__DEV__ = true;