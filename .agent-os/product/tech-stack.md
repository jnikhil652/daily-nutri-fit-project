# Technical Stack

> Last Updated: 2025-08-15
> Version: 1.1.0

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
- **Framework:** React Native
- **Version:** Latest stable
- **Build Tool:** Expo
- **TypeScript:** Yes

### Import Strategy
- **Strategy:** Node.js modules
- **Package Manager:** npm
- **Node Version:** 22 LTS

### UI Components
- **Mobile:** NativeBase or React Native Elements
- **Version:** Latest stable
- **Navigation:** React Navigation

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
- **Provider:** Razorpay (integrated with Supabase)
- **Wallet System:** Custom implementation with Supabase database
- **Mobile Payments:** Razorpay React Native SDK

### Push Notifications
- **Provider:** Expo Notifications
- **Scheduling:** For delivery reminders and health tips

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