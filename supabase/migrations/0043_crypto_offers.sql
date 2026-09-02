-- DreCrypto: Crypto Offers Table
-- Stores offers submitted through the DreCrypto platform

CREATE TABLE IF NOT EXISTS crypto_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id text NOT NULL,
  property_name text,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text,
  offer_amount_aed numeric,
  offer_amount_crypto numeric,
  crypto_type text DEFAULT 'BTC', -- BTC, ETH, USDT
  wallet_address text,
  wallet_verified boolean DEFAULT false,
  message text,
  status text DEFAULT 'pending', -- pending, contacted, negotiating, accepted, rejected
  notes text, -- internal notes
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_crypto_offers_status ON crypto_offers(status);
CREATE INDEX IF NOT EXISTS idx_crypto_offers_created_at ON crypto_offers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_offers_email ON crypto_offers(buyer_email);

-- RLS policies
ALTER TABLE crypto_offers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all offers (for admin dashboard)
CREATE POLICY "Authenticated users can view crypto offers"
  ON crypto_offers FOR SELECT
  TO authenticated
  USING (true);

-- Allow public to insert offers (from the public website)
CREATE POLICY "Anyone can submit crypto offers"
  ON crypto_offers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can update offers
CREATE POLICY "Authenticated users can update crypto offers"
  ON crypto_offers FOR UPDATE
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_crypto_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crypto_offers_updated_at
  BEFORE UPDATE ON crypto_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_crypto_offers_updated_at();

COMMENT ON TABLE crypto_offers IS 'Stores cryptocurrency property offer submissions from DreCrypto website';
