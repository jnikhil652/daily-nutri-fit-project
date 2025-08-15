import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { FamilyPlanCard } from '../../components/family/FamilyPlanCard';
import { FamilyPlan, FamilyPlanService } from '../../lib/familyPlans';

interface FamilyPlansScreenProps {
  navigation: any;
}

export const FamilyPlansScreen: React.FC<FamilyPlansScreenProps> = ({ navigation }) => {
  const [familyPlans, setFamilyPlans] = useState<FamilyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFamilyPlans();
  }, []);

  const loadFamilyPlans = async () => {
    try {
      const plans = await FamilyPlanService.getUserFamilyPlans();
      setFamilyPlans(plans);
    } catch (error) {
      console.error('Error loading family plans:', error);
      Alert.alert('Error', 'Failed to load family plans');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFamilyPlans();
    setRefreshing(false);
  };

  const handleCreateFamilyPlan = () => {
    navigation.navigate('CreateFamilyPlan');
  };

  const handleViewFamilyPlan = (familyPlan: FamilyPlan) => {
    navigation.navigate('FamilyPlanDetails', { familyPlanId: familyPlan.id });
  };

  const handleEditFamilyPlan = (familyPlan: FamilyPlan) => {
    navigation.navigate('EditFamilyPlan', { familyPlanId: familyPlan.id });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading family plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Family Plans</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateFamilyPlan}>
          <Text style={styles.createButtonText}>+ Create Plan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {familyPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Family Plans</Text>
            <Text style={styles.emptyDescription}>
              Create your first family plan to start coordinating nutrition goals
              with your loved ones.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateFamilyPlan}>
              <Text style={styles.emptyButtonText}>Create Your First Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          familyPlans.map((plan) => (
            <FamilyPlanCard
              key={plan.id}
              familyPlan={plan}
              onPress={() => handleViewFamilyPlan(plan)}
              onEdit={() => handleEditFamilyPlan(plan)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});