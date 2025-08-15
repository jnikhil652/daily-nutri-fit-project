import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { FlatGrid } from 'react-native-super-grid';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase, FruitWithDetails } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FruitCard } from '../../components/FruitCard';
import { MainStackParamList } from '../../types/navigation';

type FavoritesNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Favorites'>;

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<FavoritesNavigationProp>();
  const { user } = useAuth();
  
  const [favoriteFruits, setFavoriteFruits] = useState<FruitWithDetails[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadFavorites();
      }
    }, [user])
  );

  const loadFavorites = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First get favorite fruit IDs
      const { data: favoriteData, error: favoriteError } = await supabase
        .from('user_favorites')
        .select('fruit_id')
        .eq('user_id', user.id);

      if (favoriteError) {
        throw favoriteError;
      }

      if (!favoriteData || favoriteData.length === 0) {
        setFavoriteFruits([]);
        setFavorites([]);
        setLoading(false);
        return;
      }

      const fruitIds = favoriteData.map(f => f.fruit_id);
      setFavorites(fruitIds);

      // Then get fruit details for favorites
      const { data: fruitsData, error: fruitsError } = await supabase
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
        .in('id', fruitIds)
        .eq('is_available', true);

      if (fruitsError) {
        throw fruitsError;
      }

      const processedFruits = fruitsData?.map(fruit => ({
        ...fruit,
        nutritional_info: fruit.nutritional_info?.[0] || null,
        categories: fruit.categories?.map((c: any) => c.category) || [],
        health_benefits: fruit.health_benefits?.map((b: any) => b.benefit) || [],
      })) || [];

      setFavoriteFruits(processedFruits);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'Failed to load your favorite fruits');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (fruit: FruitWithDetails) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to manage favorites');
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

        // Update local state - remove from both arrays
        setFavorites(prev => prev.filter(id => id !== fruit.id));
        setFavoriteFruits(prev => prev.filter(f => f.id !== fruit.id));
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            fruit_id: fruit.id,
          });

        if (error) throw error;

        // Update local state - add to favorites list
        setFavorites(prev => [...prev, fruit.id]);
        // Note: We don't add to favoriteFruits here since this screen only shows favorites
        // and the fruit would have already been removed from the display
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleFruitPress = (fruit: FruitWithDetails) => {
    navigation.navigate('FruitDetail', { fruitId: fruit.id });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const renderFruitCard = ({ item }: { item: FruitWithDetails }) => (
    <FruitCard
      fruit={item}
      onPress={handleFruitPress}
      onFavoritePress={toggleFavorite}
      isFavorite={favorites.includes(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💖</Text>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptyText}>
        Start exploring fruits and tap the heart icon to add them to your favorites!
      </Text>
    </View>
  );

  const renderLoginPrompt = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔐</Text>
      <Text style={styles.emptyTitle}>Login Required</Text>
      <Text style={styles.emptyText}>
        Please log in to view and manage your favorite fruits.
      </Text>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Favorites</Text>
        </View>
        {renderLoginPrompt()}
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Favorites</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Favorites</Text>
        {favoriteFruits.length > 0 && (
          <Text style={styles.subtitle}>
            {favoriteFruits.length} favorite{favoriteFruits.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <FlatGrid
        itemDimension={160}
        data={favoriteFruits}
        style={styles.grid}
        spacing={16}
        renderItem={renderFruitCard}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        ListEmptyComponent={renderEmptyState()}
        contentContainerStyle={
          favoriteFruits.length === 0 ? styles.emptyGridContainer : undefined
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
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
  grid: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyGridContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});