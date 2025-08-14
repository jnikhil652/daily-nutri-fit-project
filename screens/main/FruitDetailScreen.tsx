import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase, FruitWithDetails, FruitNutritionalInfo, HealthBenefit } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MainStackParamList } from '../../types/navigation';

type FruitDetailRouteProp = RouteProp<MainStackParamList, 'FruitDetail'>;
type FruitDetailNavigationProp = NativeStackNavigationProp<MainStackParamList, 'FruitDetail'>;

const { width } = Dimensions.get('window');

export const FruitDetailScreen: React.FC = () => {
  const route = useRoute<FruitDetailRouteProp>();
  const navigation = useNavigation<FruitDetailNavigationProp>();
  const { user } = useAuth();
  const { fruitId } = route.params;
  
  const [fruit, setFruit] = useState<FruitWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadFruitDetail();
  }, [fruitId]);

  useEffect(() => {
    if (user && fruit) {
      checkFavoriteStatus();
    }
  }, [user, fruit]);

  const loadFruitDetail = async () => {
    try {
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
        .eq('id', fruitId)
        .single();

      if (error) {
        throw error;
      }

      const processedFruit: FruitWithDetails = {
        ...data,
        nutritional_info: data.nutritional_info?.[0] || null,
        categories: data.categories?.map((c: any) => c.category) || [],
        health_benefits: data.health_benefits?.map((b: any) => b.benefit) || [],
      };

      setFruit(processedFruit);
    } catch (error) {
      console.error('Error loading fruit detail:', error);
      Alert.alert('Error', 'Failed to load fruit details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user || !fruit) return;

    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('fruit_id', fruit.id)
      .single();

    if (!error && data) {
      setIsFavorite(true);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !fruit) {
      Alert.alert('Login Required', 'Please log in to save favorites');
      return;
    }

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('fruit_id', fruit.id);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            fruit_id: fruit.id,
          });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const addToCart = async () => {
    if (!fruit) return;
    
    setAddingToCart(true);
    // TODO: Implement cart functionality
    setTimeout(() => {
      setAddingToCart(false);
      Alert.alert('Success', `${fruit.name} added to cart!`);
    }, 1000);
  };

  const renderNutritionalInfo = (nutritionalInfo: FruitNutritionalInfo) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Nutritional Information (per 100g)</Text>
      <View style={styles.nutritionGrid}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{nutritionalInfo.calories_per_100g || 'N/A'}</Text>
          <Text style={styles.nutritionLabel}>Calories</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{nutritionalInfo.protein_g || 'N/A'}g</Text>
          <Text style={styles.nutritionLabel}>Protein</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{nutritionalInfo.carbs_g || 'N/A'}g</Text>
          <Text style={styles.nutritionLabel}>Carbs</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{nutritionalInfo.fiber_g || 'N/A'}g</Text>
          <Text style={styles.nutritionLabel}>Fiber</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{nutritionalInfo.sugar_g || 'N/A'}g</Text>
          <Text style={styles.nutritionLabel}>Sugar</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>{nutritionalInfo.vitamin_c_mg || 'N/A'}mg</Text>
          <Text style={styles.nutritionLabel}>Vitamin C</Text>
        </View>
      </View>
    </View>
  );

  const renderHealthBenefits = (benefits: HealthBenefit[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Health Benefits</Text>
      {benefits.map((benefit, index) => (
        <View key={benefit.id} style={styles.benefitItem}>
          <Text style={styles.benefitName}>• {benefit.name}</Text>
          {benefit.description && (
            <Text style={styles.benefitDescription}>{benefit.description}</Text>
          )}
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading fruit details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!fruit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Fruit not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: fruit.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
          {fruit.is_seasonal && (
            <View style={styles.seasonalBadge}>
              <Text style={styles.seasonalText}>Seasonal</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.name}>{fruit.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${fruit.price.toFixed(2)}</Text>
                <Text style={styles.unit}>/{fruit.unit}</Text>
              </View>
            </View>
            
            {fruit.categories && fruit.categories.length > 0 && (
              <View style={styles.categoriesContainer}>
                {fruit.categories.map((category, index) => (
                  <View key={category.id} style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{category.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{fruit.description}</Text>
          </View>

          {fruit.nutritional_info && renderNutritionalInfo(fruit.nutritional_info)}

          {fruit.health_benefits && fruit.health_benefits.length > 0 && 
            renderHealthBenefits(fruit.health_benefits)
          }

          {fruit.storage_tips && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Storage Tips</Text>
              <Text style={styles.storageText}>{fruit.storage_tips}</Text>
            </View>
          )}

          {fruit.seasonal_months && fruit.seasonal_months.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seasonal Availability</Text>
              <Text style={styles.seasonalMonths}>
                {fruit.seasonal_months.join(', ')}
              </Text>
            </View>
          )}

          {fruit.origin_country && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Origin</Text>
              <Text style={styles.originText}>{fruit.origin_country}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {fruit.is_available && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.addToCartButton, addingToCart && styles.addToCartButtonDisabled]}
            onPress={addToCart}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addToCartText}>Add to Cart</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  seasonalBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  seasonalText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  unit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nutritionItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: (width - 80) / 3,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  benefitItem: {
    marginBottom: 12,
  },
  benefitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 12,
  },
  storageText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  seasonalMonths: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  originText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addToCartButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});