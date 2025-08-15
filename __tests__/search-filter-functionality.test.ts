import { act, renderHook } from '@testing-library/react-native';
import { useState, useMemo } from 'react';

// Types
interface Fruit {
  id: string;
  name: string;
  description: string;
  short_description?: string | null;
  categories?: Array<{ id: string; name: string }>;
}

interface Category {
  id: string;
  name: string;
}

describe('Search and Filter Functionality', () => {
  const mockFruits: Fruit[] = [
    {
      id: '1',
      name: 'Apple',
      description: 'Fresh red apple from local orchards',
      short_description: 'Sweet and crisp',
      categories: [{ id: 'cat1', name: 'Tree Fruits' }],
    },
    {
      id: '2',
      name: 'Banana',
      description: 'Yellow tropical banana rich in potassium',
      short_description: 'Sweet and soft',
      categories: [{ id: 'cat2', name: 'Tropical Fruits' }],
    },
    {
      id: '3',
      name: 'Orange',
      description: 'Juicy citrus orange packed with vitamin C',
      short_description: 'Tangy and refreshing',
      categories: [{ id: 'cat3', name: 'Citrus Fruits' }],
    },
    {
      id: '4',
      name: 'Green Apple',
      description: 'Tart green apple perfect for baking',
      short_description: 'Crisp and tart',
      categories: [{ id: 'cat1', name: 'Tree Fruits' }],
    },
    {
      id: '5',
      name: 'Pineapple',
      description: 'Sweet tropical pineapple with natural enzymes',
      short_description: 'Sweet and tangy',
      categories: [{ id: 'cat2', name: 'Tropical Fruits' }],
    }
  ];

  const mockCategories: Category[] = [
    { id: 'cat1', name: 'Tree Fruits' },
    { id: 'cat2', name: 'Tropical Fruits' },
    { id: 'cat3', name: 'Citrus Fruits' },
  ];

  describe('Search Functionality', () => {
    const useSearchFilter = (fruits: Fruit[], searchQuery: string, selectedCategory: string | null) => {
      return useMemo(() => {
        let filtered = fruits;

        // Filter by search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(fruit =>
            fruit.name.toLowerCase().includes(query) ||
            fruit.description.toLowerCase().includes(query) ||
            fruit.short_description?.toLowerCase().includes(query)
          );
        }

        // Filter by category
        if (selectedCategory) {
          filtered = filtered.filter(fruit =>
            fruit.categories?.some(cat => cat.id === selectedCategory)
          );
        }

        return filtered;
      }, [fruits, searchQuery, selectedCategory]);
    };

    it('should filter fruits by name search', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, 'apple', null));
      
      expect(result.current).toHaveLength(2);
      expect(result.current.map(f => f.name)).toEqual(['Apple', 'Green Apple']);
    });

    it('should filter fruits by description search', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, 'tropical', null));
      
      expect(result.current).toHaveLength(2);
      expect(result.current.map(f => f.name)).toEqual(['Banana', 'Pineapple']);
    });

    it('should filter fruits by short description search', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, 'crisp', null));
      
      expect(result.current).toHaveLength(2);
      expect(result.current.map(f => f.name)).toEqual(['Apple', 'Green Apple']);
    });

    it('should be case insensitive', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, 'APPLE', null));
      
      expect(result.current).toHaveLength(2);
      expect(result.current.map(f => f.name)).toEqual(['Apple', 'Green Apple']);
    });

    it('should handle partial matches', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, 'app', null));
      
      expect(result.current).toHaveLength(3); // Apple, Green Apple, Pineapple
      expect(result.current.map(f => f.name)).toContain('Apple');
      expect(result.current.map(f => f.name)).toContain('Green Apple');
      expect(result.current.map(f => f.name)).toContain('Pineapple');
    });

    it('should return empty array for non-matching search', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, 'xyz', null));
      
      expect(result.current).toHaveLength(0);
    });

    it('should handle empty search query', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, '', null));
      
      expect(result.current).toHaveLength(mockFruits.length);
    });

    it('should handle whitespace-only search query', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, '   ', null));
      
      expect(result.current).toHaveLength(mockFruits.length);
    });

    it('should handle undefined short_description', () => {
      const fruitsWithUndefinedDesc = [
        {
          id: '1',
          name: 'Test Fruit',
          description: 'Test description',
          short_description: undefined,
          categories: [],
        }
      ];

      const { result } = renderHook(() => useSearchFilter(fruitsWithUndefinedDesc, 'test', null));
      
      expect(result.current).toHaveLength(1);
    });
  });

  describe('Category Filtering', () => {
    const useSearchFilter = (fruits: Fruit[], searchQuery: string, selectedCategory: string | null) => {
      return useMemo(() => {
        let filtered = fruits;

        // Filter by search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(fruit =>
            fruit.name.toLowerCase().includes(query) ||
            fruit.description.toLowerCase().includes(query) ||
            fruit.short_description?.toLowerCase().includes(query)
          );
        }

        // Filter by category
        if (selectedCategory) {
          filtered = filtered.filter(fruit =>
            fruit.categories?.some(cat => cat.id === selectedCategory)
          );
        }

        return filtered;
      }, [fruits, searchQuery, selectedCategory]);
    };

    it('should filter fruits by Tree Fruits category', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, '', 'cat1'));
      
      expect(result.current).toHaveLength(2);
      expect(result.current.map(f => f.name)).toEqual(['Apple', 'Green Apple']);
    });

    it('should filter fruits by Tropical Fruits category', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, '', 'cat2'));
      
      expect(result.current).toHaveLength(2);
      expect(result.current.map(f => f.name)).toEqual(['Banana', 'Pineapple']);
    });

    it('should filter fruits by Citrus Fruits category', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, '', 'cat3'));
      
      expect(result.current).toHaveLength(1);
      expect(result.current.map(f => f.name)).toEqual(['Orange']);
    });

    it('should return empty array for non-existing category', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, '', 'nonexistent'));
      
      expect(result.current).toHaveLength(0);
    });

    it('should return all fruits when no category is selected', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, '', null));
      
      expect(result.current).toHaveLength(mockFruits.length);
    });

    it('should handle fruits without categories', () => {
      const fruitsWithoutCategories = [
        {
          id: '1',
          name: 'Test Fruit',
          description: 'Test description',
          categories: undefined,
        }
      ];

      const { result } = renderHook(() => useSearchFilter(fruitsWithoutCategories, '', 'cat1'));
      
      expect(result.current).toHaveLength(0);
    });

    it('should handle fruits with empty categories array', () => {
      const fruitsWithEmptyCategories = [
        {
          id: '1',
          name: 'Test Fruit',
          description: 'Test description',
          categories: [],
        }
      ];

      const { result } = renderHook(() => useSearchFilter(fruitsWithEmptyCategories, '', 'cat1'));
      
      expect(result.current).toHaveLength(0);
    });
  });

  describe('Combined Search and Category Filtering', () => {
    const useSearchFilter = (fruits: Fruit[], searchQuery: string, selectedCategory: string | null) => {
      return useMemo(() => {
        let filtered = fruits;

        // Filter by search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(fruit =>
            fruit.name.toLowerCase().includes(query) ||
            fruit.description.toLowerCase().includes(query) ||
            fruit.short_description?.toLowerCase().includes(query)
          );
        }

        // Filter by category
        if (selectedCategory) {
          filtered = filtered.filter(fruit =>
            fruit.categories?.some(cat => cat.id === selectedCategory)
          );
        }

        return filtered;
      }, [fruits, searchQuery, selectedCategory]);
    };

    it('should apply both search and category filters', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, 'apple', 'cat1'));
      
      expect(result.current).toHaveLength(2);
      expect(result.current.map(f => f.name)).toEqual(['Apple', 'Green Apple']);
    });

    it('should return empty when search and category filters have no intersection', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, 'apple', 'cat2'));
      
      expect(result.current).toHaveLength(0);
    });

    it('should work with partial search and category filter', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, 'sweet', 'cat2'));
      
      expect(result.current).toHaveLength(2);
      expect(result.current.map(f => f.name)).toEqual(['Banana', 'Pineapple']);
    });

    it('should prioritize search over category when both are applied', () => {
      const { result } = renderHook(() => useSearchFilter(mockFruits, 'orange', 'cat1'));
      
      expect(result.current).toHaveLength(0); // Orange is not in Tree Fruits category
    });
  });

  describe('Dynamic Filtering', () => {
    const useSearchFilterState = () => {
      const [searchQuery, setSearchQuery] = useState('');
      const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

      const filteredFruits = useMemo(() => {
        let filtered = mockFruits;

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(fruit =>
            fruit.name.toLowerCase().includes(query) ||
            fruit.description.toLowerCase().includes(query) ||
            fruit.short_description?.toLowerCase().includes(query)
          );
        }

        if (selectedCategory) {
          filtered = filtered.filter(fruit =>
            fruit.categories?.some(cat => cat.id === selectedCategory)
          );
        }

        return filtered;
      }, [searchQuery, selectedCategory]);

      return {
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        filteredFruits,
      };
    };

    it('should update results when search query changes', () => {
      const { result } = renderHook(() => useSearchFilterState());

      expect(result.current.filteredFruits).toHaveLength(mockFruits.length);

      act(() => {
        result.current.setSearchQuery('apple');
      });

      expect(result.current.filteredFruits).toHaveLength(2);
      expect(result.current.filteredFruits.map(f => f.name)).toEqual(['Apple', 'Green Apple']);
    });

    it('should update results when category selection changes', () => {
      const { result } = renderHook(() => useSearchFilterState());

      expect(result.current.filteredFruits).toHaveLength(mockFruits.length);

      act(() => {
        result.current.setSelectedCategory('cat2');
      });

      expect(result.current.filteredFruits).toHaveLength(2);
      expect(result.current.filteredFruits.map(f => f.name)).toEqual(['Banana', 'Pineapple']);
    });

    it('should update results when both search and category change', () => {
      const { result } = renderHook(() => useSearchFilterState());

      act(() => {
        result.current.setSearchQuery('sweet');
        result.current.setSelectedCategory('cat2');
      });

      expect(result.current.filteredFruits).toHaveLength(2);
      expect(result.current.filteredFruits.map(f => f.name)).toEqual(['Banana', 'Pineapple']);
    });

    it('should clear filters independently', () => {
      const { result } = renderHook(() => useSearchFilterState());

      // Set both filters
      act(() => {
        result.current.setSearchQuery('apple');
        result.current.setSelectedCategory('cat1');
      });

      expect(result.current.filteredFruits).toHaveLength(2);

      // Clear search but keep category
      act(() => {
        result.current.setSearchQuery('');
      });

      expect(result.current.filteredFruits).toHaveLength(2);
      expect(result.current.filteredFruits.map(f => f.name)).toEqual(['Apple', 'Green Apple']);

      // Clear category
      act(() => {
        result.current.setSelectedCategory(null);
      });

      expect(result.current.filteredFruits).toHaveLength(mockFruits.length);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      const largeFruitList = Array.from({ length: 1000 }, (_, i) => ({
        id: `fruit-${i}`,
        name: `Fruit ${i}`,
        description: `Description for fruit ${i}`,
        short_description: i % 2 === 0 ? `Short desc ${i}` : null,
        categories: [{ id: 'cat1', name: 'Category 1' }],
      }));

      const useSearchFilter = (fruits: Fruit[], searchQuery: string) => {
        return useMemo(() => {
          if (!searchQuery.trim()) return fruits;
          
          const query = searchQuery.toLowerCase();
          return fruits.filter(fruit =>
            fruit.name.toLowerCase().includes(query) ||
            fruit.description.toLowerCase().includes(query) ||
            fruit.short_description?.toLowerCase().includes(query)
          );
        }, [fruits, searchQuery]);
      };

      const { result } = renderHook(() => useSearchFilter(largeFruitList, 'Fruit 1'));
      
      expect(result.current.length).toBeGreaterThan(0);
      expect(result.current.every(fruit => fruit.name.includes('Fruit 1'))).toBe(true);
    });

    it('should handle special characters in search', () => {
      const fruitsWithSpecialChars = [
        {
          id: '1',
          name: 'Açaí Berry',
          description: 'Superfruit from Amazon',
          categories: [],
        },
        {
          id: '2',
          name: 'Piña Colada Fruit',
          description: 'Tropical delight',
          categories: [],
        }
      ];

      const useSearchFilter = (fruits: Fruit[], searchQuery: string) => {
        return useMemo(() => {
          if (!searchQuery.trim()) return fruits;
          
          const query = searchQuery.toLowerCase();
          return fruits.filter(fruit =>
            fruit.name.toLowerCase().includes(query) ||
            fruit.description.toLowerCase().includes(query)
          );
        }, [fruits, searchQuery]);
      };

      const { result } = renderHook(() => useSearchFilter(fruitsWithSpecialChars, 'açaí'));
      
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Açaí Berry');
    });

    it('should handle null and undefined values gracefully', () => {
      const fruitsWithNulls = [
        {
          id: '1',
          name: 'Test Fruit',
          description: null as any,
          short_description: undefined,
          categories: null as any,
        }
      ];

      const useSearchFilter = (fruits: any[], searchQuery: string, selectedCategory: string | null) => {
        return useMemo(() => {
          let filtered = fruits;

          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(fruit =>
              (fruit.name && fruit.name.toLowerCase().includes(query)) ||
              (fruit.description && fruit.description.toLowerCase().includes(query)) ||
              (fruit.short_description && fruit.short_description.toLowerCase().includes(query))
            );
          }

          if (selectedCategory) {
            filtered = filtered.filter(fruit =>
              fruit.categories?.some((cat: any) => cat.id === selectedCategory)
            );
          }

          return filtered;
        }, [fruits, searchQuery, selectedCategory]);
      };

      const { result } = renderHook(() => useSearchFilter(fruitsWithNulls, 'test', null));
      
      expect(result.current).toHaveLength(1);
    });

    it('should handle empty search strings and whitespace', () => {
      const useSearchFilter = (fruits: Fruit[], searchQuery: string) => {
        return useMemo(() => {
          if (!searchQuery.trim()) return fruits;
          
          const query = searchQuery.toLowerCase();
          return fruits.filter(fruit =>
            fruit.name.toLowerCase().includes(query)
          );
        }, [fruits, searchQuery]);
      };

      const testCases = ['', '   ', '\t', '\n', '  \t  \n  '];
      
      testCases.forEach(testQuery => {
        const { result } = renderHook(() => useSearchFilter(mockFruits, testQuery));
        expect(result.current).toHaveLength(mockFruits.length);
      });
    });
  });
});