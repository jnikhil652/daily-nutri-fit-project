# Technical Stack

> Last Updated: 2025-08-15
> Version: 1.2.0

## Core Technologies

### Mobile Framework
- **Framework:** React Native
- **Version:** Latest stable
- **CLI:** Expo CLI
- **Language:** TypeScript/JavaScript

### Backend & Database
- **Backend-as-a-Service:** Supabase
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage

## Frontend Stack

### Mobile App Framework
- **Framework:** React Native 0.79.5
- **Version:** React 19.0.0
- **Build Tool:** Expo ~53.0.20
- **TypeScript:** ~5.8.3 (Fully implemented)

### Import Strategy
- **Strategy:** Node.js modules
- **Package Manager:** npm
- **Node Version:** 22 LTS

### UI Components
- **Mobile:** React Native built-in components + react-native-super-grid
- **Navigation:** React Navigation 7.x (Native Stack)
- **State Management:** React Context API (Auth & Cart contexts)
- **Forms:** React Hook Form with Yup validation

## Assets & Media

### Fonts
- **Provider:** Google Fonts
- **Loading Strategy:** Expo Google Fonts

### Icons
- **Library:** Expo Vector Icons
- **Implementation:** React Native components

## Infrastructure

### Application Hosting
- **Platform:** Expo Application Services (EAS)
- **iOS Distribution:** App Store
- **Android Distribution:** Google Play Store

### Database Hosting
- **Provider:** Supabase (Managed PostgreSQL)
- **Backups:** Daily automated via Supabase
- **Scaling:** Auto-scaling with Supabase

### Asset Storage
- **Provider:** Supabase Storage
- **CDN:** Supabase CDN
- **Access:** Public and private buckets with signed URLs

## Payment & Services

### Payment Processing
- **Provider:** Razorpay (integrated with Supabase Edge Functions)
- **Wallet System:** Custom PostgreSQL implementation with atomic transactions
- **Mobile Payments:** react-native-razorpay 2.3.0
- **Security:** RLS policies and server-side payment verification

### Push Notifications
- **Provider:** Expo Notifications
- **Scheduling:** For delivery reminders and health tips

## Testing & Development

### Testing Framework
- **Unit Testing:** Jest 30.0.5 + React Test Renderer
- **Component Testing:** @testing-library/react-native
- **Coverage:** Comprehensive test coverage for auth, components, and services
- **Database Testing:** SQL-based schema validation tests

### Development Tools
- **Data Fetching:** @tanstack/react-query for caching and state management
- **Async Storage:** @react-native-async-storage/async-storage
- **URL Polyfill:** react-native-url-polyfill for Node.js compatibility

## Deployment

### CI/CD Pipeline
- **Platform:** Expo Application Services (EAS)
- **Build:** EAS Build
- **Submit:** EAS Submit
- **Update:** Expo Updates (OTA)

### Environments
- **Production:** Production Supabase project
- **Development:** Development Supabase project
- **Testing:** Preview builds via EAS

### Code Repository
- **Platform:** GitHub
- **URL:** https://github.com/jnikhil652/daily-nutri-fit-project