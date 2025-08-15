import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { Referral, ReferralService } from '../../lib/referrals';

interface ReferralCardProps {
  referral: Referral;
  onShare?: () => void;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({ referral, onShare }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'earned':
        return '#4CAF50';
      case 'credited':
        return '#2196F3';
      case 'expired':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Waiting for signup';
      case 'earned':
        return 'Reward earned';
      case 'credited':
        return 'Reward credited';
      case 'expired':
        return 'Expired';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = await ReferralService.generateShareContent(referral.referral_code);
      
      await Share.share({
        title: shareContent.title,
        message: shareContent.message,
        url: shareContent.url,
      });

      // Track sharing activity
      await ReferralService.trackReferralInteraction(referral.referral_code, 'click');
      
      if (onShare) {
        onShare();
      }
    } catch (error) {
      console.error('Error sharing referral:', error);
      Alert.alert('Error', 'Failed to share referral code');
    }
  };

  const handleCopyCode = async () => {
    // In a real implementation, you'd use a clipboard library
    Alert.alert('Copied!', `Referral code ${referral.referral_code} copied to clipboard`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>Referral Code</Text>
          <TouchableOpacity style={styles.codeContainer} onPress={handleCopyCode}>
            <Text style={styles.code}>{referral.referral_code}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(referral.reward_status) }]}>
          <Text style={styles.statusText}>{getStatusText(referral.reward_status)}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Method:</Text>
          <Text style={styles.value}>{referral.referral_method}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Source:</Text>
          <Text style={styles.value}>{referral.referral_source}</Text>
        </View>

        {referral.reward_amount && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Reward:</Text>
            <Text style={[styles.value, styles.rewardValue]}>
              ${referral.reward_amount.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Bonus Tier:</Text>
          <Text style={styles.value}>{referral.bonus_tier}x</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Created:</Text>
          <Text style={styles.value}>
            {new Date(referral.invited_at).toLocaleDateString()}
          </Text>
        </View>

        {referral.signed_up_at && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Signed Up:</Text>
            <Text style={styles.value}>
              {new Date(referral.signed_up_at).toLocaleDateString()}
            </Text>
          </View>
        )}

        {referral.first_purchase_at && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>First Purchase:</Text>
            <Text style={styles.value}>
              {new Date(referral.first_purchase_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {referral.reward_status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Share Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            <Text style={styles.copyButtonText}>Copy Code</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  codeSection: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  codeContainer: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  code: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  rewardValue: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  copyButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});