import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { FamilyMember } from '../../lib/familyPlans';

interface FamilyMemberCardProps {
  member: FamilyMember;
  canEdit: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
}

export const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  canEdit,
  onEdit,
  onRemove,
}) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#FF9800';
      case 'member':
        return '#4CAF50';
      case 'child':
        return '#2196F3';
      case 'guest':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.display_name || 'this member'} from the family plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: onRemove,
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.memberInfo}>
          <Text style={styles.displayName}>
            {member.display_name || 'Family Member'}
          </Text>
          {member.relationship && (
            <Text style={styles.relationship}>{member.relationship}</Text>
          )}
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
          <Text style={styles.roleText}>{member.role.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, { color: member.is_active ? '#4CAF50' : '#F44336' }]}>
            {member.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Joined:</Text>
          <Text style={styles.value}>
            {new Date(member.joined_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {canEdit && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onRemove && member.role !== 'admin' && (
            <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  relationship: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  details: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  value: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});