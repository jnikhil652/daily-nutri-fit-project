-- Basic Ordering System Schema Migration
-- Adds shopping cart, orders, order items, and delivery time slots

-- Shopping cart table for cart persistence
CREATE TABLE shopping_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  fruit_id UUID REFERENCES fruits(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  
  UNIQUE(user_id, fruit_id)
);

-- Order status enum
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled');

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE, -- Human-readable order number
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  delivery_address_id UUID REFERENCES delivery_addresses(id) ON DELETE RESTRICT NOT NULL,
  
  -- Delivery scheduling
  requested_delivery_date DATE NOT NULL,
  delivery_time_slot TEXT NOT NULL,
  
  -- Pricing breakdown
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (delivery_fee >= 0),
  tax_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (tax_amount >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  
  -- Payment and status
  payment_method TEXT DEFAULT 'wallet' NOT NULL,
  wallet_transaction_id UUID REFERENCES wallet_transactions(id),
  status order_status DEFAULT 'pending' NOT NULL,
  
  -- Special instructions
  delivery_instructions TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Order items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  fruit_id UUID REFERENCES fruits(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit DECIMAL(10,2) NOT NULL CHECK (price_per_unit > 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price > 0),
  
  -- Snapshot fruit data at time of order
  fruit_name TEXT NOT NULL,
  fruit_description TEXT,
  fruit_image_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  
  -- Ensure total_price calculation is correct
  CHECK (total_price = quantity * price_per_unit)
);

-- Delivery time slots configuration
CREATE TABLE delivery_time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- e.g., "Morning (8AM - 12PM)"
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  max_orders_per_slot INTEGER DEFAULT 50 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  
  CHECK (end_time > start_time)
);

-- Indexes for performance
CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_date ON orders(requested_delivery_date);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_fruit_id ON order_items(fruit_id);
CREATE UNIQUE INDEX idx_orders_order_number ON orders(order_number);

-- Row Level Security
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_time_slots ENABLE ROW LEVEL SECURITY;

-- Shopping cart policies
CREATE POLICY "Users can manage their own cart" ON shopping_carts 
  USING (auth.uid() = user_id);

-- Order policies
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Order items policies (read-only after creation)
CREATE POLICY "Users can view order items for their orders" ON order_items FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM orders WHERE id = order_id));

-- Delivery time slots are publicly readable
CREATE POLICY "Anyone can view delivery time slots" ON delivery_time_slots FOR SELECT 
  TO PUBLIC USING (is_active = true);

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Generate order number with format: DN-YYYYMMDD-XXXX
  SELECT COALESCE(MAX(CAST(RIGHT(order_number, 4) AS INTEGER)), 0) + 1
  INTO counter
  FROM orders 
  WHERE order_number LIKE 'DN-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
  
  new_number := 'DN-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create order from cart
CREATE OR REPLACE FUNCTION create_order_from_cart(
  p_user_id UUID,
  p_delivery_address_id UUID,
  p_delivery_date DATE,
  p_delivery_time_slot TEXT,
  p_delivery_instructions TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal DECIMAL(10,2) := 0;
  v_delivery_fee DECIMAL(10,2) := 5.99; -- Fixed delivery fee for MVP
  v_tax_rate DECIMAL(5,4) := 0.0875; -- 8.75% tax rate
  v_tax_amount DECIMAL(10,2);
  v_total_amount DECIMAL(10,2);
  cart_item RECORD;
BEGIN
  -- Generate order number
  SELECT generate_order_number() INTO v_order_number;
  
  -- Calculate subtotal from cart
  SELECT SUM(quantity * price_per_unit) INTO v_subtotal
  FROM shopping_carts
  WHERE user_id = p_user_id;
  
  IF v_subtotal IS NULL OR v_subtotal = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;
  
  -- Calculate tax and total
  v_tax_amount := ROUND(v_subtotal * v_tax_rate, 2);
  v_total_amount := v_subtotal + v_delivery_fee + v_tax_amount;
  
  -- Create order
  INSERT INTO orders (
    order_number, user_id, delivery_address_id,
    requested_delivery_date, delivery_time_slot,
    subtotal, delivery_fee, tax_amount, total_amount,
    delivery_instructions
  ) VALUES (
    v_order_number, p_user_id, p_delivery_address_id,
    p_delivery_date, p_delivery_time_slot,
    v_subtotal, v_delivery_fee, v_tax_amount, v_total_amount,
    p_delivery_instructions
  ) RETURNING id INTO v_order_id;
  
  -- Copy cart items to order items
  FOR cart_item IN 
    SELECT sc.*, f.name, f.description, f.image_url
    FROM shopping_carts sc
    JOIN fruits f ON f.id = sc.fruit_id
    WHERE sc.user_id = p_user_id
  LOOP
    INSERT INTO order_items (
      order_id, fruit_id, quantity, price_per_unit, total_price,
      fruit_name, fruit_description, fruit_image_url
    ) VALUES (
      v_order_id, cart_item.fruit_id, cart_item.quantity, 
      cart_item.price_per_unit, cart_item.quantity * cart_item.price_per_unit,
      cart_item.name, cart_item.description, cart_item.image_url
    );
  END LOOP;
  
  -- Clear user's cart
  DELETE FROM shopping_carts WHERE user_id = p_user_id;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON shopping_carts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert default delivery time slots
INSERT INTO delivery_time_slots (name, start_time, end_time) VALUES
('Morning (8AM - 12PM)', '08:00:00', '12:00:00'),
('Afternoon (12PM - 5PM)', '12:00:00', '17:00:00'),
('Evening (5PM - 8PM)', '17:00:00', '20:00:00');