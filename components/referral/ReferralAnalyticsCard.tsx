import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { ReferralAnalytics } from '../../lib/referrals';

interface ReferralAnalyticsCardProps {
  analytics: ReferralAnalytics;
}

export const ReferralAnalyticsCard: React.FC<ReferralAnalyticsCardProps> = ({ analytics }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Your Referral Performance</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{analytics.total_referrals}</Text>
          <Text style={styles.statLabel}>Total Referrals</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{analytics.successful_signups}</Text>
          <Text style={styles.statLabel}>Successful Signups</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{analytics.converted_purchases}</Text>
          <Text style={styles.statLabel}>Converted Purchases</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.rewardValue]}>
            ${analytics.total_rewards_earned.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
      </View>

      <View style={styles.additionalStats}>
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Conversion Rate:</Text>
          <Text style={[styles.statRowValue, { color: analytics.conversion_rate > 50 ? '#4CAF50' : '#FF9800' }]}>
            {analytics.conversion_rate.toFixed(1)}%
          </Text>
        </View>
        
        {analytics.avg_conversion_days > 0 && (
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>Avg. Conversion Time:</Text>
            <Text style={styles.statRowValue}>
              {analytics.avg_conversion_days.toFixed(0)} days
            </Text>
          </View>
        )}
      </View>

      {analytics.top_referral_sources.length > 0 && (
        <View style={styles.sourcesSection}>
          <Text style={styles.sourcesTitle}>Top Referral Sources</Text>
          {analytics.top_referral_sources.slice(0, 3).map((source, index) => (
            <View key={source.source} style={styles.sourceItem}>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>
                  {source.source.charAt(0).toUpperCase() + source.source.slice(1)}
                </Text>
                <Text style={styles.sourceCount}>{source.count} referrals</Text>
              </View>
              <Text style={styles.sourceRate}>
                {source.conversion_rate.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Next Milestone</Text>
        {analytics.total_referrals < 5 ? (
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {5 - analytics.total_referrals} more referrals to unlock 1.2x bonus tier
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(analytics.total_referrals / 5) * 100}%` }
                ]} 
              />
            </View>
          </View>
        ) : analytics.total_referrals < 10 ? (
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {10 - analytics.total_referrals} more referrals to unlock 1.5x bonus tier
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((analytics.total_referrals - 5) / 5) * 100}%` }
                ]} 
              />
            </View>
          </View>
        ) : analytics.total_referrals < 25 ? (
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {25 - analytics.total_referrals} more referrals to unlock 2x bonus tier
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((analytics.total_referrals - 10) / 15) * 100}%` }
                ]} 
              />
            </View>
          </View>
        ) : (
          <Text style={styles.progressText}>🎉 Maximum bonus tier achieved!</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  rewardValue: {
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  additionalStats: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statRowLabel: {
    fontSize: 14,
    color: '#666',
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sourcesSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
    marginBottom: 16,
  },
  sourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    marginBottom: 4,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  sourceCount: {
    fontSize: 12,
    color: '#666',
  },
  sourceRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressInfo: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
});