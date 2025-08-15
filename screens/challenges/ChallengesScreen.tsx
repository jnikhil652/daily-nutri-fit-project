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
import { ChallengeCard } from '../../components/challenges/ChallengeCard';
import {
  CommunityChallenge,
  ChallengeParticipant,
  ChallengeService,
} from '../../lib/challenges';

interface ChallengesScreenProps {
  navigation: any;
}

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ navigation }) => {
  const [featuredChallenges, setFeaturedChallenges] = useState<CommunityChallenge[]>([]);
  const [allChallenges, setAllChallenges] = useState<CommunityChallenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<(CommunityChallenge & { participation: ChallengeParticipant })[]>([]);
  const [recommendedChallenges, setRecommendedChallenges] = useState<CommunityChallenge[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'consistency' | 'variety' | 'seasonal' | 'goal_based'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChallengeData();
  }, [selectedFilter]);

  const loadChallengeData = async () => {
    try {
      const [featured, all, active, recommended] = await Promise.all([
        ChallengeService.getFeaturedChallenges(),
        ChallengeService.getPublicChallenges(selectedFilter === 'all' ? undefined : selectedFilter),
        ChallengeService.getUserActiveChallenges(),
        ChallengeService.getChallengeRecommendations(),
      ]);

      setFeaturedChallenges(featured);
      setAllChallenges(all);
      setUserChallenges(active);
      setRecommendedChallenges(recommended);
    } catch (error) {
      console.error('Error loading challenge data:', error);
      Alert.alert('Error', 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChallengeData();
    setRefreshing(false);
  };

  const handleJoinChallenge = async (challenge: CommunityChallenge) => {
    try {
      await ChallengeService.joinChallenge({
        challenge_id: challenge.id,
        is_visible: true,
      });

      Alert.alert('Success', 'Successfully joined the challenge!');
      await loadChallengeData();
      
      // Navigate to challenge details
      navigation.navigate('ChallengeDetails', { challengeId: challenge.id });
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join challenge');
    }
  };

  const handleViewChallenge = (challengeId: string) => {
    navigation.navigate('ChallengeDetails', { challengeId });
  };

  const handleCreateChallenge = () => {
    navigation.navigate('CreateChallenge');
  };

  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'consistency', label: 'Consistency' },
    { key: 'variety', label: 'Variety' },
    { key: 'seasonal', label: 'Seasonal' },
    { key: 'goal_based', label: 'Goal Based' },
  ] as const;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading challenges...</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community Challenges</Text>
        <Text style={styles.subtitle}>
          Join challenges, compete with others, and achieve your health goals
        </Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateChallenge}>
          <Text style={styles.createButtonText}>+ Create Challenge</Text>
        </TouchableOpacity>
      </View>

      {/* My Active Challenges */}
      {userChallenges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Active Challenges</Text>
          {userChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              participation={challenge.participation}
              onPress={() => handleViewChallenge(challenge.id)}
            />
          ))}
        </View>
      )}

      {/* Featured Challenges */}
      {featuredChallenges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Featured Challenges</Text>
          {featuredChallenges.map((challenge) => {
            const userParticipation = userChallenges.find(uc => uc.id === challenge.id)?.participation;
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                participation={userParticipation}
                onPress={() => handleViewChallenge(challenge.id)}
                onJoin={() => handleJoinChallenge(challenge)}
              />
            );
          })}
        </View>
      )}

      {/* Recommended Challenges */}
      {recommendedChallenges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Recommended for You</Text>
          {recommendedChallenges.map((challenge) => {
            const userParticipation = userChallenges.find(uc => uc.id === challenge.id)?.participation;
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                participation={userParticipation}
                onPress={() => handleViewChallenge(challenge.id)}
                onJoin={() => handleJoinChallenge(challenge)}
              />
            );
          })}
        </View>
      )}

      {/* Filter Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Challenges</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* All Challenges */}
      <View style={styles.section}>
        {allChallenges.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Challenges Found</Text>
            <Text style={styles.emptyDescription}>
              {selectedFilter === 'all'
                ? 'There are no active challenges at the moment.'
                : `No ${selectedFilter.replace('_', ' ')} challenges available.`}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateChallenge}>
              <Text style={styles.emptyButtonText}>Create First Challenge</Text>
            </TouchableOpacity>
          </View>
        ) : (
          allChallenges.map((challenge) => {
            const userParticipation = userChallenges.find(uc => uc.id === challenge.id)?.participation;
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                participation={userParticipation}
                onPress={() => handleViewChallenge(challenge.id)}
                onJoin={() => handleJoinChallenge(challenge)}
              />
            );
          })
        )}
      </View>

      {/* Getting Started Section */}
      {userChallenges.length === 0 && (
        <View style={styles.gettingStartedSection}>
          <Text style={styles.gettingStartedTitle}>New to Challenges?</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <Text style={styles.tipIcon}>🎯</Text>
              <Text style={styles.tipText}>
                Start with a <Text style={styles.tipHighlight}>Consistency</Text> challenge to build habits
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipIcon}>🏆</Text>
              <Text style={styles.tipText}>
                Earn points and rewards for completing challenges
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipIcon}>👥</Text>
              <Text style={styles.tipText}>
                Compete with friends and see your ranking on leaderboards
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipIcon}>📈</Text>
              <Text style={styles.tipText}>
                Track your progress daily and stay motivated
              </Text>
            </View>
          </View>
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
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  gettingStartedSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gettingStartedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  tipsContainer: {
    gap: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tipHighlight: {
    fontWeight: '600',
    color: '#4CAF50',
  },
});