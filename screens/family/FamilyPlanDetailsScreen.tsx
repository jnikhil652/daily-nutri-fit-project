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
import { FamilyMemberCard } from '../../components/family/FamilyMemberCard';
import {
  FamilyPlan,
  FamilyMember,
  FamilyDashboard,
  FamilyPlanService,
} from '../../lib/familyPlans';

interface FamilyPlanDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      familyPlanId: string;
    };
  };
}

export const FamilyPlanDetailsScreen: React.FC<FamilyPlanDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { familyPlanId } = route.params;
  const [familyPlan, setFamilyPlan] = useState<FamilyPlan | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [dashboard, setDashboard] = useState<FamilyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userCanEdit, setUserCanEdit] = useState(false);

  useEffect(() => {
    loadFamilyPlanData();
  }, [familyPlanId]);

  const loadFamilyPlanData = async () => {
    try {
      const [plan, members, dashboardData, canEdit] = await Promise.all([
        FamilyPlanService.getFamilyPlan(familyPlanId),
        FamilyPlanService.getFamilyMembers(familyPlanId),
        FamilyPlanService.getFamilyDashboard(familyPlanId),
        FamilyPlanService.checkUserPermission(familyPlanId, ['admin']),
      ]);

      setFamilyPlan(plan);
      setFamilyMembers(members);
      setDashboard(dashboardData);
      setUserCanEdit(canEdit);
    } catch (error) {
      console.error('Error loading family plan data:', error);
      Alert.alert('Error', 'Failed to load family plan details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFamilyPlanData();
    setRefreshing(false);
  };

  const handleInviteMember = () => {
    navigation.navigate('InviteMember', { familyPlanId });
  };

  const handleEditMember = (member: FamilyMember) => {
    navigation.navigate('EditMember', { memberId: member.id });
  };

  const handleRemoveMember = async (member: FamilyMember) => {
    try {
      await FamilyPlanService.removeFamilyMember(member.id);
      Alert.alert('Success', 'Member removed successfully');
      await loadFamilyPlanData();
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  const handleTopUpWallet = () => {
    // Navigate to wallet top-up screen
    Alert.alert('Wallet Top-up', 'Wallet top-up functionality coming soon');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading family plan details...</Text>
      </View>
    );
  }

  if (!familyPlan) {
    return (
      <View style={styles.centerContainer}>
        <Text>Family plan not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.familyName}>{familyPlan.family_name}</Text>
        <View style={styles.planTypeBadge}>
          <Text style={styles.planTypeText}>
            {familyPlan.plan_type.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Dashboard Stats */}
      {dashboard && (
        <View style={styles.dashboardCard}>
          <Text style={styles.sectionTitle}>Family Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboard.active_members}</Text>
              <Text style={styles.statLabel}>Active Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${dashboard.wallet_balance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Wallet Balance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dashboard.active_challenges}</Text>
              <Text style={styles.statLabel}>Active Challenges</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.topUpButton} onPress={handleTopUpWallet}>
            <Text style={styles.topUpButtonText}>Top Up Wallet</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Family Members Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          {userCanEdit && (
            <TouchableOpacity style={styles.inviteButton} onPress={handleInviteMember}>
              <Text style={styles.inviteButtonText}>+ Invite</Text>
            </TouchableOpacity>
          )}
        </View>

        {familyMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No family members yet</Text>
            {userCanEdit && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleInviteMember}>
                <Text style={styles.emptyButtonText}>Invite First Member</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          familyMembers.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              canEdit={userCanEdit}
              onEdit={() => handleEditMember(member)}
              onRemove={() => handleRemoveMember(member)}
            />
          ))
        )}
      </View>

      {/* Family Goals Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family Goals</Text>
        <View style={styles.goalsCard}>
          {familyPlan.family_goals?.description ? (
            <Text style={styles.goalsText}>
              {familyPlan.family_goals.description}
            </Text>
          ) : (
            <Text style={styles.emptyText}>No family goals set yet</Text>
          )}
        </View>
      </View>

      {/* Coordination Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coordination Settings</Text>
        <View style={styles.preferencesCard}>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Unified Delivery:</Text>
            <Text style={styles.preferenceValue}>
              {familyPlan.coordination_preferences?.unified_delivery ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Shared Goals:</Text>
            <Text style={styles.preferenceValue}>
              {familyPlan.coordination_preferences?.shared_goals ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions Section */}
      {userCanEdit && (
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.editPlanButton}
            onPress={() => navigation.navigate('EditFamilyPlan', { familyPlanId })}
          >
            <Text style={styles.editPlanButtonText}>Edit Family Plan</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  familyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  planTypeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  planTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  topUpButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  topUpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inviteButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  goalsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  goalsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#666',
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actionsSection: {
    margin: 16,
    marginBottom: 32,
  },
  editPlanButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editPlanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});