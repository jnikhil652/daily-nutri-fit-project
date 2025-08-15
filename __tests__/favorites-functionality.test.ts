import { renderHook, act } from '@testing-library/react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Fruit, UserFavorite } from '../lib/supabase';

// Mock Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Favorites Functionality', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
  };

  const mockFruit: Fruit = {
    id: 'fruit1',
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
  };

  const mockFavorites: UserFavorite[] = [
    {
      id: 'fav1',
      user_id: 'user123',
      fruit_id: 'fruit1',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'fav2',
      user_id: 'user123',
      fruit_id: 'fruit2',
      created_at: '2024-01-01T00:00:00Z',
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Load Favorites', () => {
    it('should load user favorites successfully', async () => {
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

      const result = await loadFavorites(mockUser.id);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockSelect).toHaveBeenCalledWith('fruit_id');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result).toEqual(['fruit1', 'fruit2']);
    });

    it('should handle favorites loading errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
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

      const result = await loadFavorites(mockUser.id);

      expect(result).toEqual([]);
    });

    it('should return empty array when user has no favorites', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: [],
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

      const result = await loadFavorites(mockUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('Add to Favorites', () => {
    it('should add fruit to favorites successfully', async () => {
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

      const result = await addToFavorites(mockUser.id, mockFruit.id);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        fruit_id: mockFruit.id,
      });
      expect(result).toBe(true);
    });

    it('should handle add to favorites errors', async () => {
      const mockError = new Error('Insert failed');
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
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

      await expect(addToFavorites(mockUser.id, mockFruit.id)).rejects.toThrow('Insert failed');
    });

    it('should handle duplicate favorite entries', async () => {
      const duplicateError = new Error('duplicate key value violates unique constraint');
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: duplicateError,
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
          if (error.message.includes('duplicate key')) {
            return false; // Already favorited
          }
          throw error;
        }

        return true;
      };

      const result = await addToFavorites(mockUser.id, mockFruit.id);

      expect(result).toBe(false);
    });
  });

  describe('Remove from Favorites', () => {
    it('should remove fruit from favorites successfully', async () => {
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

      const result = await removeFromFavorites(mockUser.id, mockFruit.id);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockEq2).toHaveBeenCalledWith('fruit_id', mockFruit.id);
      expect(result).toBe(true);
    });

    it('should handle remove from favorites errors', async () => {
      const mockError = new Error('Delete failed');
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
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

      await expect(removeFromFavorites(mockUser.id, mockFruit.id)).rejects.toThrow('Delete failed');
    });

    it('should handle removing non-existent favorite', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockResolvedValue({
        data: null,
        error: null,
        count: 0, // No rows affected
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
        eq: mockEq1.mockReturnValue({
          eq: mockEq2,
        }),
      } as any);

      const removeFromFavorites = async (userId: string, fruitId: string) => {
        const { error, count } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('fruit_id', fruitId);

        if (error) {
          throw error;
        }

        return count > 0;
      };

      const result = await removeFromFavorites(mockUser.id, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('Check Favorite Status', () => {
    it('should return true when fruit is favorited', async () => {
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

      const result = await checkFavoriteStatus(mockUser.id, mockFruit.id);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_favorites');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq1).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockEq2).toHaveBeenCalledWith('fruit_id', mockFruit.id);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should return false when fruit is not favorited', async () => {
      const mockError = new Error('Not found');
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
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

      const result = await checkFavoriteStatus(mockUser.id, 'nonexistent');

      expect(result).toBeFalsy();
    });
  });

  describe('Favorites State Management', () => {
    const useFavoritesState = () => {
      const [favorites, setFavorites] = useState<string[]>([]);
      const [loading, setLoading] = useState(false);

      const loadFavorites = async (userId: string) => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('user_favorites')
            .select('fruit_id')
            .eq('user_id', userId);

          if (error) {
            console.error('Error loading favorites:', error);
            return;
          }

          setFavorites(data?.map(f => f.fruit_id) || []);
        } finally {
          setLoading(false);
        }
      };

      const addToFavorites = async (userId: string, fruitId: string) => {
        try {
          const { error } = await supabase
            .from('user_favorites')
            .insert({
              user_id: userId,
              fruit_id: fruitId,
            });

          if (error) {
            throw error;
          }

          // Optimistic UI update
          setFavorites(prev => [...prev, fruitId]);
          return true;
        } catch (error) {
          console.error('Error adding favorite:', error);
          return false;
        }
      };

      const removeFromFavorites = async (userId: string, fruitId: string) => {
        try {
          const { error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', userId)
            .eq('fruit_id', fruitId);

          if (error) {
            throw error;
          }

          // Optimistic UI update
          setFavorites(prev => prev.filter(id => id !== fruitId));
          return true;
        } catch (error) {
          console.error('Error removing favorite:', error);
          return false;
        }
      };

      const isFavorite = (fruitId: string) => favorites.includes(fruitId);

      return {
        favorites,
        loading,
        loadFavorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
      };
    };

    it('should manage favorites state correctly', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: [{ fruit_id: 'fruit1' }, { fruit_id: 'fruit2' }],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      } as any);

      const { result } = renderHook(() => useFavoritesState());

      expect(result.current.favorites).toEqual([]);
      expect(result.current.loading).toBe(false);

      await act(async () => {
        await result.current.loadFavorites(mockUser.id);
      });

      expect(result.current.favorites).toEqual(['fruit1', 'fruit2']);
      expect(result.current.isFavorite('fruit1')).toBe(true);
      expect(result.current.isFavorite('fruit3')).toBe(false);
    });

    it('should handle optimistic UI updates for adding favorites', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      const { result } = renderHook(() => useFavoritesState());

      expect(result.current.favorites).toEqual([]);

      await act(async () => {
        const success = await result.current.addToFavorites(mockUser.id, 'fruit1');
        expect(success).toBe(true);
      });

      expect(result.current.favorites).toEqual(['fruit1']);
      expect(result.current.isFavorite('fruit1')).toBe(true);
    });

    it('should handle optimistic UI updates for removing favorites', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
        eq: mockEq,
        select: jest.fn().mockReturnThis(),
      } as any);

      const { result } = renderHook(() => useFavoritesState());

      // Start with some favorites
      act(() => {
        result.current.favorites.push('fruit1', 'fruit2');
      });

      await act(async () => {
        const success = await result.current.removeFromFavorites(mockUser.id, 'fruit1');
        expect(success).toBe(true);
      });

      expect(result.current.favorites).toEqual(['fruit2']);
      expect(result.current.isFavorite('fruit1')).toBe(false);
      expect(result.current.isFavorite('fruit2')).toBe(true);
    });

    it('should handle loading state correctly', async () => {
      const { result } = renderHook(() => useFavoritesState());

      expect(result.current.loading).toBe(false);

      const loadPromise = act(async () => {
        result.current.loadFavorites(mockUser.id);
      });

      expect(result.current.loading).toBe(true);

      await loadPromise;

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Favorites with Fruit Data', () => {
    it('should load favorite fruits with full data', async () => {
      const mockFavoriteIds = ['fruit1', 'fruit2'];
      const mockFruitsData = [
        {
          id: 'fruit1',
          name: 'Apple',
          price: 2.99,
          image_url: 'https://example.com/apple.jpg',
        },
        {
          id: 'fruit2',
          name: 'Banana',
          price: 1.99,
          image_url: 'https://example.com/banana.jpg',
        }
      ];

      // Mock favorites query
      const mockFavoritesSelect = jest.fn().mockReturnThis();
      const mockFavoritesEq = jest.fn().mockResolvedValue({
        data: mockFavoriteIds.map(id => ({ fruit_id: id })),
        error: null,
      });

      // Mock fruits query
      const mockFruitsSelect = jest.fn().mockReturnThis();
      const mockFruitsIn = jest.fn().mockResolvedValue({
        data: mockFruitsData,
        error: null,
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_favorites') {
          return {
            select: mockFavoritesSelect,
            eq: mockFavoritesEq,
          } as any;
        }
        if (table === 'fruits') {
          return {
            select: mockFruitsSelect,
            in: mockFruitsIn,
          } as any;
        }
        return {} as any;
      });

      const loadFavoriteFruits = async (userId: string) => {
        // First get favorite fruit IDs
        const { data: favoriteData, error: favoriteError } = await supabase
          .from('user_favorites')
          .select('fruit_id')
          .eq('user_id', userId);

        if (favoriteError || !favoriteData?.length) {
          return [];
        }

        const fruitIds = favoriteData.map(f => f.fruit_id);

        // Then get fruit details
        const { data: fruitsData, error: fruitsError } = await supabase
          .from('fruits')
          .select('*')
          .in('id', fruitIds);

        if (fruitsError) {
          return [];
        }

        return fruitsData || [];
      };

      const result = await loadFavoriteFruits(mockUser.id);

      expect(result).toEqual(mockFruitsData);
      expect(mockFavoritesSelect).toHaveBeenCalledWith('fruit_id');
      expect(mockFavoritesEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockFruitsSelect).toHaveBeenCalledWith('*');
      expect(mockFruitsIn).toHaveBeenCalledWith('id', mockFavoriteIds);
    });

    it('should handle empty favorites list', async () => {
      const mockFavoritesSelect = jest.fn().mockReturnThis();
      const mockFavoritesEq = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockFavoritesSelect,
        eq: mockFavoritesEq,
      } as any);

      const loadFavoriteFruits = async (userId: string) => {
        const { data: favoriteData, error: favoriteError } = await supabase
          .from('user_favorites')
          .select('fruit_id')
          .eq('user_id', userId);

        if (favoriteError || !favoriteData?.length) {
          return [];
        }

        return [];
      };

      const result = await loadFavoriteFruits(mockUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('Bulk Favorites Operations', () => {
    it('should handle bulk favorite operations', async () => {
      const fruitIds = ['fruit1', 'fruit2', 'fruit3'];
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const addMultipleFavorites = async (userId: string, fruitIds: string[]) => {
        const favorites = fruitIds.map(fruitId => ({
          user_id: userId,
          fruit_id: fruitId,
        }));

        const { error } = await supabase
          .from('user_favorites')
          .insert(favorites);

        if (error) {
          throw error;
        }

        return true;
      };

      const result = await addMultipleFavorites(mockUser.id, fruitIds);

      expect(mockInsert).toHaveBeenCalledWith([
        { user_id: mockUser.id, fruit_id: 'fruit1' },
        { user_id: mockUser.id, fruit_id: 'fruit2' },
        { user_id: mockUser.id, fruit_id: 'fruit3' },
      ]);
      expect(result).toBe(true);
    });

    it('should handle bulk remove operations', async () => {
      const fruitIds = ['fruit1', 'fruit2'];
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
        eq: mockEq.mockReturnValue({
          in: mockIn,
        }),
      } as any);

      const removeMultipleFavorites = async (userId: string, fruitIds: string[]) => {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .in('fruit_id', fruitIds);

        if (error) {
          throw error;
        }

        return true;
      };

      const result = await removeMultipleFavorites(mockUser.id, fruitIds);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockIn).toHaveBeenCalledWith('fruit_id', fruitIds);
      expect(result).toBe(true);
    });
  });
});