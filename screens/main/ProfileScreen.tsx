import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Profile, DeliveryAddress } from '../../lib/supabase';

export const ProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
  });

  // Address form state
  const [addressForm, setAddressForm] = useState({
    title: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    is_primary: false,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadAddresses();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setProfileForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    }
  };

  const loadAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Failed to load delivery addresses');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          ...profileForm,
        });

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      setEditingProfile(false);
      loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async () => {
    if (!user) return;

    setSaving(true);
    try {
      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('delivery_addresses')
          .update(addressForm)
          .eq('id', editingAddress);

        if (error) throw error;
      } else {
        // Create new address
        const { error } = await supabase
          .from('delivery_addresses')
          .insert({
            ...addressForm,
            user_id: user.id,
          });

        if (error) throw error;
      }

      Alert.alert('Success', 'Address saved successfully');
      setEditingAddress(null);
      setNewAddress(false);
      resetAddressForm();
      loadAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('delivery_addresses')
                .delete()
                .eq('id', addressId);

              if (error) throw error;
              loadAddresses();
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const editAddress = (address: DeliveryAddress) => {
    setAddressForm({
      title: address.title,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_primary: address.is_primary,
    });
    setEditingAddress(address.id);
  };

  const resetAddressForm = () => {
    setAddressForm({
      title: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
      is_primary: false,
    });
  };

  const cancelAddressEdit = () => {
    setEditingAddress(null);
    setNewAddress(false);
    resetAddressForm();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Profile Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profile Information</Text>
              {!editingProfile && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditingProfile(true)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {editingProfile ? (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={profileForm.full_name}
                    onChangeText={(text) =>
                      setProfileForm({ ...profileForm, full_name: text })
                    }
                    placeholder="Enter your full name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={profileForm.phone}
                    onChangeText={(text) =>
                      setProfileForm({ ...profileForm, phone: text })
                    }
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <TextInput
                    style={styles.input}
                    value={profileForm.date_of_birth}
                    onChangeText={(text) =>
                      setProfileForm({ ...profileForm, date_of_birth: text })
                    }
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setEditingProfile(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={saveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.profileInfo}>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Email: </Text>
                  {user?.email}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Name: </Text>
                  {profile?.full_name || 'Not set'}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Phone: </Text>
                  {profile?.phone || 'Not set'}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Date of Birth: </Text>
                  {profile?.date_of_birth || 'Not set'}
                </Text>
              </View>
            )}
          </View>

          {/* Delivery Addresses Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Addresses</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  resetAddressForm();
                  setNewAddress(true);
                }}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {addresses.map((address) => (
              <View key={address.id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressTitle}>
                    {address.title}
                    {address.is_primary && (
                      <Text style={styles.primaryBadge}> (Primary)</Text>
                    )}
                  </Text>
                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => editAddress(address)}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteAddress(address.id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.addressText}>
                  {address.address_line_1}
                  {address.address_line_2 && `, ${address.address_line_2}`}
                </Text>
                <Text style={styles.addressText}>
                  {address.city}, {address.state} {address.postal_code}
                </Text>
                <Text style={styles.addressText}>{address.country}</Text>
              </View>
            ))}

            {/* Address Form */}
            {(newAddress || editingAddress) && (
              <View style={styles.addressForm}>
                <Text style={styles.formTitle}>
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Title</Text>
                  <TextInput
                    style={styles.input}
                    value={addressForm.title}
                    onChangeText={(text) =>
                      setAddressForm({ ...addressForm, title: text })
                    }
                    placeholder="e.g., Home, Work, etc."
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Address Line 1</Text>
                  <TextInput
                    style={styles.input}
                    value={addressForm.address_line_1}
                    onChangeText={(text) =>
                      setAddressForm({ ...addressForm, address_line_1: text })
                    }
                    placeholder="Street address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Address Line 2 (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={addressForm.address_line_2}
                    onChangeText={(text) =>
                      setAddressForm({ ...addressForm, address_line_2: text })
                    }
                    placeholder="Apartment, suite, etc."
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={addressForm.city}
                      onChangeText={(text) =>
                        setAddressForm({ ...addressForm, city: text })
                      }
                      placeholder="City"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>State</Text>
                    <TextInput
                      style={styles.input}
                      value={addressForm.state}
                      onChangeText={(text) =>
                        setAddressForm({ ...addressForm, state: text })
                      }
                      placeholder="State"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Postal Code</Text>
                  <TextInput
                    style={styles.input}
                    value={addressForm.postal_code}
                    onChangeText={(text) =>
                      setAddressForm({ ...addressForm, postal_code: text })
                    }
                    placeholder="Postal code"
                  />
                </View>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() =>
                    setAddressForm({
                      ...addressForm,
                      is_primary: !addressForm.is_primary,
                    })
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      addressForm.is_primary && styles.checkboxChecked,
                    ]}
                  >
                    {addressForm.is_primary && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Set as primary address</Text>
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={cancelAddressEdit}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={saveAddress}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileInfo: {
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#666',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addressCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  primaryBadge: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  addressForm: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
    marginTop: 16,
    gap: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
});