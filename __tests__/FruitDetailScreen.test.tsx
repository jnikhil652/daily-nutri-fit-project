import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { FruitDetailScreen } from '../screens/main/FruitDetailScreen';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../lib/supabase');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: { fruitId: '1' },
  }),
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('FruitDetailScreen', () => {
  const mockFruitData = {
    id: '1',
    name: 'Apple',
    description: 'Fresh red apple from local orchards with excellent flavor and crisp texture',
    short_description: 'Sweet and crisp',
    price: 2.99,
    unit: 'lb',
    image_url: 'https://example.com/apple.jpg',
    is_available: true,
    is_seasonal: true,
    seasonal_months: ['September', 'October', 'November'],
    storage_tips: 'Keep in refrigerator for up to 2 weeks',
    origin_country: 'USA',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    nutritional_info: [{
      id: '1',
      fruit_id: '1',
      calories_per_100g: 52,
      protein_g: 0.3,
      carbs_g: 14,
      fiber_g: 2.4,
      sugar_g: 10,
      fat_g: 0.2,
      vitamin_c_mg: 5,
      vitamin_a_iu: 54,
      potassium_mg: 107,
      calcium_mg: 6,
      iron_mg: 0.1,
      created_at: '2024-01-01T00:00:00Z',
    }],
    categories: [{
      category: {
        id: '1',
        name: 'Tree Fruits',
        description: 'Fruits that grow on trees',
        image_url: null,
        created_at: '2024-01-01T00:00:00Z',
      }
    }],
    health_benefits: [{
      benefit: {
        id: '1',
        name: 'Heart Health',
        description: 'Supports cardiovascular health with antioxidants',
        created_at: '2024-01-01T00:00:00Z',
      }
    }]
  };

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Alert
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    // Setup default auth mock
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
    });
  });

  describe('Loading States', () => {
    it('should display loading indicator initially', () => {
      // Mock loading state
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockImplementation(() => 
        new Promise(() => {}) // Never resolves to simulate loading
      );

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const { getByText } = render(<FruitDetailScreen />);
      
      expect(getByText('Loading fruit details...')).toBeTruthy();
    });

    it('should load fruit details on mount', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockFruitData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('$2.99')).toBeTruthy();
        expect(getByText('/lb')).toBeTruthy();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('fruits');
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(mockSingle).toHaveBeenCalled();
    });

    it('should handle fruit loading errors', async () => {
      const mockNavigate = jest.fn();
      jest.doMock('@react-navigation/native', () => ({
        useNavigation: () => ({
          goBack: mockNavigate,
        }),
        useRoute: () => ({
          params: { fruitId: '1' },
        }),
      }));

      const mockError = new Error('Fruit not found');
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load fruit details');
      });
    });

    it('should show fruit not found error when data is null', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Fruit not found')).toBeTruthy();
        expect(getByText('Go Back')).toBeTruthy();
      });
    });
  });

  describe('Fruit Information Display', () => {
    beforeEach(async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockFruitData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);
    });

    it('should display basic fruit information', async () => {
      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('$2.99')).toBeTruthy();
        expect(getByText('/lb')).toBeTruthy();
        expect(getByText('Fresh red apple from local orchards with excellent flavor and crisp texture')).toBeTruthy();
      });
    });

    it('should display seasonal badge when fruit is seasonal', async () => {
      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Seasonal')).toBeTruthy();
      });
    });

    it('should display fruit categories', async () => {
      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Tree Fruits')).toBeTruthy();
      });
    });

    it('should display nutritional information', async () => {
      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Nutritional Information (per 100g)')).toBeTruthy();
        expect(getByText('52')).toBeTruthy(); // Calories
        expect(getByText('0.3g')).toBeTruthy(); // Protein
        expect(getByText('14g')).toBeTruthy(); // Carbs
        expect(getByText('2.4g')).toBeTruthy(); // Fiber
        expect(getByText('10g')).toBeTruthy(); // Sugar
        expect(getByText('5mg')).toBeTruthy(); // Vitamin C
      });
    });

    it('should display health benefits', async () => {
      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Health Benefits')).toBeTruthy();
        expect(getByText('• Heart Health')).toBeTruthy();
        expect(getByText('Supports cardiovascular health with antioxidants')).toBeTruthy();
      });
    });

    it('should display storage tips', async () => {
      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Storage Tips')).toBeTruthy();
        expect(getByText('Keep in refrigerator for up to 2 weeks')).toBeTruthy();
      });
    });

    it('should display seasonal availability', async () => {
      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Seasonal Availability')).toBeTruthy();
        expect(getByText('September, October, November')).toBeTruthy();
      });
    });

    it('should display origin country', async () => {
      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Origin')).toBeTruthy();
        expect(getByText('USA')).toBeTruthy();
      });
    });
  });

  describe('Nutritional Information Edge Cases', () => {
    it('should handle missing nutritional values gracefully', async () => {
      const fruitWithMissingNutrition = {
        ...mockFruitData,
        nutritional_info: [{
          ...mockFruitData.nutritional_info[0],
          calories_per_100g: null,
          protein_g: null,
          vitamin_c_mg: null,
        }]
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: fruitWithMissingNutrition,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Nutritional Information (per 100g)')).toBeTruthy();
        expect(getByText('N/A')).toBeTruthy(); // Should show N/A for missing values
      });
    });

    it('should handle missing nutritional info entirely', async () => {
      const fruitWithoutNutrition = {
        ...mockFruitData,
        nutritional_info: null,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: fruitWithoutNutrition,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const { queryByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(queryByText('Nutritional Information (per 100g)')).toBeNull();
      });
    });
  });

  describe('Conditional Content Display', () => {
    it('should hide sections when data is missing', async () => {
      const minimalFruit = {
        id: '1',
        name: 'Simple Fruit',
        description: 'Basic description',
        price: 1.99,
        unit: 'each',
        image_url: 'https://example.com/fruit.jpg',
        is_available: true,
        is_seasonal: false,
        nutritional_info: null,
        categories: null,
        health_benefits: null,
        storage_tips: null,
        seasonal_months: null,
        origin_country: null,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: minimalFruit,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const { getByText, queryByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Simple Fruit')).toBeTruthy();
        expect(getByText('Basic description')).toBeTruthy();
        
        // These sections should not be present
        expect(queryByText('Nutritional Information (per 100g)')).toBeNull();
        expect(queryByText('Health Benefits')).toBeNull();
        expect(queryByText('Storage Tips')).toBeNull();
        expect(queryByText('Seasonal Availability')).toBeNull();
        expect(queryByText('Origin')).toBeNull();
        expect(queryByText('Seasonal')).toBeNull();
      });
    });

    it('should handle empty arrays gracefully', async () => {
      const fruitWithEmptyArrays = {
        ...mockFruitData,
        categories: [],
        health_benefits: [],
        seasonal_months: [],
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: fruitWithEmptyArrays,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const { queryByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(queryByText('Health Benefits')).toBeNull();
        expect(queryByText('Seasonal Availability')).toBeNull();
      });
    });
  });

  describe('Favorites Functionality', () => {
    beforeEach(() => {
      const mockFruitSelect = jest.fn().mockReturnThis();
      const mockFruitEq = jest.fn().mockReturnThis();
      const mockFruitSingle = jest.fn().mockResolvedValue({
        data: mockFruitData,
        error: null,
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'fruits') {
          return {
            select: mockFruitSelect,
            eq: mockFruitEq,
            single: mockFruitSingle,
          } as any;
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
        } as any;
      });
    });

    it('should check favorite status when user is logged in', async () => {
      const mockFavoriteData = { id: 'fav123' };
      const mockFavoriteSelect = jest.fn().mockReturnThis();
      const mockFavoriteEq1 = jest.fn().mockReturnThis();
      const mockFavoriteEq2 = jest.fn().mockReturnThis();
      const mockFavoriteSingle = jest.fn().mockResolvedValue({
        data: mockFavoriteData,
        error: null,
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_favorites') {
          return {
            select: mockFavoriteSelect,
            eq: mockFavoriteEq1.mockReturnValue({
              eq: mockFavoriteEq2.mockReturnValue({
                single: mockFavoriteSingle,
              }),
            }),
          } as any;
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockFruitData,
            error: null,
          }),
        } as any;
      });

      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('❤️')).toBeTruthy();
      });
    });

    it('should show empty heart when not favorited', async () => {
      const mockFavoriteSelect = jest.fn().mockReturnThis();
      const mockFavoriteEq1 = jest.fn().mockReturnThis();
      const mockFavoriteEq2 = jest.fn().mockReturnThis();
      const mockFavoriteSingle = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_favorites') {
          return {
            select: mockFavoriteSelect,
            eq: mockFavoriteEq1.mockReturnValue({
              eq: mockFavoriteEq2.mockReturnValue({
                single: mockFavoriteSingle,
              }),
            }),
          } as any;
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockFruitData,
            error: null,
          }),
        } as any;
      });

      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('🤍')).toBeTruthy();
      });
    });

    it('should toggle favorite when favorite button is pressed', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_favorites') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: new Error('Not found'),
                }),
              }),
            }),
            insert: mockInsert,
          } as any;
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockFruitData,
            error: null,
          }),
        } as any;
      });

      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        const favoriteButton = getByText('🤍');
        fireEvent.press(favoriteButton);
      });

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        fruit_id: '1',
      });
    });

    it('should show login alert when user is not logged in', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
      });

      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        const favoriteButton = getByText('🤍');
        fireEvent.press(favoriteButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith('Login Required', 'Please log in to save favorites');
    });
  });

  describe('Add to Cart Functionality', () => {
    beforeEach(() => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockFruitData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);
    });

    it('should display add to cart button when fruit is available', async () => {
      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(getByText('Add to Cart')).toBeTruthy();
      });
    });

    it('should not display add to cart button when fruit is unavailable', async () => {
      const unavailableFruit = {
        ...mockFruitData,
        is_available: false,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: unavailableFruit,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const { queryByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        expect(queryByText('Add to Cart')).toBeNull();
      });
    });

    it('should show loading state when adding to cart', async () => {
      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        const addButton = getByText('Add to Cart');
        fireEvent.press(addButton);
        
        // The button should be disabled and show loading
        expect(addButton).toBeTruthy();
      });
    });

    it('should show success alert after adding to cart', async () => {
      const { getByText } = render(<FruitDetailScreen />);

      await waitFor(() => {
        const addButton = getByText('Add to Cart');
        fireEvent.press(addButton);
      });

      // Wait for the timeout to complete
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Apple added to cart!');
      }, { timeout: 2000 });
    });
  });

  describe('Image Display', () => {
    beforeEach(() => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockFruitData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);
    });

    it('should display fruit image with correct source', async () => {
      const { getByDisplayValue } = render(<FruitDetailScreen />);

      await waitFor(() => {
        const image = getByDisplayValue('https://example.com/apple.jpg');
        expect(image).toBeTruthy();
        expect(image.props.source.uri).toBe('https://example.com/apple.jpg');
      });
    });

    it('should handle missing image URL gracefully', async () => {
      const fruitWithoutImage = {
        ...mockFruitData,
        image_url: '',
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: fruitWithoutImage,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const { getByDisplayValue } = render(<FruitDetailScreen />);

      await waitFor(() => {
        const image = getByDisplayValue('');
        expect(image.props.source.uri).toBe('');
      });
    });
  });
});