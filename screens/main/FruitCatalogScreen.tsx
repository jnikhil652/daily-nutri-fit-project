import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FlatGrid } from 'react-native-super-grid';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase, Fruit, FruitCategory, FruitWithDetails } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FruitCard } from '../../components/FruitCard';
import { MainStackParamList } from '../../types/navigation';

type FruitCatalogNavigationProp = NativeStackNavigationProp<MainStackParamList, 'FruitCatalog'>;

export const FruitCatalogScreen: React.FC = () => {
  const navigation = useNavigation<FruitCatalogNavigationProp>();
  const { user } = useAuth();
  
  const [fruits, setFruits] = useState<FruitWithDetails[]>([]);
  const [categories, setCategories] = useState<FruitCategory[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadFruits(),
        loadCategories(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load fruit catalog');
    } finally {
      setLoading(false);
    }
  };

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

    setFruits(processedFruits);
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('fruit_categories')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    setCategories(data || []);
  };

  const loadFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_favorites')
      .select('fruit_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading favorites:', error);
      return;
    }

    setFavorites(data?.map(f => f.fruit_id) || []);
  };

  const toggleFavorite = async (fruit: Fruit) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to save favorites');
      return;
    }

    const isFavorite = favorites.includes(fruit.id);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('fruit_id', fruit.id);

        if (error) throw error;
        setFavorites(prev => prev.filter(id => id !== fruit.id));
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            fruit_id: fruit.id,
          });

        if (error) throw error;
        setFavorites(prev => [...prev, fruit.id]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleFruitPress = (fruit: Fruit) => {
    navigation.navigate('FruitDetail', { fruitId: fruit.id });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (user) {
      await loadFavorites();
    }
    setRefreshing(false);
  };

  const filteredFruits = useMemo(() => {
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

  const renderFruitCard = ({ item }: { item: FruitWithDetails }) => (
    <FruitCard
      fruit={item}
      onPress={handleFruitPress}
      onFavoritePress={user ? toggleFavorite : undefined}
      isFavorite={favorites.includes(item.id)}
    />
  );

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryContainer}
      contentContainerStyle={styles.categoryContent}
    >
      <TouchableOpacity
        style={[
          styles.categoryChip,
          !selectedCategory && styles.categoryChipActive,
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text
          style={[
            styles.categoryChipText,
            !selectedCategory && styles.categoryChipTextActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      
      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            selectedCategory === category.id && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(
            selectedCategory === category.id ? null : category.id
          )}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.categoryChipTextActive,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading fruits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fresh Fruits</Text>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search fruits..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {renderCategoryFilter()}

      <FlatGrid
        itemDimension={160}
        data={filteredFruits}
        style={styles.grid}
        spacing={16}
        renderItem={renderFruitCard}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery || selectedCategory
                ? 'No fruits found matching your criteria'
                : 'No fruits available'
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#4CAF50',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  grid: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});