# Daily Nutri Fit - Fruit Delivery App

A React Native app for personalized fruit delivery with health-focused recommendations.

## 🚀 Current Status

### ✅ Completed Features
- **User Authentication System**
  - User registration with email/password
  - Login functionality
  - Password reset via email
  - Session persistence
  - Automatic profile creation
  - Protected routes

### 🔄 In Progress
- Fruit catalog system
- Shopping cart functionality
- Wallet system
- Payment integration

## 🛠 Setup Instructions

### Prerequisites
- Node.js 22 LTS
- npm or yarn
- Expo CLI
- Supabase account

### 1. Install Dependencies
```bash
npm install
```

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_KEY=your_supabase_publishable_key_here
   ```

### 3. Database Setup
1. In your Supabase dashboard, go to SQL Editor
2. Run the SQL commands from `database/schema.sql`
3. This will create:
   - `profiles` table for user information
   - `delivery_addresses` table for user addresses
   - Row Level Security policies
   - Automatic profile creation trigger

### 4. Run the App
```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your device

## 📱 Features

### Authentication
- **Registration**: Create account with email, password, and full name
- **Login**: Sign in with email and password
- **Password Reset**: Reset password via email link
- **Session Management**: Automatic session persistence and refresh
- **Profile Management**: Automatic profile creation on signup

### Navigation
- **Auth Flow**: Login, Register, Forgot Password screens
- **Main Flow**: Home screen for authenticated users
- **Protected Routes**: Automatic redirection based on auth state

## 🏗 Architecture

### Tech Stack
- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth)
- **Navigation**: React Navigation v6
- **Forms**: React Hook Form + Yup validation
- **State Management**: React Context
- **Storage**: AsyncStorage for session persistence

### Project Structure
```
├── contexts/
│   └── AuthContext.tsx          # Authentication state management
├── navigation/
│   ├── AppNavigator.tsx         # Main navigation container
│   ├── AuthNavigator.tsx        # Authentication flow
│   └── MainNavigator.tsx        # Authenticated user flow
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx      # Login form
│   │   ├── RegisterScreen.tsx   # Registration form
│   │   └── ForgotPasswordScreen.tsx # Password reset
│   └── main/
│       └── HomeScreen.tsx       # Main dashboard
├── lib/
│   └── supabase.ts             # Supabase client configuration
└── database/
    └── schema.sql              # Database schema
```

## 🔐 Security Features

- **Row Level Security**: Database-level access control
- **JWT Authentication**: Secure token-based auth
- **Email Verification**: Optional email verification on signup
- **Password Validation**: Minimum 6 characters required
- **Session Management**: Automatic token refresh

## 📋 Next Steps

Based on the product roadmap, the next features to implement are:

1. **Fruit Catalog** - Browse available fruits with images and descriptions
2. **Basic Ordering** - Shopping cart and order placement
3. **Wallet System** - Digital wallet for payments
4. **Payment Integration** - Stripe integration for wallet top-up

## 🧪 Testing

To test the authentication system:

1. Start the app
2. Try registering a new account
3. Check your email for verification (if enabled)
4. Test login with the new account
5. Test password reset functionality
6. Verify session persistence by closing and reopening the app

## 🤝 Contributing

This project follows the Agent OS development workflow. See `.agent-os/` directory for:
- Product specifications
- Development roadmap
- Technical decisions
- Task management

## 📄 License

MIT License - see LICENSE file for details.