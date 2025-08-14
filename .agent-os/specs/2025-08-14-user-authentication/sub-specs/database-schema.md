# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-14-user-authentication/spec.md

> Created: 2025-08-14
> Version: 1.0.0

## Schema Changes

### New Tables

**profiles** - Extended user profile information beyond Supabase auth.users
- Links to Supabase auth system for user management
- Stores delivery preferences and health-related information
- Enables future health profiling and personalization features

### Database Schema

```sql
-- Profiles table for extended user information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Delivery addresses table (users can have multiple addresses)
CREATE TABLE delivery_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'US' NOT NULL,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_delivery_addresses_user_id ON delivery_addresses(user_id);
CREATE INDEX idx_delivery_addresses_primary ON delivery_addresses(user_id, is_primary) WHERE is_primary = true;

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Delivery addresses RLS policies
CREATE POLICY "Users can view their own addresses" 
  ON delivery_addresses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" 
  ON delivery_addresses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
  ON delivery_addresses FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
  ON delivery_addresses FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at fields
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON delivery_addresses
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
```

## Rationale

**Separate Profiles Table:** Supabase auth.users table should only contain authentication data. Extended user information is stored in a separate profiles table with proper foreign key relationships.

**Multiple Delivery Addresses:** Users may want deliveries to different locations (home, office, etc.), so we support multiple addresses with a primary address designation.

**Row Level Security:** Ensures users can only access their own data, providing database-level security in addition to application-level controls.

**Automatic Profile Creation:** Trigger automatically creates a profile record when a user signs up, ensuring data consistency.

**Performance Considerations:** Proper indexing on frequently queried columns (email, user_id, primary addresses) for optimal performance.

## Migration Strategy

1. Run the schema creation script in Supabase SQL editor
2. Test RLS policies with test users
3. Verify trigger functions work with registration flow
4. Confirm all indexes are created properly