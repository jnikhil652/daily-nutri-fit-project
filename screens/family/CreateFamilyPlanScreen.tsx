import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FamilyPlanService, CreateFamilyPlanRequest } from '../../lib/familyPlans';

interface CreateFamilyPlanScreenProps {
  navigation: any;
}

export const CreateFamilyPlanScreen: React.FC<CreateFamilyPlanScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState<CreateFamilyPlanRequest>({
    family_name: '',
    plan_type: 'standard',
    max_members: 6,
    family_goals: {},
    coordination_preferences: {},
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof CreateFamilyPlanRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.family_name.trim()) {
      Alert.alert('Error', 'Please enter a family name');
      return false;
    }
    if (formData.max_members < 2 || formData.max_members > 20) {
      Alert.alert('Error', 'Maximum members must be between 2 and 20');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const familyPlan = await FamilyPlanService.createFamilyPlan(formData);
      Alert.alert('Success', 'Family plan created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('FamilyPlanDetails', { familyPlanId: familyPlan.id }),
        },
      ]);
    } catch (error) {
      console.error('Error creating family plan:', error);
      Alert.alert('Error', 'Failed to create family plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.title}>Create Family Plan</Text>
          <Text style={styles.subtitle}>
            Set up a shared plan to coordinate nutrition goals with your family
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Family Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.family_name}
              onChangeText={(value) => handleInputChange('family_name', value)}
              placeholder="e.g., The Smith Family"
              maxLength={100}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Plan Type</Text>
            <View style={styles.radioGroup}>
              {['standard', 'premium', 'custom'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.radioOption,
                    formData.plan_type === type && styles.radioOptionSelected,
                  ]}
                  onPress={() => handleInputChange('plan_type', type)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.plan_type === type && styles.radioTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Maximum Members</Text>
            <TextInput
              style={styles.input}
              value={formData.max_members.toString()}
              onChangeText={(value) => handleInputChange('max_members', parseInt(value) || 6)}
              placeholder="6"
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.helpText}>
              Maximum number of family members (2-20)
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Family Goals (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.family_goals?.description || ''}
              onChangeText={(value) => 
                handleInputChange('family_goals', { ...formData.family_goals, description: value })
              }
              placeholder="Describe your family's nutrition and health goals..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Coordination Preferences</Text>
            <View style={styles.checkboxGroup}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => {
                  const preferences = formData.coordination_preferences || {};
                  handleInputChange('coordination_preferences', {
                    ...preferences,
                    unified_delivery: !preferences.unified_delivery,
                  });
                }}
              >
                <View style={[
                  styles.checkboxBox,
                  formData.coordination_preferences?.unified_delivery && styles.checkboxChecked,
                ]}>
                  {formData.coordination_preferences?.unified_delivery && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxText}>Unified delivery scheduling</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => {
                  const preferences = formData.coordination_preferences || {};
                  handleInputChange('coordination_preferences', {
                    ...preferences,
                    shared_goals: !preferences.shared_goals,
                  });
                }}
              >
                <View style={[
                  styles.checkboxBox,
                  formData.coordination_preferences?.shared_goals && styles.checkboxChecked,
                ]}>
                  {formData.coordination_preferences?.shared_goals && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxText}>Share family health goals</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create Family Plan'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
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
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  radioOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  radioText: {
    fontSize: 14,
    color: '#666',
  },
  radioTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  checkboxGroup: {
    gap: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});