-- Create razorpay_orders table
CREATE TABLE IF NOT EXISTS razorpay_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  receipt TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'created',
  payment_id TEXT,
  signature TEXT,
  razorpay_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create razorpay_payments table
CREATE TABLE IF NOT EXISTS razorpay_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'created',
  signature TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_razorpay_orders_user_id ON razorpay_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_orders_order_id ON razorpay_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_orders_status ON razorpay_orders(status);
CREATE INDEX IF NOT EXISTS idx_razorpay_orders_created_at ON razorpay_orders(created_at);

CREATE INDEX IF NOT EXISTS idx_razorpay_payments_user_id ON razorpay_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_payment_id ON razorpay_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_order_id ON razorpay_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_status ON razorpay_payments(status);
CREATE INDEX IF NOT EXISTS idx_razorpay_payments_created_at ON razorpay_payments(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE razorpay_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE razorpay_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for razorpay_orders
CREATE POLICY "Users can view their own orders" ON razorpay_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON razorpay_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON razorpay_orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for razorpay_payments
CREATE POLICY "Users can view their own payments" ON razorpay_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON razorpay_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON razorpay_payments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for razorpay_payments updated_at
CREATE TRIGGER update_razorpay_payments_updated_at
  BEFORE UPDATE ON razorpay_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();