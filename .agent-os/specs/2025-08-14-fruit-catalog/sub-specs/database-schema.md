# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-14-fruit-catalog/spec.md

> Created: 2025-08-14
> Version: 1.0.0

## Schema Changes

### New Tables

**fruits** - Core fruit information and metadata
**fruit_categories** - Fruit category taxonomy
**fruit_nutritional_info** - Detailed nutritional information
**user_favorites** - User's favorite fruits

## Database Schema

```sql
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
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON fruits
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

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
```

## Rationale

**Normalized Structure:** Separate tables for categories, nutritional info, and health benefits allow for better data integrity and flexibility for future features.

**Many-to-Many Relationships:** Fruits can belong to multiple categories and have multiple health benefits, requiring junction tables.

**Full-Text Search:** PostgreSQL's built-in search capabilities with GIN indexes for efficient fruit name and description searching.

**Public Access:** Fruit catalog data is publicly readable to allow browsing without authentication, while favorites require user authentication.

**Performance Optimization:** Strategic indexes on commonly queried fields like availability, price, and nutritional values.