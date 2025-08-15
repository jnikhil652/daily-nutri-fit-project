import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { ChallengeLeaderboard } from '../../components/challenges/ChallengeLeaderboard';
import {
  CommunityChallenge,
  ChallengeParticipant,
  ChallengeProgress,
  ChallengeStats,
  ChallengeLeaderboard as LeaderboardEntry,
  ChallengeService,
} from '../../lib/challenges';

interface ChallengeDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      challengeId: string;
    };
  };
}

export const ChallengeDetailsScreen: React.FC<ChallengeDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { challengeId } = route.params;
  const [challenge, setChallenge] = useState<CommunityChallenge | null>(null);
  const [participation, setParticipation] = useState<ChallengeParticipant | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'leaderboard'>('overview');
  const [showProgressModal, setShowProgressModal] = useState(false);

  useEffect(() => {
    loadChallengeData();
  }, [challengeId]);

  const loadChallengeData = async () => {
    try {
      const [challengeData, participationData, statsData, leaderboardData] = await Promise.all([
        ChallengeService.getChallenge(challengeId),
        ChallengeService.getUserParticipation(challengeId),
        ChallengeService.getChallengeStats(challengeId),
        ChallengeService.getChallengeLeaderboard(challengeId),
      ]);

      setChallenge(challengeData);
      setParticipation(participationData);
      setStats(statsData);
      setLeaderboard(leaderboardData);

      if (participationData) {
        const progressData = await ChallengeService.getChallengeProgress(challengeId);
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading challenge data:', error);
      Alert.alert('Error', 'Failed to load challenge details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChallengeData();
    setRefreshing(false);
  };

  const handleJoinChallenge = async () => {
    if (!challenge) return;

    try {
      await ChallengeService.joinChallenge({
        challenge_id: challenge.id,
        is_visible: true,
      });

      Alert.alert('Success', 'Successfully joined the challenge!');
      await loadChallengeData();
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join challenge');
    }
  };

  const handleWithdraw = async () => {
    Alert.alert(
      'Withdraw from Challenge',
      'Are you sure you want to withdraw from this challenge? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChallengeService.withdrawFromChallenge(challengeId);
              Alert.alert('Success', 'Successfully withdrew from challenge');
              await loadChallengeData();
            } catch (error) {
              console.error('Error withdrawing from challenge:', error);
              Alert.alert('Error', 'Failed to withdraw from challenge');
            }
          },
        },
      ]
    );
  };

  const handleAddProgress = () => {
    setShowProgressModal(true);
  };

  const submitProgress = async (fruits: string[], notes: string) => {
    try {
      const dailyScore = fruits.length * 10; // Simple scoring: 10 points per fruit
      
      await ChallengeService.addProgress(challengeId, {
        progress_data: { fruits, date: new Date().toISOString().split('T')[0] },
        daily_score: dailyScore,
        notes,
      });

      Alert.alert('Success', 'Progress recorded successfully!');
      setShowProgressModal(false);
      await loadChallengeData();
    } catch (error) {
      console.error('Error adding progress:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to record progress');
    }
  };

  const getDaysRemaining = () => {
    if (!challenge) return 0;
    const now = new Date();
    const endDate = new Date(challenge.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isActive = () => {
    if (!challenge) return false;
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    return now >= startDate && now <= endDate && challenge.is_active;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading challenge details...</Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.centerContainer}>
        <Text>Challenge not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{challenge.challenge_name}</Text>
          <Text style={styles.description}>{challenge.description}</Text>
          
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getDaysRemaining()}</Text>
              <Text style={styles.statLabel}>Days Left</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.total_participants || 0}</Text>
              <Text style={styles.statLabel}>Participants</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{challenge.difficulty_level}/5</Text>
              <Text style={styles.statLabel}>Difficulty</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {participation ? (
              <View style={styles.participantActions}>
                {participation.completion_status === 'active' && (
                  <>
                    <TouchableOpacity style={styles.progressButton} onPress={handleAddProgress}>
                      <Text style={styles.progressButtonText}>+ Add Progress</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
                      <Text style={styles.withdrawButtonText}>Withdraw</Text>
                    </TouchableOpacity>
                  </>
                )}
                <View style={styles.userStatus}>
                  <Text style={styles.userStatusTitle}>Your Status</Text>
                  <Text style={styles.userStatusText}>
                    {participation.completion_status.toUpperCase()}
                  </Text>
                  <Text style={styles.userScore}>Score: {participation.final_score} pts</Text>
                  {stats?.user_rank && (
                    <Text style={styles.userRank}>Rank: #{stats.user_rank}</Text>
                  )}
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.joinButton, !isActive() && styles.disabledButton]}
                onPress={handleJoinChallenge}
                disabled={!isActive()}
              >
                <Text style={[styles.joinButtonText, !isActive() && styles.disabledButtonText]}>
                  {isActive() ? 'Join Challenge' : 'Challenge Ended'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {['overview', 'progress', 'leaderboard'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Challenge Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.cardTitle}>Challenge Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>
                  {challenge.challenge_type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{challenge.duration_days} days</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(challenge.start_date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(challenge.end_date).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Success Criteria */}
            <View style={styles.detailsCard}>
              <Text style={styles.cardTitle}>Success Criteria</Text>
              {Object.entries(challenge.success_criteria).map(([key, value]) => (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {key.replace('_', ' ').toUpperCase()}:
                  </Text>
                  <Text style={styles.detailValue}>{String(value)}</Text>
                </View>
              ))}
            </View>

            {/* Rewards */}
            <View style={styles.detailsCard}>
              <Text style={styles.cardTitle}>Rewards</Text>
              {challenge.reward_structure?.completion_points && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>🏆</Text>
                  <Text style={styles.rewardText}>
                    {challenge.reward_structure.completion_points} points
                  </Text>
                </View>
              )}
              {challenge.reward_structure?.credits && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>💰</Text>
                  <Text style={styles.rewardText}>
                    ${challenge.reward_structure.credits} credits
                  </Text>
                </View>
              )}
              {challenge.reward_structure?.badges && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>🏅</Text>
                  <Text style={styles.rewardText}>
                    {challenge.reward_structure.badges.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'progress' && (
          <View style={styles.tabContent}>
            {participation ? (
              progress.length > 0 ? (
                <View style={styles.progressList}>
                  <Text style={styles.cardTitle}>Your Progress</Text>
                  {progress.map((entry, index) => (
                    <View key={entry.id} style={styles.progressItem}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressDate}>
                          {new Date(entry.progress_date).toLocaleDateString()}
                        </Text>
                        <Text style={styles.progressScore}>+{entry.daily_score} pts</Text>
                      </View>
                      {entry.progress_data.fruits && (
                        <Text style={styles.progressData}>
                          Fruits: {entry.progress_data.fruits.join(', ')}
                        </Text>
                      )}
                      {entry.notes && (
                        <Text style={styles.progressNotes}>{entry.notes}</Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyProgress}>
                  <Text style={styles.emptyTitle}>No Progress Yet</Text>
                  <Text style={styles.emptyDescription}>
                    Start tracking your daily progress to see your journey!
                  </Text>
                  {participation.completion_status === 'active' && (
                    <TouchableOpacity style={styles.emptyButton} onPress={handleAddProgress}>
                      <Text style={styles.emptyButtonText}>Add First Progress</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            ) : (
              <View style={styles.emptyProgress}>
                <Text style={styles.emptyTitle}>Join to Track Progress</Text>
                <Text style={styles.emptyDescription}>
                  Join this challenge to start tracking your daily progress
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'leaderboard' && (
          <View style={styles.tabContent}>
            <ChallengeLeaderboard
              leaderboard={leaderboard}
              currentUserId={participation?.user_id}
              loading={false}
            />
          </View>
        )}
      </ScrollView>

      {/* Progress Modal */}
      <Modal
        visible={showProgressModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProgressModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Today's Progress</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowProgressModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          {/* Simple progress form - in a real app, this would be more sophisticated */}
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Record the fruits you consumed today for this challenge.
            </Text>
            
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => submitProgress(['apple', 'banana'], 'Quick daily entry')}
            >
              <Text style={styles.quickAddText}>🍎🍌 Quick Add: Apple + Banana</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => submitProgress(['orange', 'grapes', 'strawberry'], 'Variety pack today!')}
            >
              <Text style={styles.quickAddText}>🍊🍇🍓 Variety Pack (3 fruits)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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
  actions: {
    marginTop: 16,
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledButtonText: {
    color: '#9E9E9E',
  },
  participantActions: {
    gap: 12,
  },
  progressButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  progressButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  withdrawButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userStatus: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  userStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  userScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  userRank: {
    fontSize: 12,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  rewardIcon: {
    fontSize: 16,
  },
  rewardText: {
    fontSize: 14,
    color: '#333',
  },
  progressList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  progressItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressData: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  progressNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyProgress: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: '#2196F3',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  quickAddButton: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickAddText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});