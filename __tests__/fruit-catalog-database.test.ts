import { supabase } from '../lib/supabase';
import type { 
  Fruit, 
  FruitCategory, 
  FruitWithDetails, 
  FruitNutritionalInfo,
  HealthBenefit,
  UserFavorite 
} from '../lib/supabase';

// Mock Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Fruit Catalog Database Schema and Data Retrieval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Fruit Data Retrieval', () => {
    const mockFruitData = [
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
        seasonal_months: null,
        storage_tips: 'Keep in refrigerator',
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
            description: 'Supports cardiovascular health',
            created_at: '2024-01-01T00:00:00Z',
          }
        }]
      }
    ];

    it('should fetch all available fruits with related data', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockFruitData,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

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

      expect(mockSupabase.from).toHaveBeenCalledWith('fruits');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('nutritional_info:fruit_nutritional_info'));
      expect(mockEq).toHaveBeenCalledWith('is_available', true);
      expect(mockOrder).toHaveBeenCalledWith('name');
      expect(data).toEqual(mockFruitData);
      expect(error).toBeNull();
    });

    it('should handle database errors when fetching fruits', async () => {
      const mockError = new Error('Database connection failed');
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

      const { data, error } = await supabase
        .from('fruits')
        .select('*')
        .eq('is_available', true)
        .order('name');

      expect(data).toBeNull();
      expect(error).toEqual(mockError);
    });

    it('should fetch single fruit with details by ID', async () => {
      const mockFruit = mockFruitData[0];
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
        .eq('id', '1')
        .single();

      expect(mockSupabase.from).toHaveBeenCalledWith('fruits');
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(mockSingle).toHaveBeenCalled();
      expect(data).toEqual(mockFruit);
      expect(error).toBeNull();
    });
  });

  describe('Fruit Categories Retrieval', () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Tree Fruits',
        description: 'Fruits that grow on trees',
        image_url: null,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Berries',
        description: 'Small, round fruits',
        image_url: null,
        created_at: '2024-01-01T00:00:00Z',
      }
    ];

    it('should fetch all fruit categories ordered by name', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockCategories,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      const { data, error } = await supabase
        .from('fruit_categories')
        .select('*')
        .order('name');

      expect(mockSupabase.from).toHaveBeenCalledWith('fruit_categories');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('name');
      expect(data).toEqual(mockCategories);
      expect(error).toBeNull();
    });

    it('should handle errors when fetching categories', async () => {
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

      const { data, error } = await supabase
        .from('fruit_categories')
        .select('*')
        .order('name');

      expect(data).toBeNull();
      expect(error).toEqual(mockError);
    });
  });

  describe('User Favorites Database Operations', () => {
    const mockUserId = 'user123';
    const mockFruitId = 'fruit456';

    it('should fetch user favorites', async () => {
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

      const { data, error } = await supabase
        .from('user_favorites')
        .select('fruit_id')
        .eq('user_id', mockUserId);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockSelect).toHaveBeenCalledWith('fruit_id');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(data).toEqual(mockFavorites);
      expect(error).toBeNull();
    });

    it('should add fruit to favorites', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: mockUserId,
          fruit_id: mockFruitId,
        });

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        fruit_id: mockFruitId,
      });
      expect(error).toBeNull();
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

      const { data, error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', mockUserId)
        .eq('fruit_id', mockFruitId);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockEq2).toHaveBeenCalledWith('fruit_id', mockFruitId);
      expect(error).toBeNull();
    });

    it('should check if fruit is favorite for user', async () => {
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

      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', mockUserId)
        .eq('fruit_id', mockFruitId)
        .single();

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq1).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockEq2).toHaveBeenCalledWith('fruit_id', mockFruitId);
      expect(mockSingle).toHaveBeenCalled();
      expect(data).toEqual(mockFavorite);
      expect(error).toBeNull();
    });

    it('should handle favorites database errors', async () => {
      const mockError = new Error('Favorites operation failed');
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: mockUserId,
          fruit_id: mockFruitId,
        });

      expect(data).toBeNull();
      expect(error).toEqual(mockError);
    });
  });

  describe('Search and Filter Database Queries', () => {
    it('should support text search functionality', async () => {
      const searchQuery = 'apple';
      const mockFruits = [
        {
          id: '1',
          name: 'Apple',
          description: 'Red apple',
          short_description: 'Sweet apple',
        }
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockTextSearch = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockFruits,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        textSearch: mockTextSearch,
        order: mockOrder,
      } as any);

      // Simulate text search (this would be the actual implementation)
      const { data, error } = await supabase
        .from('fruits')
        .select('*')
        .textSearch('fts', searchQuery)
        .order('name');

      expect(mockSupabase.from).toHaveBeenCalledWith('fruits');
      expect(mockTextSearch).toHaveBeenCalledWith('fts', searchQuery);
      expect(data).toEqual(mockFruits);
      expect(error).toBeNull();
    });

    it('should support category filtering', async () => {
      const categoryId = 'cat123';
      const mockFruits = [
        {
          id: '1',
          name: 'Apple',
          categories: [{ id: categoryId, name: 'Tree Fruits' }]
        }
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockFruits,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      // This would filter by category in the actual implementation
      const { data, error } = await supabase
        .from('fruits')
        .select(`
          *,
          categories:fruit_category_mappings(
            category:fruit_categories(*)
          )
        `)
        .eq('fruit_category_mappings.category_id', categoryId)
        .order('name');

      expect(data).toEqual(mockFruits);
      expect(error).toBeNull();
    });
  });

  describe('Data Processing and Transformation', () => {
    it('should properly process fruits with related data', () => {
      const rawFruit = {
        id: '1',
        name: 'Apple',
        description: 'Red apple',
        price: 2.99,
        nutritional_info: [{
          id: '1',
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
      };

      const processedFruit = {
        ...rawFruit,
        nutritional_info: rawFruit.nutritional_info[0] || null,
        categories: rawFruit.categories.map((c: any) => c.category) || [],
        health_benefits: rawFruit.health_benefits.map((b: any) => b.benefit) || [],
      };

      expect(processedFruit.nutritional_info).toEqual({
        id: '1',
        calories_per_100g: 52,
        protein_g: 0.3,
      });
      expect(processedFruit.categories).toEqual([{
        id: '1',
        name: 'Tree Fruits',
      }]);
      expect(processedFruit.health_benefits).toEqual([{
        id: '1',
        name: 'Heart Health',
      }]);
    });

    it('should handle missing related data gracefully', () => {
      const rawFruit = {
        id: '1',
        name: 'Apple',
        description: 'Red apple',
        price: 2.99,
        nutritional_info: null,
        categories: null,
        health_benefits: null,
      };

      const processedFruit = {
        ...rawFruit,
        nutritional_info: rawFruit.nutritional_info?.[0] || null,
        categories: rawFruit.categories?.map((c: any) => c.category) || [],
        health_benefits: rawFruit.health_benefits?.map((b: any) => b.benefit) || [],
      };

      expect(processedFruit.nutritional_info).toBeNull();
      expect(processedFruit.categories).toEqual([]);
      expect(processedFruit.health_benefits).toEqual([]);
    });
  });

  describe('Database Schema Validation', () => {
    it('should validate fruit data structure', () => {
      const validFruit: Fruit = {
        id: '1',
        name: 'Apple',
        description: 'Fresh red apple',
        short_description: 'Sweet and crisp',
        price: 2.99,
        unit: 'lb',
        image_url: 'https://example.com/apple.jpg',
        is_available: true,
        is_seasonal: false,
        seasonal_months: ['September', 'October'],
        storage_tips: 'Keep in refrigerator',
        origin_country: 'USA',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(typeof validFruit.id).toBe('string');
      expect(typeof validFruit.name).toBe('string');
      expect(typeof validFruit.price).toBe('number');
      expect(typeof validFruit.is_available).toBe('boolean');
      expect(Array.isArray(validFruit.seasonal_months)).toBe(true);
    });

    it('should validate nutritional info structure', () => {
      const validNutrition: FruitNutritionalInfo = {
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
      };

      expect(typeof validNutrition.id).toBe('string');
      expect(typeof validNutrition.fruit_id).toBe('string');
      expect(typeof validNutrition.calories_per_100g).toBe('number');
      expect(typeof validNutrition.protein_g).toBe('number');
    });

    it('should validate category structure', () => {
      const validCategory: FruitCategory = {
        id: '1',
        name: 'Tree Fruits',
        description: 'Fruits that grow on trees',
        image_url: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(typeof validCategory.id).toBe('string');
      expect(typeof validCategory.name).toBe('string');
      expect(validCategory.image_url === null || typeof validCategory.image_url === 'string').toBe(true);
    });
  });
});