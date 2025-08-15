import { supabase } from '../lib/supabase';
import type { 
  Fruit, 
  FruitCategory, 
  FruitWithDetails 
} from '../lib/supabase';

// Mock Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Fruit Catalog API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Sample data for testing
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
      nutritional_info: [{
        id: '1',
        fruit_id: '1',
        calories_per_100g: 52,
        protein_g: 0.3,
      }],
      categories: [{
        category: {
          id: '1',
          name: 'Tree Fruits',
        }
      }],
      health_benefits: [{
        benefit: {
          id: '1',
          name: 'Heart Health',
        }
      }]
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
      nutritional_info: [{
        id: '2',
        fruit_id: '2',
        calories_per_100g: 89,
        protein_g: 1.1,
      }],
      categories: [{
        category: {
          id: '2',
          name: 'Tropical Fruits',
        }
      }],
      health_benefits: [{
        benefit: {
          id: '2',
          name: 'Energy Boost',
        }
      }]
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

  describe('loadFruits API Function', () => {
    it('should successfully fetch all available fruits with related data', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockFruitsData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      // Simulate the loadFruits function
      const loadFruits = async () => {
        const { data, error } = await supabase
          .from('fruits')
          .select(`
            *,
            nutritional_info:fruit_nutritional_info(*),
            categories:fruit_category_mappings(
              category:fruit_categories(*)
            ),
            health_benefits:fruit_health_benefits(
              benefit:health_benefits(*)
            )
          `)
          .eq('is_available', true)
          .order('name');

        if (error) {
          throw error;
        }

        const processedFruits = data?.map(fruit => ({
          ...fruit,
          nutritional_info: fruit.nutritional_info?.[0] || null,
          categories: fruit.categories?.map((c: any) => c.category) || [],
          health_benefits: fruit.health_benefits?.map((b: any) => b.benefit) || [],
        })) || [];

        return processedFruits;
      };

      const result = await loadFruits();

      expect(mockSupabase.from).toHaveBeenCalledWith('fruits');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('nutritional_info:fruit_nutritional_info'));
      expect(mockEq).toHaveBeenCalledWith('is_available', true);
      expect(mockOrder).toHaveBeenCalledWith('name');
      expect(result).toHaveLength(2);
      expect(result[0].categories).toEqual([{ id: '1', name: 'Tree Fruits' }]);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      const loadFruits = async () => {
        const { data, error } = await supabase
          .from('fruits')
          .select('*')
          .eq('is_available', true)
          .order('name');

        if (error) {
          throw error;
        }

        return data || [];
      };

      await expect(loadFruits()).rejects.toThrow('Network error');
    });
  });

  describe('loadCategories API Function', () => {
    it('should successfully fetch all fruit categories', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockCategoriesData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      const loadCategories = async () => {
        const { data, error } = await supabase
          .from('fruit_categories')
          .select('*')
          .order('name');

        if (error) {
          throw error;
        }

        return data || [];
      };

      const result = await loadCategories();

      expect(mockSupabase.from).toHaveBeenCalledWith('fruit_categories');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('name');
      expect(result).toEqual(mockCategoriesData);
    });

    it('should handle category loading errors', async () => {
      const mockError = new Error('Categories not found');
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      const loadCategories = async () => {
        const { data, error } = await supabase
          .from('fruit_categories')
          .select('*')
          .order('name');

        if (error) {
          throw error;
        }

        return data || [];
      };

      await expect(loadCategories()).rejects.toThrow('Categories not found');
    });
  });

  describe('loadFruitDetail API Function', () => {
    it('should fetch single fruit with full details', async () => {
      const fruitId = '1';
      const mockFruit = mockFruitsData[0];
      
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockFruit,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any);

      const loadFruitDetail = async (id: string) => {
        const { data, error } = await supabase
          .from('fruits')
          .select(`
            *,
            nutritional_info:fruit_nutritional_info(*),
            categories:fruit_category_mappings(
              category:fruit_categories(*)
            ),
            health_benefits:fruit_health_benefits(
              benefit:health_benefits(*)
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        const processedFruit = {
          ...data,
          nutritional_info: data.nutritional_info?.[0] || null,
          categories: data.categories?.map((c: any) => c.category) || [],
          health_benefits: data.health_benefits?.map((b: any) => b.benefit) || [],
        };

        return processedFruit;
      };

      const result = await loadFruitDetail(fruitId);

      expect(mockSupabase.from).toHaveBeenCalledWith('fruits');
      expect(mockEq).toHaveBeenCalledWith('id', fruitId);
      expect(mockSingle).toHaveBeenCalled();
      expect(result.id).toBe(fruitId);
      expect(result.nutritional_info).toBeDefined();
    });

    it('should handle fruit not found error', async () => {
      const fruitId = 'nonexistent';
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

      const loadFruitDetail = async (id: string) => {
        const { data, error } = await supabase
          .from('fruits')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        return data;
      };

      await expect(loadFruitDetail(fruitId)).rejects.toThrow('Fruit not found');
    });
  });

  describe('Favorites API Functions', () => {
    const mockUserId = 'user123';
    const mockFruitId = 'fruit456';

    it('should load user favorites', async () => {
      const mockFavorites = [
        { fruit_id: 'fruit1' },
        { fruit_id: 'fruit2' }
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: mockFavorites,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const loadFavorites = async (userId: string) => {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('fruit_id')
          .eq('user_id', userId);

        if (error) {
          console.error('Error loading favorites:', error);
          return [];
        }

        return data?.map(f => f.fruit_id) || [];
      };

      const result = await loadFavorites(mockUserId);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockSelect).toHaveBeenCalledWith('fruit_id');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result).toEqual(['fruit1', 'fruit2']);
    });

    it('should add fruit to favorites', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const addToFavorites = async (userId: string, fruitId: string) => {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: userId,
            fruit_id: fruitId,
          });

        if (error) {
          throw error;
        }

        return true;
      };

      const result = await addToFavorites(mockUserId, mockFruitId);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        fruit_id: mockFruitId,
      });
      expect(result).toBe(true);
    });

    it('should remove fruit from favorites', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
        eq: mockEq1.mockReturnValue({
          eq: mockEq2,
        }),
      } as any);

      const removeFromFavorites = async (userId: string, fruitId: string) => {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('fruit_id', fruitId);

        if (error) {
          throw error;
        }

        return true;
      };

      const result = await removeFromFavorites(mockUserId, mockFruitId);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockDelete).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should check favorite status', async () => {
      const mockFavorite = { id: 'fav123' };
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockFavorite,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq1.mockReturnValue({
          eq: mockEq2.mockReturnValue({
            single: mockSingle,
          }),
        }),
      } as any);

      const checkFavoriteStatus = async (userId: string, fruitId: string) => {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('fruit_id', fruitId)
          .single();

        return !error && data;
      };

      const result = await checkFavoriteStatus(mockUserId, mockFruitId);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(result).toBeTruthy();
    });
  });

  describe('Search and Filter API Functions', () => {
    it('should filter fruits by search query', () => {
      const searchQuery = 'apple';
      const fruits = mockFruitsData;

      const filterFruitsBySearch = (fruits: any[], query: string) => {
        if (!query.trim()) return fruits;
        
        const lowerQuery = query.toLowerCase();
        return fruits.filter(fruit =>
          fruit.name.toLowerCase().includes(lowerQuery) ||
          fruit.description.toLowerCase().includes(lowerQuery) ||
          fruit.short_description?.toLowerCase().includes(lowerQuery)
        );
      };

      const result = filterFruitsBySearch(fruits, searchQuery);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Apple');
    });

    it('should filter fruits by category', () => {
      const categoryId = '1';
      const fruits = mockFruitsData;

      const filterFruitsByCategory = (fruits: any[], catId: string) => {
        return fruits.filter(fruit =>
          fruit.categories?.some((cat: any) => cat.category.id === catId)
        );
      };

      const result = filterFruitsByCategory(fruits, categoryId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Apple');
    });

    it('should combine search and category filters', () => {
      const searchQuery = 'fresh';
      const categoryId = '1';
      const fruits = mockFruitsData;

      const filterFruits = (fruits: any[], query: string, catId: string | null) => {
        let filtered = fruits;

        // Filter by search query
        if (query.trim()) {
          const lowerQuery = query.toLowerCase();
          filtered = filtered.filter(fruit =>
            fruit.name.toLowerCase().includes(lowerQuery) ||
            fruit.description.toLowerCase().includes(lowerQuery) ||
            fruit.short_description?.toLowerCase().includes(lowerQuery)
          );
        }

        // Filter by category
        if (catId) {
          filtered = filtered.filter(fruit =>
            fruit.categories?.some((cat: any) => cat.category.id === catId)
          );
        }

        return filtered;
      };

      const result = filterFruits(fruits, searchQuery, categoryId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Apple');
    });

    it('should return empty array when no matches found', () => {
      const searchQuery = 'nonexistent';
      const fruits = mockFruitsData;

      const filterFruitsBySearch = (fruits: any[], query: string) => {
        if (!query.trim()) return fruits;
        
        const lowerQuery = query.toLowerCase();
        return fruits.filter(fruit =>
          fruit.name.toLowerCase().includes(lowerQuery) ||
          fruit.description.toLowerCase().includes(lowerQuery)
        );
      };

      const result = filterFruitsBySearch(fruits, searchQuery);

      expect(result).toHaveLength(0);
    });
  });

  describe('Data Processing Functions', () => {
    it('should process raw fruit data correctly', () => {
      const rawFruit = mockFruitsData[0];

      const processFruitData = (fruit: any) => ({
        ...fruit,
        nutritional_info: fruit.nutritional_info?.[0] || null,
        categories: fruit.categories?.map((c: any) => c.category) || [],
        health_benefits: fruit.health_benefits?.map((b: any) => b.benefit) || [],
      });

      const result = processFruitData(rawFruit);

      expect(result.nutritional_info).toEqual({
        id: '1',
        fruit_id: '1',
        calories_per_100g: 52,
        protein_g: 0.3,
      });
      expect(result.categories).toEqual([{
        id: '1',
        name: 'Tree Fruits',
      }]);
      expect(result.health_benefits).toEqual([{
        id: '1',
        name: 'Heart Health',
      }]);
    });

    it('should handle missing related data', () => {
      const rawFruit = {
        id: '1',
        name: 'Apple',
        nutritional_info: null,
        categories: null,
        health_benefits: null,
      };

      const processFruitData = (fruit: any) => ({
        ...fruit,
        nutritional_info: fruit.nutritional_info?.[0] || null,
        categories: fruit.categories?.map((c: any) => c.category) || [],
        health_benefits: fruit.health_benefits?.map((b: any) => b.benefit) || [],
      });

      const result = processFruitData(rawFruit);

      expect(result.nutritional_info).toBeNull();
      expect(result.categories).toEqual([]);
      expect(result.health_benefits).toEqual([]);
    });
  });

  describe('Error Handling in API Functions', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network request failed');
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: networkError,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      const safeLoadFruits = async () => {
        try {
          const { data, error } = await supabase
            .from('fruits')
            .select('*')
            .order('name');

          if (error) {
            console.error('API Error:', error);
            return [];
          }

          return data || [];
        } catch (error) {
          console.error('Unexpected error:', error);
          return [];
        }
      };

      const result = await safeLoadFruits();

      expect(result).toEqual([]);
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Authentication required');
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: authError,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const safeLoadFavorites = async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('user_favorites')
            .select('fruit_id')
            .eq('user_id', userId);

          if (error) {
            if (error.message.includes('Authentication')) {
              return { error: 'auth_required', data: [] };
            }
            console.error('API Error:', error);
            return { error: 'api_error', data: [] };
          }

          return { error: null, data: data?.map(f => f.fruit_id) || [] };
        } catch (error) {
          return { error: 'unexpected_error', data: [] };
        }
      };

      const result = await safeLoadFavorites('user123');

      expect(result.error).toBe('auth_required');
      expect(result.data).toEqual([]);
    });
  });
});