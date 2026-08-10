-- Mirdad Digital Storefront Schema
-- Tables for mechanical models, customers, and inquiries

-- Complexity level enum
CREATE TYPE mirdad_complexity AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Stock status enum
CREATE TYPE mirdad_stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'preorder');

-- Inquiry type enum
CREATE TYPE mirdad_inquiry_type AS ENUM ('purchase', 'custom_build', 'question', 'other');

-- Inquiry status enum
CREATE TYPE mirdad_inquiry_status AS ENUM ('new', 'contacted', 'converted', 'closed');

-- Models table
CREATE TABLE mirdad_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_fr TEXT, -- French title
  description TEXT,
  description_fr TEXT, -- French description
  short_description TEXT,
  short_description_fr TEXT, -- French short description
  price_aed DECIMAL(10, 2) NOT NULL,
  piece_count INTEGER NOT NULL,
  complexity_level mirdad_complexity NOT NULL DEFAULT 'intermediate',
  category TEXT NOT NULL,
  category_fr TEXT, -- French category
  image_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  instructions_url TEXT,
  parts_list JSONB DEFAULT '[]'::jsonb, -- [{set_id, set_name, quantity}]
  is_featured BOOLEAN DEFAULT false,
  stock_status mirdad_stock_status DEFAULT 'in_stock',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers table
CREATE TABLE mirdad_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  country TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inquiries table (lead capture)
CREATE TABLE mirdad_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES mirdad_customers(id) ON DELETE SET NULL,
  model_id UUID REFERENCES mirdad_models(id) ON DELETE SET NULL,
  message TEXT,
  inquiry_type mirdad_inquiry_type DEFAULT 'question',
  status mirdad_inquiry_status DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_mirdad_models_slug ON mirdad_models(slug);
CREATE INDEX idx_mirdad_models_featured ON mirdad_models(is_featured) WHERE is_featured = true;
CREATE INDEX idx_mirdad_models_category ON mirdad_models(category);
CREATE INDEX idx_mirdad_customers_email ON mirdad_customers(email);
CREATE INDEX idx_mirdad_inquiries_status ON mirdad_inquiries(status);
CREATE INDEX idx_mirdad_inquiries_created ON mirdad_inquiries(created_at DESC);

-- RLS Policies (public read for models, restricted write)
ALTER TABLE mirdad_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirdad_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirdad_inquiries ENABLE ROW LEVEL SECURITY;

-- Public can read models
CREATE POLICY "Public can view models"
  ON mirdad_models FOR SELECT
  USING (true);

-- Service role can manage all
CREATE POLICY "Service role manages models"
  ON mirdad_models FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages customers"
  ON mirdad_customers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages inquiries"
  ON mirdad_inquiries FOR ALL
  USING (auth.role() = 'service_role');

-- Allow inserts for lead capture (anon users can submit inquiries)
CREATE POLICY "Anyone can submit inquiry"
  ON mirdad_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can create customer record"
  ON mirdad_customers FOR INSERT
  WITH CHECK (true);

-- Seed sample data
INSERT INTO mirdad_models (slug, title, title_fr, description, description_fr, short_description, short_description_fr, price_aed, piece_count, complexity_level, category, category_fr, image_url, is_featured, stock_status, parts_list) VALUES
(
  'titan-mk-iv',
  'Titan Mk.IV',
  'Titan Mk.IV',
  'The Titan Mk.IV is our flagship bipedal combat mech, featuring articulated joints, modular weapon hardpoints, and a fully detailed cockpit interior. This advanced build challenges experienced builders with complex greebling techniques and structural engineering.',
  'Le Titan Mk.IV est notre mech de combat bipède phare, avec des articulations articulées, des points d''ancrage d''armes modulaires et un intérieur de cockpit entièrement détaillé. Cette construction avancée met au défi les constructeurs expérimentés avec des techniques de greebling complexes.',
  'Advanced bipedal combat mech with modular weapons',
  'Mech de combat bipède avancé avec armes modulaires',
  1299.00,
  2847,
  'expert',
  'Mechs',
  'Mechs',
  '/mirdad/images/titan-mk-iv.jpg',
  true,
  'in_stock',
  '[{"set_id": "42100", "set_name": "Liebherr R 9800", "quantity": 2}, {"set_id": "42131", "set_name": "Cat D11 Bulldozer", "quantity": 1}]'
),
(
  'desert-crawler',
  'Desert Crawler',
  'Rampant du Désert',
  'An all-terrain reconnaissance vehicle designed for harsh desert environments. Features working suspension, steering mechanism, and detailed engine bay. Perfect for intermediate builders looking to advance their skills.',
  'Un véhicule de reconnaissance tout-terrain conçu pour les environnements désertiques difficiles. Comprend une suspension fonctionnelle, un mécanisme de direction et un compartiment moteur détaillé.',
  'All-terrain recon vehicle with working suspension',
  'Véhicule de reconnaissance tout-terrain avec suspension fonctionnelle',
  649.00,
  1234,
  'intermediate',
  'Vehicles',
  'Véhicules',
  '/mirdad/images/desert-crawler.jpg',
  true,
  'in_stock',
  '[{"set_id": "42124", "set_name": "Off-Road Buggy", "quantity": 1}, {"set_id": "42139", "set_name": "All-Terrain Vehicle", "quantity": 1}]'
),
(
  'orbital-station-alpha',
  'Orbital Station Alpha',
  'Station Orbitale Alpha',
  'A massive space station build featuring rotating habitat rings, docking bays, solar panel arrays, and modular expansion ports. Our most ambitious architecture project, requiring patience and precision.',
  'Une construction de station spatiale massive avec des anneaux d''habitat rotatifs, des baies d''amarrage, des panneaux solaires et des ports d''expansion modulaires. Notre projet d''architecture le plus ambitieux.',
  'Massive space station with rotating habitat rings',
  'Station spatiale massive avec anneaux d''habitat rotatifs',
  1899.00,
  3521,
  'expert',
  'Architecture',
  'Architecture',
  '/mirdad/images/orbital-station.jpg',
  true,
  'preorder',
  '[{"set_id": "21321", "set_name": "International Space Station", "quantity": 3}, {"set_id": "10283", "set_name": "NASA Space Shuttle", "quantity": 2}]'
),
(
  'scout-walker',
  'Scout Walker',
  'Marcheur Éclaireur',
  'A lightweight reconnaissance mech perfect for beginners. Simple construction techniques introduce core kitbashing concepts while delivering a satisfying finished model with poseable legs.',
  'Un mech de reconnaissance léger parfait pour les débutants. Des techniques de construction simples introduisent les concepts de base du kitbashing tout en offrant un modèle fini satisfaisant.',
  'Lightweight recon mech, perfect for beginners',
  'Mech de reconnaissance léger, parfait pour débutants',
  349.00,
  876,
  'beginner',
  'Mechs',
  'Mechs',
  '/mirdad/images/scout-walker.jpg',
  false,
  'in_stock',
  '[{"set_id": "42118", "set_name": "Monster Jam Grave Digger", "quantity": 2}]'
),
(
  'heavy-transport',
  'Heavy Transport',
  'Transport Lourd',
  'An industrial cargo hauler featuring a working crane, opening cargo bay, and detailed cabin interior. This advanced build teaches complex mechanical systems and realistic vehicle proportions.',
  'Un transporteur de fret industriel avec une grue fonctionnelle, une soute de chargement ouvrante et un intérieur de cabine détaillé. Cette construction avancée enseigne les systèmes mécaniques complexes.',
  'Industrial cargo hauler with working crane',
  'Transporteur de fret industriel avec grue fonctionnelle',
  899.00,
  1892,
  'advanced',
  'Vehicles',
  'Véhicules',
  '/mirdad/images/heavy-transport.jpg',
  true,
  'low_stock',
  '[{"set_id": "42128", "set_name": "Heavy-Duty Tow Truck", "quantity": 1}, {"set_id": "42108", "set_name": "Mobile Crane", "quantity": 1}]'
),
(
  'city-block-7',
  'City Block 7',
  'Bloc Urbain 7',
  'A modular urban architecture set that can be configured in multiple ways. Includes detailed building facades, street-level shops, rooftop details, and hidden interior rooms.',
  'Un ensemble d''architecture urbaine modulaire qui peut être configuré de plusieurs façons. Comprend des façades de bâtiments détaillées, des boutiques au niveau de la rue et des toits détaillés.',
  'Modular urban architecture with detailed facades',
  'Architecture urbaine modulaire avec façades détaillées',
  749.00,
  2156,
  'intermediate',
  'Architecture',
  'Architecture',
  '/mirdad/images/city-block-7.jpg',
  false,
  'in_stock',
  '[{"set_id": "10278", "set_name": "Police Station", "quantity": 1}, {"set_id": "10270", "set_name": "Bookshop", "quantity": 1}, {"set_id": "10297", "set_name": "Boutique Hotel", "quantity": 1}]'
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_mirdad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mirdad_models_updated_at
  BEFORE UPDATE ON mirdad_models
  FOR EACH ROW
  EXECUTE FUNCTION update_mirdad_updated_at();
