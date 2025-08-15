-- Complete Database Schema Creation and Data Population
-- Run this script in Supabase SQL Editor

-- Drop all existing tables (in reverse dependency order) if they exist
DROP TABLE IF EXISTS fruit_health_benefits CASCADE;
DROP TABLE IF EXISTS fruit_category_mappings CASCADE;
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS fruit_nutritional_info CASCADE;
DROP TABLE IF EXISTS health_benefits CASCADE;
DROP TABLE IF EXISTS fruits CASCADE;
DROP TABLE IF EXISTS fruit_categories CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS delivery_addresses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_single_primary_address() CASCADE;
DROP FUNCTION IF EXISTS create_user_wallet() CASCADE;
DROP FUNCTION IF EXISTS update_wallet_balance(UUID, DECIMAL, transaction_type, TEXT, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS get_wallet_balance(UUID) CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_addresses table
CREATE TABLE delivery_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for delivery_addresses
CREATE POLICY "Users can view own addresses" ON delivery_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON delivery_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON delivery_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON delivery_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER delivery_addresses_updated_at
  BEFORE UPDATE ON delivery_addresses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Ensure only one primary address per user
CREATE OR REPLACE FUNCTION public.ensure_single_primary_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE delivery_addresses 
    SET is_primary = FALSE 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_address_trigger
  BEFORE INSERT OR UPDATE ON delivery_addresses
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_address();

-- Fruit Catalog Schema
-- Fruit categories table
CREATE TABLE fruit_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Main fruits table
CREATE TABLE fruits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  unit TEXT DEFAULT 'lb' NOT NULL,
  image_url TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true NOT NULL,
  is_seasonal BOOLEAN DEFAULT false NOT NULL,
  seasonal_months TEXT[], -- Array of month names
  storage_tips TEXT,
  origin_country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Junction table for fruit-category relationships (many-to-many)
CREATE TABLE fruit_category_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fruit_id UUID REFERENCES fruits(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES fruit_categories(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(fruit_id, category_id)
);

-- Detailed nutritional information
CREATE TABLE fruit_nutritional_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fruit_id UUID REFERENCES fruits(id) ON DELETE CASCADE UNIQUE NOT NULL,
  calories_per_100g INTEGER,
  protein_g DECIMAL(5,2),
  carbs_g DECIMAL(5,2),
  fiber_g DECIMAL(5,2),
  sugar_g DECIMAL(5,2),
  fat_g DECIMAL(5,2),
  vitamin_c_mg DECIMAL(6,2),
  vitamin_a_iu INTEGER,
  potassium_mg DECIMAL(7,2),
  calcium_mg DECIMAL(6,2),
  iron_mg DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Health benefits lookup table
CREATE TABLE health_benefits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Junction table for fruit-health benefit relationships
CREATE TABLE fruit_health_benefits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fruit_id UUID REFERENCES fruits(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES health_benefits(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(fruit_id, benefit_id)
);

-- User favorites table
CREATE TABLE user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  fruit_id UUID REFERENCES fruits(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, fruit_id)
);

-- Indexes for performance
CREATE INDEX idx_fruits_availability ON fruits(is_available) WHERE is_available = true;
CREATE INDEX idx_fruits_name_search ON fruits USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_fruits_price ON fruits(price);
CREATE INDEX idx_fruit_categories_name ON fruit_categories(name);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_nutritional_calories ON fruit_nutritional_info(calories_per_100g);
CREATE INDEX idx_nutritional_vitamin_c ON fruit_nutritional_info(vitamin_c_mg);

-- Row Level Security
ALTER TABLE fruits ENABLE ROW LEVEL SECURITY;
ALTER TABLE fruit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fruit_nutritional_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE fruit_health_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Public read access for fruit data (no authentication required for browsing)
CREATE POLICY "Anyone can view fruits" ON fruits FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Anyone can view categories" ON fruit_categories FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Anyone can view nutritional info" ON fruit_nutritional_info FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Anyone can view health benefits" ON health_benefits FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Anyone can view fruit health benefits" ON fruit_health_benefits FOR SELECT TO PUBLIC USING (true);

-- User favorites require authentication
CREATE POLICY "Users can view their own favorites" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON user_favorites FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger for fruits table
CREATE TRIGGER fruits_updated_at
  BEFORE UPDATE ON fruits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample categories
INSERT INTO fruit_categories (name, description) VALUES
('Citrus', 'Citrus fruits high in Vitamin C'),
('Berries', 'Small, sweet fruits rich in antioxidants'),
('Tropical', 'Exotic fruits from tropical climates'),
('Stone Fruits', 'Fruits with a hard pit or stone'),
('Melons', 'Large, juicy fruits with high water content'),
('Apples & Pears', 'Tree fruits with crisp texture');

-- Insert sample health benefits
INSERT INTO health_benefits (name, description) VALUES
('High Vitamin C', 'Supports immune system and collagen production'),
('High Fiber', 'Promotes digestive health and satiety'),
('Antioxidant Rich', 'Helps fight free radicals and inflammation'),
('Heart Healthy', 'Supports cardiovascular health'),
('Low Calorie', 'Great for weight management'),
('High Potassium', 'Supports heart and muscle function');

-- Insert sample fruits
INSERT INTO fruits (name, description, short_description, price, unit, image_url, is_available, is_seasonal, seasonal_months, storage_tips, origin_country) VALUES
('Organic Apples', 'Crisp and sweet organic apples, perfect for snacking or baking. Rich in fiber and vitamin C.', 'Crisp, sweet organic apples', 3.99, 'lb', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400', true, true, ARRAY['September', 'October', 'November'], 'Store in refrigerator for up to 2 weeks', 'USA'),
('Fresh Bananas', 'Naturally sweet bananas packed with potassium and energy. Great for smoothies and quick snacks.', 'Sweet, potassium-rich bananas', 2.49, 'lb', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', true, false, NULL, 'Store at room temperature, refrigerate when ripe', 'Ecuador'),
('Navel Oranges', 'Juicy navel oranges bursting with vitamin C. Perfect for fresh juice or eating fresh.', 'Juicy, vitamin C rich oranges', 4.99, 'lb', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400', true, true, ARRAY['December', 'January', 'February', 'March'], 'Store at room temperature for 1 week or refrigerate for longer', 'California'),
('Organic Strawberries', 'Sweet and juicy organic strawberries loaded with antioxidants and vitamin C.', 'Sweet, antioxidant-rich strawberries', 5.99, 'lb', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400', true, true, ARRAY['April', 'May', 'June'], 'Refrigerate and consume within 3-5 days', 'California'),
('Ripe Avocados', 'Creamy ripe avocados rich in healthy fats and fiber. Perfect for toast, salads, or guacamole.', 'Creamy, healthy fat-rich avocados', 2.99, 'each', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400', true, false, NULL, 'Store at room temperature until ripe, then refrigerate', 'Mexico'),
('Fresh Blueberries', 'Plump, sweet blueberries packed with antioxidants and natural sweetness.', 'Sweet, antioxidant-packed blueberries', 6.99, 'lb', 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400', true, true, ARRAY['June', 'July', 'August'], 'Refrigerate and consume within 1 week', 'USA'),
('Tropical Mango', 'Sweet and tropical mangoes rich in vitamin A and fiber. Perfect for smoothies or eating fresh.', 'Sweet, tropical vitamin A-rich mangoes', 3.49, 'each', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', true, true, ARRAY['March', 'April', 'May', 'June'], 'Store at room temperature until ripe, then refrigerate', 'Mexico'),
('Red Grapes', 'Sweet and juicy red grapes perfect for snacking. Rich in antioxidants and natural sugars.', 'Sweet, juicy antioxidant-rich grapes', 4.49, 'lb', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400', true, false, NULL, 'Refrigerate and consume within 1 week', 'California');

-- Insert nutritional information for sample fruits
INSERT INTO fruit_nutritional_info (fruit_id, calories_per_100g, protein_g, carbs_g, fiber_g, sugar_g, fat_g, vitamin_c_mg, vitamin_a_iu, potassium_mg, calcium_mg, iron_mg) 
SELECT 
  f.id,
  CASE f.name
    WHEN 'Organic Apples' THEN 52
    WHEN 'Fresh Bananas' THEN 89
    WHEN 'Navel Oranges' THEN 47
    WHEN 'Organic Strawberries' THEN 32
    WHEN 'Ripe Avocados' THEN 160
    WHEN 'Fresh Blueberries' THEN 57
    WHEN 'Tropical Mango' THEN 60
    WHEN 'Red Grapes' THEN 62
  END as calories_per_100g,
  CASE f.name
    WHEN 'Organic Apples' THEN 0.3
    WHEN 'Fresh Bananas' THEN 1.1
    WHEN 'Navel Oranges' THEN 0.9
    WHEN 'Organic Strawberries' THEN 0.7
    WHEN 'Ripe Avocados' THEN 2.0
    WHEN 'Fresh Blueberries' THEN 0.7
    WHEN 'Tropical Mango' THEN 0.8
    WHEN 'Red Grapes' THEN 0.6
  END as protein_g,
  CASE f.name
    WHEN 'Organic Apples' THEN 14.0
    WHEN 'Fresh Bananas' THEN 23.0
    WHEN 'Navel Oranges' THEN 12.0
    WHEN 'Organic Strawberries' THEN 7.7
    WHEN 'Ripe Avocados' THEN 9.0
    WHEN 'Fresh Blueberries' THEN 14.0
    WHEN 'Tropical Mango' THEN 15.0
    WHEN 'Red Grapes' THEN 16.0
  END as carbs_g,
  CASE f.name
    WHEN 'Organic Apples' THEN 2.4
    WHEN 'Fresh Bananas' THEN 2.6
    WHEN 'Navel Oranges' THEN 2.4
    WHEN 'Organic Strawberries' THEN 2.0
    WHEN 'Ripe Avocados' THEN 7.0
    WHEN 'Fresh Blueberries' THEN 2.4
    WHEN 'Tropical Mango' THEN 1.6
    WHEN 'Red Grapes' THEN 0.9
  END as fiber_g,
  CASE f.name
    WHEN 'Organic Apples' THEN 10.0
    WHEN 'Fresh Bananas' THEN 12.0
    WHEN 'Navel Oranges' THEN 9.0
    WHEN 'Organic Strawberries' THEN 4.9
    WHEN 'Ripe Avocados' THEN 0.7
    WHEN 'Fresh Blueberries' THEN 10.0
    WHEN 'Tropical Mango' THEN 14.0
    WHEN 'Red Grapes' THEN 16.0
  END as sugar_g,
  CASE f.name
    WHEN 'Organic Apples' THEN 0.2
    WHEN 'Fresh Bananas' THEN 0.3
    WHEN 'Navel Oranges' THEN 0.1
    WHEN 'Organic Strawberries' THEN 0.3
    WHEN 'Ripe Avocados' THEN 15.0
    WHEN 'Fresh Blueberries' THEN 0.3
    WHEN 'Tropical Mango' THEN 0.4
    WHEN 'Red Grapes' THEN 0.2
  END as fat_g,
  CASE f.name
    WHEN 'Organic Apples' THEN 4.6
    WHEN 'Fresh Bananas' THEN 8.7
    WHEN 'Navel Oranges' THEN 53.0
    WHEN 'Organic Strawberries' THEN 59.0
    WHEN 'Ripe Avocados' THEN 10.0
    WHEN 'Fresh Blueberries' THEN 9.7
    WHEN 'Tropical Mango' THEN 36.0
    WHEN 'Red Grapes' THEN 3.2
  END as vitamin_c_mg,
  CASE f.name
    WHEN 'Organic Apples' THEN 54
    WHEN 'Fresh Bananas' THEN 64
    WHEN 'Navel Oranges' THEN 225
    WHEN 'Organic Strawberries' THEN 12
    WHEN 'Ripe Avocados' THEN 146
    WHEN 'Fresh Blueberries' THEN 54
    WHEN 'Tropical Mango' THEN 1082
    WHEN 'Red Grapes' THEN 66
  END as vitamin_a_iu,
  CASE f.name
    WHEN 'Organic Apples' THEN 107.0
    WHEN 'Fresh Bananas' THEN 358.0
    WHEN 'Navel Oranges' THEN 181.0
    WHEN 'Organic Strawberries' THEN 153.0
    WHEN 'Ripe Avocados' THEN 485.0
    WHEN 'Fresh Blueberries' THEN 77.0
    WHEN 'Tropical Mango' THEN 168.0
    WHEN 'Red Grapes' THEN 191.0
  END as potassium_mg,
  CASE f.name
    WHEN 'Organic Apples' THEN 6.0
    WHEN 'Fresh Bananas' THEN 5.0
    WHEN 'Navel Oranges' THEN 40.0
    WHEN 'Organic Strawberries' THEN 16.0
    WHEN 'Ripe Avocados' THEN 12.0
    WHEN 'Fresh Blueberries' THEN 6.0
    WHEN 'Tropical Mango' THEN 11.0
    WHEN 'Red Grapes' THEN 10.0
  END as calcium_mg,
  CASE f.name
    WHEN 'Organic Apples' THEN 0.1
    WHEN 'Fresh Bananas' THEN 0.3
    WHEN 'Navel Oranges' THEN 0.1
    WHEN 'Organic Strawberries' THEN 0.4
    WHEN 'Ripe Avocados' THEN 0.6
    WHEN 'Fresh Blueberries' THEN 0.3
    WHEN 'Tropical Mango' THEN 0.2
    WHEN 'Red Grapes' THEN 0.4
  END as iron_mg
FROM fruits f
WHERE f.name IN ('Organic Apples', 'Fresh Bananas', 'Navel Oranges', 'Organic Strawberries', 'Ripe Avocados', 'Fresh Blueberries', 'Tropical Mango', 'Red Grapes');

-- Insert fruit category mappings
INSERT INTO fruit_category_mappings (fruit_id, category_id)
SELECT f.id, c.id
FROM fruits f, fruit_categories c
WHERE 
  (f.name = 'Organic Apples' AND c.name = 'Apples & Pears') OR
  (f.name = 'Fresh Bananas' AND c.name = 'Tropical') OR
  (f.name = 'Navel Oranges' AND c.name = 'Citrus') OR
  (f.name = 'Organic Strawberries' AND c.name = 'Berries') OR
  (f.name = 'Ripe Avocados' AND c.name = 'Tropical') OR
  (f.name = 'Fresh Blueberries' AND c.name = 'Berries') OR
  (f.name = 'Tropical Mango' AND c.name = 'Tropical') OR
  (f.name = 'Red Grapes' AND c.name = 'Berries');

-- Insert fruit health benefit mappings
INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id
FROM fruits f, health_benefits b
WHERE 
  (f.name = 'Organic Apples' AND b.name IN ('High Fiber', 'Heart Healthy', 'Low Calorie')) OR
  (f.name = 'Fresh Bananas' AND b.name IN ('High Potassium', 'Heart Healthy')) OR
  (f.name = 'Navel Oranges' AND b.name IN ('High Vitamin C', 'High Fiber', 'Heart Healthy')) OR
  (f.name = 'Organic Strawberries' AND b.name IN ('High Vitamin C', 'Antioxidant Rich', 'Low Calorie')) OR
  (f.name = 'Ripe Avocados' AND b.name IN ('Heart Healthy', 'High Fiber', 'High Potassium')) OR
  (f.name = 'Fresh Blueberries' AND b.name IN ('Antioxidant Rich', 'High Vitamin C', 'Low Calorie')) OR
  (f.name = 'Tropical Mango' AND b.name IN ('High Vitamin C', 'Antioxidant Rich')) OR
  (f.name = 'Red Grapes' AND b.name IN ('Antioxidant Rich', 'Heart Healthy', 'High Potassium'));

-- Wallet System Schema
-- User wallets table
CREATE TABLE wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  currency TEXT DEFAULT 'USD' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Transaction types enum
CREATE TYPE transaction_type AS ENUM ('top_up', 'payment', 'refund', 'adjustment');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Wallet transactions table (immutable audit log)
CREATE TABLE wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount != 0),
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  status transaction_status DEFAULT 'pending' NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  razorpay_payment_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  CHECK (
    (type IN ('top_up', 'refund') AND amount > 0 AND balance_after = balance_before + amount) OR
    (type IN ('payment', 'adjustment') AND amount < 0 AND balance_after = balance_before + amount)
  )
);

-- Payment methods table (for stored cards)
CREATE TABLE payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  razorpay_payment_method_id TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'card' NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;

-- Row Level Security
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Wallet policies
CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own wallet" ON wallets FOR UPDATE USING (auth.uid() = user_id);

-- Transaction policies  
CREATE POLICY "Users can view their own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- Payment method policies
CREATE POLICY "Users can view their own payment methods" ON payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payment methods" ON payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payment methods" ON payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payment methods" ON payment_methods FOR DELETE USING (auth.uid() = user_id);

-- Function to create wallet on user registration
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (NEW.id, 0.00, 'USD');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet when profile is created
CREATE TRIGGER create_wallet_on_profile
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

-- Function to safely update wallet balance (atomic transaction)
CREATE OR REPLACE FUNCTION update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_type transaction_type,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_razorpay_payment_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_wallet_id UUID;
  v_balance_before DECIMAL(10,2);
  v_balance_after DECIMAL(10,2);
  v_transaction_id UUID;
BEGIN
  -- Get current wallet info and lock row
  SELECT id, balance INTO v_wallet_id, v_balance_before
  FROM wallets 
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;
  
  -- Calculate new balance
  v_balance_after := v_balance_before + p_amount;
  
  -- Check for negative balance (except for adjustments)
  IF v_balance_after < 0 AND p_type != 'adjustment' THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Attempted: %', v_balance_before, p_amount;
  END IF;
  
  -- Update wallet balance
  UPDATE wallets 
  SET balance = v_balance_after, updated_at = TIMEZONE('utc'::text, now())
  WHERE id = v_wallet_id;
  
  -- Insert transaction record
  INSERT INTO wallet_transactions (
    wallet_id, user_id, type, amount, balance_before, balance_after,
    status, description, reference_id, razorpay_payment_id, metadata
  ) VALUES (
    v_wallet_id, p_user_id, p_type, p_amount, v_balance_before, v_balance_after,
    'completed', p_description, p_reference_id, p_razorpay_payment_id, p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at triggers for wallet tables
CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to get wallet balance safely
CREATE OR REPLACE FUNCTION get_wallet_balance(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_balance DECIMAL(10,2);
BEGIN
  SELECT balance INTO v_balance
  FROM wallets
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_balance, 0.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;