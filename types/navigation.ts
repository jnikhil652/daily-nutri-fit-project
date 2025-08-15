// Navigation type definitions to avoid circular imports

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  FruitCatalog: undefined;
  FruitDetail: { fruitId: string };
  Favorites: undefined;
  Wallet: undefined;
  Cart: undefined;
  Checkout: undefined;
};