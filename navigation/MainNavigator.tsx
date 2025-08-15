import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { FruitCatalogScreen } from '../screens/main/FruitCatalogScreen';
import { FruitDetailScreen } from '../screens/main/FruitDetailScreen';
import { FavoritesScreen } from '../screens/main/FavoritesScreen';
import { WalletScreen } from '../screens/main/WalletScreen';
import { MainStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Daily Nutri Fit' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="FruitCatalog" 
        component={FruitCatalogScreen} 
        options={{ title: 'Fruit Catalog' }}
      />
      <Stack.Screen 
        name="FruitDetail" 
        component={FruitDetailScreen} 
        options={{ title: 'Fruit Details' }}
      />
      <Stack.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{ title: 'My Favorites' }}
      />
      <Stack.Screen 
        name="Wallet" 
        component={WalletScreen} 
        options={{ title: 'My Wallet' }}
      />
    </Stack.Navigator>
  );
};