import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { ReferralCard } from '../../components/referral/ReferralCard';
import { ReferralAnalyticsCard } from '../../components/referral/ReferralAnalyticsCard';
import {
  Referral,
  ReferralAnalytics,
  ReferralService,
} from '../../lib/referrals';

interface ReferralScreenProps {
  navigation: any;
}

export const ReferralScreen: React.FC<ReferralScreenProps> = ({ navigation }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeReferralCode, setActiveReferralCode] = useState<string | null>(null);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const [userReferrals, analyticsData, activeCode] = await Promise.all([
        ReferralService.getUserReferrals(),
        ReferralService.getReferralAnalytics(),
        ReferralService.getActiveReferralCode(),
      ]);

      setReferrals(userReferrals);
      setAnalytics(analyticsData);
      setActiveReferralCode(activeCode);
    } catch (error) {
      console.error('Error loading referral data:', error);
      Alert.alert('Error', 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReferralData();
    setRefreshing(false);
  };

  const handleCreateReferral = async () => {
    try {
      setLoading(true);
      const referral = await ReferralService.createReferral({
        referral_method: 'link',
        referral_source: 'app_share',
        metadata: { created_from: 'referral_screen' },
      });

      setActiveReferralCode(referral.referral_code);
      await loadReferralData();
      
      // Immediately show sharing options
      handleShareReferral(referral.referral_code);
    } catch (error) {
      console.error('Error creating referral:', error);
      Alert.alert('Error', 'Failed to create referral code');
    } finally {
      setLoading(false);
    }
  };

  const handleShareReferral = async (code?: string) => {
    try {
      const referralCode = code || activeReferralCode;
      if (!referralCode) {
        Alert.alert('Error', 'No active referral code found');
        return;
      }

      const shareContent = await ReferralService.generateShareContent(referralCode);
      
      await Share.share({
        title: shareContent.title,
        message: shareContent.message,
        url: shareContent.url,
      });

      // Track sharing activity
      await ReferralService.trackReferralInteraction(referralCode, 'click');
    } catch (error) {
      console.error('Error sharing referral:', error);
      Alert.alert('Error', 'Failed to share referral code');
    }
  };

  const handleCopyCode = () => {
    if (!activeReferralCode) {
      Alert.alert('Error', 'No active referral code found');
      return;
    }

    // In a real implementation, you'd use a clipboard library
    Alert.alert('Copied!', `Referral code ${activeReferralCode} copied to clipboard`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading referral data...</Text>
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
        <Text style={styles.title}>Invite Friends & Earn</Text>
        <Text style={styles.subtitle}>
          Share DailyNutriFit with friends and both of you get rewards!
        </Text>
      </View>

      {/* Current Referral Code Section */}
      <View style={styles.currentCodeSection}>
        <Text style={styles.sectionTitle}>Your Referral Code</Text>
        {activeReferralCode ? (
          <View style={styles.codeCard}>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeLabel}>Current Code</Text>
              <TouchableOpacity style={styles.codeContainer} onPress={handleCopyCode}>
                <Text style={styles.code}>{activeReferralCode}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.codeActions}>
              <TouchableOpacity 
                style={styles.shareButton} 
                onPress={() => handleShareReferral()}
              >
                <Text style={styles.shareButtonText}>Share Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                <Text style={styles.copyButtonText}>Copy Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCodeCard}>
            <Text style={styles.emptyCodeText}>
              You don't have an active referral code yet
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateReferral}>
              <Text style={styles.createButtonText}>Create Referral Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Analytics Section */}
      {analytics && analytics.total_referrals > 0 && (
        <ReferralAnalyticsCard analytics={analytics} />
      )}

      {/* How It Works Section */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDescription}>
                Send your referral code to friends via message, email, or social media
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friend Signs Up</Text>
              <Text style={styles.stepDescription}>
                Your friend creates an account using your referral code
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Both Get Rewards</Text>
              <Text style={styles.stepDescription}>
                You both receive credits when they make their first purchase
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Rewards Section */}
      <View style={styles.rewardsSection}>
        <Text style={styles.sectionTitle}>Referral Rewards</Text>
        <View style={styles.rewardTiers}>
          <View style={styles.rewardTier}>
            <Text style={styles.tierTitle}>Standard Reward</Text>
            <Text style={styles.tierDescription}>You get $10, friend gets $5</Text>
            <Text style={styles.tierMultiplier}>1x Multiplier</Text>
          </View>
          
          <View style={styles.rewardTier}>
            <Text style={styles.tierTitle}>Champion (5+ referrals)</Text>
            <Text style={styles.tierDescription}>You get $12, friend gets $5</Text>
            <Text style={styles.tierMultiplier}>1.2x Multiplier</Text>
          </View>
          
          <View style={styles.rewardTier}>
            <Text style={styles.tierTitle}>Expert (10+ referrals)</Text>
            <Text style={styles.tierDescription}>You get $15, friend gets $5</Text>
            <Text style={styles.tierMultiplier}>1.5x Multiplier</Text>
          </View>
          
          <View style={styles.rewardTier}>
            <Text style={styles.tierTitle}>Ambassador (25+ referrals)</Text>
            <Text style={styles.tierDescription}>You get $20, friend gets $5</Text>
            <Text style={styles.tierMultiplier}>2x Multiplier</Text>
          </View>
        </View>
      </View>

      {/* Referral History */}
      {referrals.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          {referrals.map((referral) => (
            <ReferralCard
              key={referral.id}
              referral={referral}
              onShare={() => handleShareReferral(referral.referral_code)}
            />
          ))}
        </View>
      )}

      {/* Empty State for New Users */}
      {referrals.length === 0 && !analytics && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Start Referring Friends!</Text>
          <Text style={styles.emptyDescription}>
            Create your first referral code and start earning rewards by sharing
            DailyNutriFit with your friends and family.
          </Text>
          {!activeReferralCode && (
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateReferral}>
              <Text style={styles.emptyButtonText}>Get Started</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  currentCodeSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  codeDisplay: {
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  codeContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    fontFamily: 'monospace',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  copyButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCodeCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyCodeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  howItWorksSection: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepsContainer: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  rewardsSection: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rewardTiers: {
    gap: 12,
  },
  rewardTier: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tierDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  tierMultiplier: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  historySection: {
    margin: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
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