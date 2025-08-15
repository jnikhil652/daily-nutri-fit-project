import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { CommunityChallenge, ChallengeParticipant } from '../../lib/challenges';

interface ChallengeCardProps {
  challenge: CommunityChallenge;
  participation?: ChallengeParticipant;
  onPress: () => void;
  onJoin?: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  participation,
  onPress,
  onJoin,
}) => {
  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1:
        return '#4CAF50';
      case 2:
        return '#8BC34A';
      case 3:
        return '#FF9800';
      case 4:
        return '#FF5722';
      case 5:
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1:
        return 'Beginner';
      case 2:
        return 'Easy';
      case 3:
        return 'Medium';
      case 4:
        return 'Hard';
      case 5:
        return 'Expert';
      default:
        return 'Unknown';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consistency':
        return '#2196F3';
      case 'variety':
        return '#9C27B0';
      case 'seasonal':
        return '#FF9800';
      case 'goal_based':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const isActive = () => {
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    return now >= startDate && now <= endDate && challenge.is_active;
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const endDate = new Date(challenge.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleJoin = () => {
    if (!isActive()) {
      Alert.alert('Challenge Unavailable', 'This challenge is not currently active.');
      return;
    }

    if (participation) {
      onPress();
    } else if (onJoin) {
      onJoin();
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{challenge.challenge_name}</Text>
          {challenge.featured_priority > 0 && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          )}
        </View>
        <View style={styles.badges}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(challenge.challenge_type) }]}>
            <Text style={styles.badgeText}>
              {challenge.challenge_type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(challenge.difficulty_level) }]}>
            <Text style={styles.badgeText}>
              {getDifficultyText(challenge.difficulty_level)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {challenge.description}
      </Text>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{challenge.duration_days} days</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Days Left:</Text>
          <Text style={[styles.detailValue, { color: getDaysRemaining() <= 3 ? '#F44336' : '#4CAF50' }]}>
            {getDaysRemaining()}
          </Text>
        </View>

        {challenge.max_participants && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Max Participants:</Text>
            <Text style={styles.detailValue}>{challenge.max_participants}</Text>
          </View>
        )}
      </View>

      {participation && (
        <View style={styles.participationStatus}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusValue, { 
              color: participation.completion_status === 'active' ? '#4CAF50' : 
                    participation.completion_status === 'completed' ? '#2196F3' : '#FF9800'
            }]}>
              {participation.completion_status.toUpperCase()}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Your Score:</Text>
            <Text style={styles.statusValue}>{participation.final_score} pts</Text>
          </View>
          {participation.rank_position && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Rank:</Text>
              <Text style={styles.statusValue}>#{participation.rank_position}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.rewards}>
        <Text style={styles.rewardsTitle}>Rewards:</Text>
        <View style={styles.rewardsList}>
          {challenge.reward_structure?.completion_points && (
            <Text style={styles.rewardItem}>
              🏆 {challenge.reward_structure.completion_points} points
            </Text>
          )}
          {challenge.reward_structure?.credits && (
            <Text style={styles.rewardItem}>
              💰 ${challenge.reward_structure.credits} credits
            </Text>
          )}
          {challenge.reward_structure?.badges && (
            <Text style={styles.rewardItem}>
              🏅 {challenge.reward_structure.badges.join(', ')}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {participation ? (
          <TouchableOpacity style={styles.viewButton} onPress={onPress}>
            <Text style={styles.viewButtonText}>View Progress</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[
              styles.joinButton, 
              !isActive() && styles.disabledButton
            ]} 
            onPress={handleJoin}
            disabled={!isActive()}
          >
            <Text style={[
              styles.joinButtonText,
              !isActive() && styles.disabledButtonText
            ]}>
              {isActive() ? 'Join Challenge' : 'Ended'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  featuredBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  featuredText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  participationStatus: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  rewards: {
    marginBottom: 12,
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  rewardsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardItem: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledButtonText: {
    color: '#9E9E9E',
  },
});