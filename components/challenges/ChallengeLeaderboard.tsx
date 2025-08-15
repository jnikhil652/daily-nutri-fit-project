import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { ChallengeLeaderboard as LeaderboardEntry } from '../../lib/challenges';

interface ChallengeLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
  loading?: boolean;
}

export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  leaderboard,
  currentUserId,
  loading = false,
}) => {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#E0E0E0';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = currentUserId && item.user_id === currentUserId;
    const rankIcon = getRankIcon(item.current_rank);

    return (
      <View style={[
        styles.leaderboardItem,
        isCurrentUser && styles.currentUserItem,
        item.current_rank <= 3 && styles.topThreeItem,
      ]}>
        <View style={styles.rankSection}>
          {rankIcon ? (
            <Text style={styles.rankIcon}>{rankIcon}</Text>
          ) : (
            <View style={[styles.rankBadge, { backgroundColor: getRankColor(item.current_rank) }]}>
              <Text style={[styles.rankText, item.current_rank <= 3 && styles.topRankText]}>
                {item.current_rank}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
            {isCurrentUser ? 'You' : `User ${item.user_id.slice(-4)}`}
            {isCurrentUser && <Text style={styles.youIndicator}> (You)</Text>}
          </Text>
          <View style={styles.userStats}>
            <Text style={styles.userStatus}>
              Status: {item.completion_status === 'active' ? '🏃‍♂️ Active' : 
                      item.completion_status === 'completed' ? '✅ Completed' : 
                      '❌ Withdrawn'}
            </Text>
            {item.completion_date && (
              <Text style={styles.completionDate}>
                Completed: {new Date(item.completion_date).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.scoreSection}>
          <Text style={[styles.score, isCurrentUser && styles.currentUserText]}>
            {item.final_score}
          </Text>
          <Text style={styles.scoreLabel}>points</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
      <Text style={styles.headerSubtitle}>
        {leaderboard.length} participants
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏁</Text>
      <Text style={styles.emptyTitle}>No participants yet</Text>
      <Text style={styles.emptyDescription}>
        Be the first to join this challenge and claim the top spot!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingState}>
          <Text>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => `${item.challenge_id}-${item.user_id}`}
        renderItem={renderLeaderboardItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={leaderboard.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  currentUserItem: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  topThreeItem: {
    backgroundColor: '#FFF9C4',
  },
  rankSection: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankIcon: {
    fontSize: 24,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  topRankText: {
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  currentUserText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  youIndicator: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'normal',
  },
  userStats: {
    gap: 2,
  },
  userStatus: {
    fontSize: 12,
    color: '#666',
  },
  completionDate: {
    fontSize: 11,
    color: '#999',
  },
  scoreSection: {
    alignItems: 'center',
    minWidth: 60,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#666',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
    lineHeight: 20,
  },
});