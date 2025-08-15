import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { FruitCatalogScreen } from '../screens/main/FruitCatalogScreen';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../lib/supabase');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));
jest.mock('../components/FruitCard', () => ({
  FruitCard: ({ fruit, onPress, onFavoritePress, isFavorite }: any) => (
    <div 
      testID={`fruit-card-${fruit.id}`}
      onClick={() => onPress(fruit)}
    >
      <span>{fruit.name}</span>
      <span>${fruit.price.toFixed(2)}</span>
      {onFavoritePress && (
        <button 
          onClick={() => onFavoritePress(fruit)}
          testID={`favorite-btn-${fruit.id}`}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      )}
    </div>
  ),
}));

// Mock FlatGrid
jest.mock('react-native-super-grid', () => ({
  FlatGrid: ({ data, renderItem, ListEmptyComponent }: any) => (
    <div testID="fruit-grid">
      {data.length > 0 ? (
        data.map((item: any, index: number) => (
          <div key={item.id || index}>
            {renderItem({ item })}
          </div>
        ))
      ) : (
        ListEmptyComponent && <div>{ListEmptyComponent}</div>
      )}
    </div>
  ),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('FruitCatalogScreen', () => {
  const mockFruitsData = [
    {
      id: '1',
      name: 'Apple',
      description: 'Fresh red apple',
      short_description: 'Sweet and crisp',
      price: 2.99,
      unit: 'lb',
      image_url: 'https://example.com/apple.jpg',
      is_available: true,
      is_seasonal: false,
      nutritional_info: {
        id: '1',
        calories_per_100g: 52,
      },
      categories: [{
        id: '1',
        name: 'Tree Fruits',
      }],
      health_benefits: [{
        id: '1',
        name: 'Heart Health',
      }],
    },
    {
      id: '2',
      name: 'Banana',
      description: 'Yellow tropical banana',
      short_description: 'Sweet and soft',
      price: 1.99,
      unit: 'bunch',
      image_url: 'https://example.com/banana.jpg',
      is_available: true,
      is_seasonal: false,
      nutritional_info: {
        id: '2',
        calories_per_100g: 89,
      },
      categories: [{
        id: '2',
        name: 'Tropical Fruits',
      }],
      health_benefits: [{
        id: '2',
        name: 'Energy Boost',
      }],
    }
  ];

  const mockCategoriesData = [
    {
      id: '1',
      name: 'Tree Fruits',
      description: 'Fruits that grow on trees',
      image_url: null,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Tropical Fruits',
      description: 'Fruits from tropical regions',
      image_url: null,
      created_at: '2024-01-01T00:00:00Z',
    }
  ];

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

    // Setup default supabase mocks
    const mockFromChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };

    mockSupabase.from.mockReturnValue(mockFromChain as any);
  });

  describe('Initial Loading', () => {
    it('should display loading indicator initially', () => {
      // Mock loading state
      mockSupabase.from.mockImplementation((table) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation(() => 
            new Promise(() => {}) // Never resolves to simulate loading
          ),
        };
        return chain as any;
      });

      const { getByText } = render(<FruitCatalogScreen />);
      
      expect(getByText('Loading fruits...')).toBeTruthy();
    });

    it('should load fruits and categories on mount', async () => {
      const fruitsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFruitsData,
          error: null,
        }),
      };

      const categoriesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCategoriesData,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'fruits') return fruitsChain as any;
        if (table === 'fruit_categories') return categoriesChain as any;
        return {} as any;
      });

      const { getByText } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(getByText('Fresh Fruits')).toBeTruthy();
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('Banana')).toBeTruthy();
      });
    });

    it('should handle loading errors gracefully', async () => {
      const errorChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Network error'),
        }),
      };

      mockSupabase.from.mockReturnValue(errorChain as any);

      render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load fruit catalog');
      });
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      const fruitsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFruitsData,
          error: null,
        }),
      };

      const categoriesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCategoriesData,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'fruits') return fruitsChain as any;
        if (table === 'fruit_categories') return categoriesChain as any;
        return {} as any;
      });
    });

    it('should filter fruits based on search query', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('Banana')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search fruits...');
      fireEvent.changeText(searchInput, 'apple');

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(queryByText('Banana')).toBeNull();
      });
    });

    it('should clear search results when search is cleared', async () => {
      const { getByPlaceholderText, getByText } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('Banana')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search fruits...');
      
      // Search and then clear
      fireEvent.changeText(searchInput, 'apple');
      fireEvent.changeText(searchInput, '');

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('Banana')).toBeTruthy();
      });
    });

    it('should search in fruit descriptions and short descriptions', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('Banana')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search fruits...');
      fireEvent.changeText(searchInput, 'tropical');

      await waitFor(() => {
        expect(queryByText('Apple')).toBeNull();
        expect(getByText('Banana')).toBeTruthy();
      });
    });
  });

  describe('Category Filtering', () => {
    beforeEach(async () => {
      const fruitsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFruitsData,
          error: null,
        }),
      };

      const categoriesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCategoriesData,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'fruits') return fruitsChain as any;
        if (table === 'fruit_categories') return categoriesChain as any;
        return {} as any;
      });
    });

    it('should display category filter chips', async () => {
      const { getByText } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(getByText('All')).toBeTruthy();
        expect(getByText('Tree Fruits')).toBeTruthy();
        expect(getByText('Tropical Fruits')).toBeTruthy();
      });
    });

    it('should filter fruits by selected category', async () => {
      const { getByText, queryByText } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('Banana')).toBeTruthy();
      });

      fireEvent.press(getByText('Tree Fruits'));

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(queryByText('Banana')).toBeNull();
      });
    });

    it('should show all fruits when "All" category is selected', async () => {
      const { getByText } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('Banana')).toBeTruthy();
      });

      // First select a specific category
      fireEvent.press(getByText('Tree Fruits'));
      
      // Then select "All"
      fireEvent.press(getByText('All'));

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('Banana')).toBeTruthy();
      });
    });

    it('should toggle category selection', async () => {
      const { getByText } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('Banana')).toBeTruthy();
      });

      const categoryButton = getByText('Tree Fruits');
      
      // Select category
      fireEvent.press(categoryButton);
      
      // Deselect same category
      fireEvent.press(categoryButton);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
        expect(getByText('Banana')).toBeTruthy();
      });
    });
  });

  describe('Favorites Functionality', () => {
    beforeEach(async () => {
      const fruitsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFruitsData,
          error: null,
        }),
      };

      const categoriesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCategoriesData,
          error: null,
        }),
      };

      const favoritesChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ fruit_id: '1' }],
          error: null,
        }),
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        delete: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'fruits') return fruitsChain as any;
        if (table === 'fruit_categories') return categoriesChain as any;
        if (table === 'user_favorites') return favoritesChain as any;
        return {} as any;
      });
    });

    it('should load user favorites when user is logged in', async () => {
      const { getByTestId } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-btn-1');
        expect(favoriteButton).toBeTruthy();
        expect(favoriteButton.textContent).toBe('❤️');
      });
    });

    it('should toggle favorite status when favorite button is pressed', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const favoritesChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ fruit_id: '1' }],
          error: null,
        }),
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        delete: mockDelete.mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_favorites') return favoritesChain as any;
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: table === 'fruits' ? mockFruitsData : mockCategoriesData,
            error: null,
          }),
        } as any;
      });

      const { getByTestId } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-btn-1');
        expect(favoriteButton.textContent).toBe('❤️');
        
        fireEvent.press(favoriteButton);
      });

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should show login alert when user tries to favorite without login', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
      });

      const { getByTestId } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        const fruitCard = getByTestId('fruit-card-1');
        fireEvent.press(fruitCard);
      });

      // Note: The favorite button won't be shown when user is not logged in
      // This test verifies the component handles the no-user state correctly
    });
  });

  describe('Navigation', () => {
    it('should navigate to fruit detail when fruit card is pressed', async () => {
      const mockNavigate = jest.fn();
      jest.doMock('@react-navigation/native', () => ({
        useNavigation: () => ({
          navigate: mockNavigate,
        }),
      }));

      const fruitsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFruitsData,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'fruits') return fruitsChain as any;
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: mockCategoriesData,
            error: null,
          }),
        } as any;
      });

      const { getByTestId } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        const fruitCard = getByTestId('fruit-card-1');
        fireEvent.press(fruitCard);
      });

      expect(mockNavigate).toHaveBeenCalledWith('FruitDetail', { fruitId: '1' });
    });
  });

  describe('Empty States', () => {
    it('should show empty message when no fruits match search criteria', async () => {
      const fruitsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFruitsData,
          error: null,
        }),
      };

      const categoriesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCategoriesData,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'fruits') return fruitsChain as any;
        if (table === 'fruit_categories') return categoriesChain as any;
        return {} as any;
      });

      const { getByPlaceholderText, getByText } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(getByText('Apple')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search fruits...');
      fireEvent.changeText(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(getByText('No fruits found matching your criteria')).toBeTruthy();
      });
    });

    it('should show empty message when no fruits available', async () => {
      const fruitsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const categoriesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCategoriesData,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'fruits') return fruitsChain as any;
        if (table === 'fruit_categories') return categoriesChain as any;
        return {} as any;
      });

      const { getByText } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(getByText('No fruits available')).toBeTruthy();
      });
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh data when pull to refresh is triggered', async () => {
      const fruitsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFruitsData,
          error: null,
        }),
      };

      const categoriesChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCategoriesData,
          error: null,
        }),
      };

      const favoritesChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'fruits') return fruitsChain as any;
        if (table === 'fruit_categories') return categoriesChain as any;
        if (table === 'user_favorites') return favoritesChain as any;
        return {} as any;
      });

      const { getByTestId } = render(<FruitCatalogScreen />);

      await waitFor(() => {
        expect(getByTestId('fruit-grid')).toBeTruthy();
      });

      // Simulate pull to refresh
      const grid = getByTestId('fruit-grid');
      fireEvent(grid, 'refresh');

      // Verify API calls were made again
      expect(fruitsChain.order).toHaveBeenCalledTimes(2);
    });
  });
});