import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { MainStackParamList } from '../../types/navigation';

type HomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Daily Nutri Fit!</Text>
        <Text style={styles.subtitle}>
          Hello, {user?.user_metadata?.full_name || user?.email}!
        </Text>
        
        <View style={styles.placeholderContainer}>
          <TouchableOpacity 
            style={styles.featureButton} 
            onPress={() => navigation.navigate('FruitCatalog')}
          >
            <Text style={styles.featureButtonText}>🍎 Browse Fruit Catalog</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.featureButton, styles.walletButton]} 
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.featureButtonText}>💳 My Wallet</Text>
          </TouchableOpacity>
          
          <Text style={styles.placeholderText}>
            🛒 Shopping cart coming soon...
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileButtonText}>Manage Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  placeholderContainer: {
    marginBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  featureButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  walletButton: {
    backgroundColor: '#2196F3',
  },
  featureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 16,
    marginBottom: 12,
    color: '#888',
  },
  buttonContainer: {
    gap: 16,
    alignItems: 'center',
  },
  profileButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});