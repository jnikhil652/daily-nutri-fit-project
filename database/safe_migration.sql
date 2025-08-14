-- Safe Migration Script for Existing Database
-- This script safely inserts data without conflicts

-- Insert sample categories only if they don't exist
INSERT INTO fruit_categories (name, description) 
SELECT 'Citrus', 'Citrus fruits high in Vitamin C'
WHERE NOT EXISTS (SELECT 1 FROM fruit_categories WHERE name = 'Citrus');

INSERT INTO fruit_categories (name, description) 
SELECT 'Berries', 'Small, sweet fruits rich in antioxidants'
WHERE NOT EXISTS (SELECT 1 FROM fruit_categories WHERE name = 'Berries');

INSERT INTO fruit_categories (name, description) 
SELECT 'Tropical', 'Exotic fruits from tropical climates'
WHERE NOT EXISTS (SELECT 1 FROM fruit_categories WHERE name = 'Tropical');

INSERT INTO fruit_categories (name, description) 
SELECT 'Stone Fruits', 'Fruits with a hard pit or stone'
WHERE NOT EXISTS (SELECT 1 FROM fruit_categories WHERE name = 'Stone Fruits');

INSERT INTO fruit_categories (name, description) 
SELECT 'Melons', 'Large, juicy fruits with high water content'
WHERE NOT EXISTS (SELECT 1 FROM fruit_categories WHERE name = 'Melons');

INSERT INTO fruit_categories (name, description) 
SELECT 'Apples & Pears', 'Tree fruits with crisp texture'
WHERE NOT EXISTS (SELECT 1 FROM fruit_categories WHERE name = 'Apples & Pears');

-- Insert sample health benefits only if they don't exist
INSERT INTO health_benefits (name, description) 
SELECT 'High Vitamin C', 'Supports immune system and collagen production'
WHERE NOT EXISTS (SELECT 1 FROM health_benefits WHERE name = 'High Vitamin C');

INSERT INTO health_benefits (name, description) 
SELECT 'High Fiber', 'Promotes digestive health and satiety'
WHERE NOT EXISTS (SELECT 1 FROM health_benefits WHERE name = 'High Fiber');

INSERT INTO health_benefits (name, description) 
SELECT 'Antioxidant Rich', 'Helps fight free radicals and inflammation'
WHERE NOT EXISTS (SELECT 1 FROM health_benefits WHERE name = 'Antioxidant Rich');

INSERT INTO health_benefits (name, description) 
SELECT 'Heart Healthy', 'Supports cardiovascular health'
WHERE NOT EXISTS (SELECT 1 FROM health_benefits WHERE name = 'Heart Healthy');

INSERT INTO health_benefits (name, description) 
SELECT 'Low Calorie', 'Great for weight management'
WHERE NOT EXISTS (SELECT 1 FROM health_benefits WHERE name = 'Low Calorie');

INSERT INTO health_benefits (name, description) 
SELECT 'High Potassium', 'Supports heart and muscle function'
WHERE NOT EXISTS (SELECT 1 FROM health_benefits WHERE name = 'High Potassium');

-- Insert sample fruits only if they don't exist
INSERT INTO fruits (name, description, short_description, price, unit, image_url, is_available, is_seasonal, seasonal_months, storage_tips, origin_country)
SELECT 'Organic Apples', 'Crisp and sweet organic apples, perfect for snacking or baking. Rich in fiber and vitamin C.', 'Crisp, sweet organic apples', 3.99, 'lb', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400', true, true, ARRAY['September', 'October', 'November'], 'Store in refrigerator for up to 2 weeks', 'USA'
WHERE NOT EXISTS (SELECT 1 FROM fruits WHERE name = 'Organic Apples');

INSERT INTO fruits (name, description, short_description, price, unit, image_url, is_available, is_seasonal, seasonal_months, storage_tips, origin_country)
SELECT 'Fresh Bananas', 'Naturally sweet bananas packed with potassium and energy. Great for smoothies and quick snacks.', 'Sweet, potassium-rich bananas', 2.49, 'lb', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', true, false, NULL, 'Store at room temperature, refrigerate when ripe', 'Ecuador'
WHERE NOT EXISTS (SELECT 1 FROM fruits WHERE name = 'Fresh Bananas');

INSERT INTO fruits (name, description, short_description, price, unit, image_url, is_available, is_seasonal, seasonal_months, storage_tips, origin_country)
SELECT 'Navel Oranges', 'Juicy navel oranges bursting with vitamin C. Perfect for fresh juice or eating fresh.', 'Juicy, vitamin C rich oranges', 4.99, 'lb', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400', true, true, ARRAY['December', 'January', 'February', 'March'], 'Store at room temperature for 1 week or refrigerate for longer', 'California'
WHERE NOT EXISTS (SELECT 1 FROM fruits WHERE name = 'Navel Oranges');

INSERT INTO fruits (name, description, short_description, price, unit, image_url, is_available, is_seasonal, seasonal_months, storage_tips, origin_country)
SELECT 'Organic Strawberries', 'Sweet and juicy organic strawberries loaded with antioxidants and vitamin C.', 'Sweet, antioxidant-rich strawberries', 5.99, 'lb', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400', true, true, ARRAY['April', 'May', 'June'], 'Refrigerate and consume within 3-5 days', 'California'
WHERE NOT EXISTS (SELECT 1 FROM fruits WHERE name = 'Organic Strawberries');

INSERT INTO fruits (name, description, short_description, price, unit, image_url, is_available, is_seasonal, seasonal_months, storage_tips, origin_country)
SELECT 'Ripe Avocados', 'Creamy ripe avocados rich in healthy fats and fiber. Perfect for toast, salads, or guacamole.', 'Creamy, healthy fat-rich avocados', 2.99, 'each', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400', true, false, NULL, 'Store at room temperature until ripe, then refrigerate', 'Mexico'
WHERE NOT EXISTS (SELECT 1 FROM fruits WHERE name = 'Ripe Avocados');

INSERT INTO fruits (name, description, short_description, price, unit, image_url, is_available, is_seasonal, seasonal_months, storage_tips, origin_country)
SELECT 'Fresh Blueberries', 'Plump, sweet blueberries packed with antioxidants and natural sweetness.', 'Sweet, antioxidant-packed blueberries', 6.99, 'lb', 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400', true, true, ARRAY['June', 'July', 'August'], 'Refrigerate and consume within 1 week', 'USA'
WHERE NOT EXISTS (SELECT 1 FROM fruits WHERE name = 'Fresh Blueberries');

INSERT INTO fruits (name, description, short_description, price, unit, image_url, is_available, is_seasonal, seasonal_months, storage_tips, origin_country)
SELECT 'Tropical Mango', 'Sweet and tropical mangoes rich in vitamin A and fiber. Perfect for smoothies or eating fresh.', 'Sweet, tropical vitamin A-rich mangoes', 3.49, 'each', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', true, true, ARRAY['March', 'April', 'May', 'June'], 'Store at room temperature until ripe, then refrigerate', 'Mexico'
WHERE NOT EXISTS (SELECT 1 FROM fruits WHERE name = 'Tropical Mango');

INSERT INTO fruits (name, description, short_description, price, unit, image_url, is_available, is_seasonal, seasonal_months, storage_tips, origin_country)
SELECT 'Red Grapes', 'Sweet and juicy red grapes perfect for snacking. Rich in antioxidants and natural sugars.', 'Sweet, juicy antioxidant-rich grapes', 4.49, 'lb', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400', true, false, NULL, 'Refrigerate and consume within 1 week', 'California'
WHERE NOT EXISTS (SELECT 1 FROM fruits WHERE name = 'Red Grapes');

-- Insert nutritional information for fruits that don't have it
INSERT INTO fruit_nutritional_info (fruit_id, calories_per_100g, protein_g, carbs_g, fiber_g, sugar_g, fat_g, vitamin_c_mg, vitamin_a_iu, potassium_mg, calcium_mg, iron_mg) 
SELECT 
  f.id, 52, 0.3, 14.0, 2.4, 10.0, 0.2, 4.6, 54, 107.0, 6.0, 0.1
FROM fruits f
WHERE f.name = 'Organic Apples'
AND NOT EXISTS (SELECT 1 FROM fruit_nutritional_info WHERE fruit_id = f.id);

INSERT INTO fruit_nutritional_info (fruit_id, calories_per_100g, protein_g, carbs_g, fiber_g, sugar_g, fat_g, vitamin_c_mg, vitamin_a_iu, potassium_mg, calcium_mg, iron_mg) 
SELECT 
  f.id, 89, 1.1, 23.0, 2.6, 12.0, 0.3, 8.7, 64, 358.0, 5.0, 0.3
FROM fruits f
WHERE f.name = 'Fresh Bananas'
AND NOT EXISTS (SELECT 1 FROM fruit_nutritional_info WHERE fruit_id = f.id);

INSERT INTO fruit_nutritional_info (fruit_id, calories_per_100g, protein_g, carbs_g, fiber_g, sugar_g, fat_g, vitamin_c_mg, vitamin_a_iu, potassium_mg, calcium_mg, iron_mg) 
SELECT 
  f.id, 47, 0.9, 12.0, 2.4, 9.0, 0.1, 53.0, 225, 181.0, 40.0, 0.1
FROM fruits f
WHERE f.name = 'Navel Oranges'
AND NOT EXISTS (SELECT 1 FROM fruit_nutritional_info WHERE fruit_id = f.id);

INSERT INTO fruit_nutritional_info (fruit_id, calories_per_100g, protein_g, carbs_g, fiber_g, sugar_g, fat_g, vitamin_c_mg, vitamin_a_iu, potassium_mg, calcium_mg, iron_mg) 
SELECT 
  f.id, 32, 0.7, 7.7, 2.0, 4.9, 0.3, 59.0, 12, 153.0, 16.0, 0.4
FROM fruits f
WHERE f.name = 'Organic Strawberries'
AND NOT EXISTS (SELECT 1 FROM fruit_nutritional_info WHERE fruit_id = f.id);

INSERT INTO fruit_nutritional_info (fruit_id, calories_per_100g, protein_g, carbs_g, fiber_g, sugar_g, fat_g, vitamin_c_mg, vitamin_a_iu, potassium_mg, calcium_mg, iron_mg) 
SELECT 
  f.id, 160, 2.0, 9.0, 7.0, 0.7, 15.0, 10.0, 146, 485.0, 12.0, 0.6
FROM fruits f
WHERE f.name = 'Ripe Avocados'
AND NOT EXISTS (SELECT 1 FROM fruit_nutritional_info WHERE fruit_id = f.id);

INSERT INTO fruit_nutritional_info (fruit_id, calories_per_100g, protein_g, carbs_g, fiber_g, sugar_g, fat_g, vitamin_c_mg, vitamin_a_iu, potassium_mg, calcium_mg, iron_mg) 
SELECT 
  f.id, 57, 0.7, 14.0, 2.4, 10.0, 0.3, 9.7, 54, 77.0, 6.0, 0.3
FROM fruits f
WHERE f.name = 'Fresh Blueberries'
AND NOT EXISTS (SELECT 1 FROM fruit_nutritional_info WHERE fruit_id = f.id);

INSERT INTO fruit_nutritional_info (fruit_id, calories_per_100g, protein_g, carbs_g, fiber_g, sugar_g, fat_g, vitamin_c_mg, vitamin_a_iu, potassium_mg, calcium_mg, iron_mg) 
SELECT 
  f.id, 60, 0.8, 15.0, 1.6, 14.0, 0.4, 36.0, 1082, 168.0, 11.0, 0.2
FROM fruits f
WHERE f.name = 'Tropical Mango'
AND NOT EXISTS (SELECT 1 FROM fruit_nutritional_info WHERE fruit_id = f.id);

INSERT INTO fruit_nutritional_info (fruit_id, calories_per_100g, protein_g, carbs_g, fiber_g, sugar_g, fat_g, vitamin_c_mg, vitamin_a_iu, potassium_mg, calcium_mg, iron_mg) 
SELECT 
  f.id, 62, 0.6, 16.0, 0.9, 16.0, 0.2, 3.2, 66, 191.0, 10.0, 0.4
FROM fruits f
WHERE f.name = 'Red Grapes'
AND NOT EXISTS (SELECT 1 FROM fruit_nutritional_info WHERE fruit_id = f.id);

-- Insert fruit category mappings safely
INSERT INTO fruit_category_mappings (fruit_id, category_id)
SELECT f.id, c.id
FROM fruits f, fruit_categories c
WHERE f.name = 'Organic Apples' AND c.name = 'Apples & Pears'
AND NOT EXISTS (SELECT 1 FROM fruit_category_mappings WHERE fruit_id = f.id AND category_id = c.id);

INSERT INTO fruit_category_mappings (fruit_id, category_id)
SELECT f.id, c.id
FROM fruits f, fruit_categories c
WHERE f.name = 'Fresh Bananas' AND c.name = 'Tropical'
AND NOT EXISTS (SELECT 1 FROM fruit_category_mappings WHERE fruit_id = f.id AND category_id = c.id);

INSERT INTO fruit_category_mappings (fruit_id, category_id)
SELECT f.id, c.id
FROM fruits f, fruit_categories c
WHERE f.name = 'Navel Oranges' AND c.name = 'Citrus'
AND NOT EXISTS (SELECT 1 FROM fruit_category_mappings WHERE fruit_id = f.id AND category_id = c.id);

INSERT INTO fruit_category_mappings (fruit_id, category_id)
SELECT f.id, c.id
FROM fruits f, fruit_categories c
WHERE f.name = 'Organic Strawberries' AND c.name = 'Berries'
AND NOT EXISTS (SELECT 1 FROM fruit_category_mappings WHERE fruit_id = f.id AND category_id = c.id);

INSERT INTO fruit_category_mappings (fruit_id, category_id)
SELECT f.id, c.id
FROM fruits f, fruit_categories c
WHERE f.name = 'Ripe Avocados' AND c.name = 'Tropical'
AND NOT EXISTS (SELECT 1 FROM fruit_category_mappings WHERE fruit_id = f.id AND category_id = c.id);

INSERT INTO fruit_category_mappings (fruit_id, category_id)
SELECT f.id, c.id
FROM fruits f, fruit_categories c
WHERE f.name = 'Fresh Blueberries' AND c.name = 'Berries'
AND NOT EXISTS (SELECT 1 FROM fruit_category_mappings WHERE fruit_id = f.id AND category_id = c.id);

INSERT INTO fruit_category_mappings (fruit_id, category_id)
SELECT f.id, c.id
FROM fruits f, fruit_categories c
WHERE f.name = 'Tropical Mango' AND c.name = 'Tropical'
AND NOT EXISTS (SELECT 1 FROM fruit_category_mappings WHERE fruit_id = f.id AND category_id = c.id);

INSERT INTO fruit_category_mappings (fruit_id, category_id)
SELECT f.id, c.id
FROM fruits f, fruit_categories c
WHERE f.name = 'Red Grapes' AND c.name = 'Berries'
AND NOT EXISTS (SELECT 1 FROM fruit_category_mappings WHERE fruit_id = f.id AND category_id = c.id);

-- Insert fruit health benefit mappings safely
-- Organic Apples
INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Organic Apples' AND b.name = 'High Fiber'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Organic Apples' AND b.name = 'Heart Healthy'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Organic Apples' AND b.name = 'Low Calorie'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

-- Fresh Bananas
INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Fresh Bananas' AND b.name = 'High Potassium'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Fresh Bananas' AND b.name = 'Heart Healthy'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

-- Navel Oranges
INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Navel Oranges' AND b.name = 'High Vitamin C'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Navel Oranges' AND b.name = 'High Fiber'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Navel Oranges' AND b.name = 'Heart Healthy'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

-- Organic Strawberries
INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Organic Strawberries' AND b.name = 'High Vitamin C'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Organic Strawberries' AND b.name = 'Antioxidant Rich'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Organic Strawberries' AND b.name = 'Low Calorie'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

-- Ripe Avocados
INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Ripe Avocados' AND b.name = 'Heart Healthy'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Ripe Avocados' AND b.name = 'High Fiber'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Ripe Avocados' AND b.name = 'High Potassium'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

-- Fresh Blueberries
INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Fresh Blueberries' AND b.name = 'Antioxidant Rich'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Fresh Blueberries' AND b.name = 'High Vitamin C'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Fresh Blueberries' AND b.name = 'Low Calorie'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

-- Tropical Mango
INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Tropical Mango' AND b.name = 'High Vitamin C'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Tropical Mango' AND b.name = 'Antioxidant Rich'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

-- Red Grapes
INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Red Grapes' AND b.name = 'Antioxidant Rich'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Red Grapes' AND b.name = 'Heart Healthy'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);

INSERT INTO fruit_health_benefits (fruit_id, benefit_id)
SELECT f.id, b.id FROM fruits f, health_benefits b
WHERE f.name = 'Red Grapes' AND b.name = 'High Potassium'
AND NOT EXISTS (SELECT 1 FROM fruit_health_benefits WHERE fruit_id = f.id AND benefit_id = b.id);