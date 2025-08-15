# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-14-wallet-system/spec.md

> Created: 2025-08-14
> Version: 1.0.0

## Schema Changes

### New Tables

**wallets** - User wallet balance and metadata
**wallet_transactions** - Immutable transaction history
**payment_methods** - Stored payment method information (encrypted)

## Database Schema

```sql
-- User wallets table
CREATE TABLE wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  currency TEXT DEFAULT 'INR' NOT NULL,
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
  reference_id TEXT, -- Order ID, Razorpay Payment ID, etc.
  razorpay_payment_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure balance calculations are correct
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
  card_brand TEXT, -- visa, mastercard, etc.
  card_last4 TEXT, -- last 4 digits
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
-- Note: Transactions are insert-only via functions to maintain audit integrity

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
  VALUES (NEW.id, 0.00, 'INR');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet when profile is created
CREATE TRIGGER create_wallet_on_profile
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE PROCEDURE create_user_wallet();

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

-- Updated_at triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

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
```

## Rationale

**Immutable Transactions:** Transaction records are never updated after creation, maintaining a complete audit trail for financial compliance.

**Atomic Balance Updates:** The `update_wallet_balance` function ensures wallet balance and transaction history are always consistent using database-level locks.

**Decimal Precision:** Using DECIMAL(10,2) for currency to avoid floating-point precision issues with financial calculations.

**Security:** Row Level Security ensures users can only access their own wallet data, with server-side functions for balance updates.

**Performance:** Strategic indexes on frequently queried fields like user_id, transaction type, and creation date for fast wallet operations.