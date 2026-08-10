-- Mirdad Real Estate Landing Page Schema
-- Union Properties - Motor City Development
-- Tables for units, leads, and brochure requests

-- Unit type enum
CREATE TYPE mirdad_unit_type AS ENUM ('studio', '1br', '2br', '3br', 'loft', 'duplex', 'penthouse');

-- Lead status enum  
CREATE TYPE mirdad_lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'closed');

-- Lead source enum
CREATE TYPE mirdad_lead_source AS ENUM ('website', 'whatsapp', 'phone', 'brochure', 'referral', 'social');

-- Units/Floor Plans table
CREATE TABLE mirdad_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_type mirdad_unit_type NOT NULL,
  title TEXT NOT NULL,
  title_fr TEXT,
  description TEXT,
  description_fr TEXT,
  starting_price_aed DECIMAL(12, 2) NOT NULL,
  size_sqft_min INTEGER NOT NULL,
  size_sqft_max INTEGER,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  floor_plan_url TEXT,
  render_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb, -- ["Balcony", "City View", "Smart Home"]
  features_fr JSONB DEFAULT '[]'::jsonb,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Amenities table
CREATE TABLE mirdad_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_fr TEXT,
  description TEXT,
  description_fr TEXT,
  icon TEXT, -- Lucide icon name
  category TEXT DEFAULT 'general', -- fitness, leisure, family, business, sustainability
  display_order INTEGER DEFAULT 0
);

-- Leads table (main CRM for interest registration)
CREATE TABLE mirdad_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  preferred_language TEXT DEFAULT 'en',
  interested_unit_type mirdad_unit_type,
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),
  message TEXT,
  source mirdad_lead_source DEFAULT 'website',
  status mirdad_lead_status DEFAULT 'new',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  brochure_requested BOOLEAN DEFAULT false,
  brochure_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Project details (singleton config table)
CREATE TABLE mirdad_project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT 'MIRDAD',
  tagline TEXT DEFAULT 'Where The Heart Belongs',
  tagline_fr TEXT DEFAULT 'Où le Cœur Appartient',
  developer TEXT DEFAULT 'Union Properties',
  location TEXT DEFAULT 'Motor City, Dubai',
  starting_price_aed DECIMAL(12, 2) DEFAULT 999000,
  payment_plan TEXT DEFAULT '30/70',
  completion_date TEXT DEFAULT 'Q4 2027',
  total_units INTEGER DEFAULT 500,
  amenities_count INTEGER DEFAULT 26,
  ev_parking_percent INTEGER DEFAULT 50,
  brochure_url TEXT,
  video_url TEXT,
  hero_image_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  contact_phone TEXT DEFAULT '+971 800 886466',
  contact_whatsapp TEXT DEFAULT '+971 800 877253',
  contact_email TEXT DEFAULT 'info@up.ae',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_mirdad_units_type ON mirdad_units(unit_type);
CREATE INDEX idx_mirdad_units_available ON mirdad_units(is_available) WHERE is_available = true;
CREATE INDEX idx_mirdad_leads_email ON mirdad_leads(email);
CREATE INDEX idx_mirdad_leads_status ON mirdad_leads(status);
CREATE INDEX idx_mirdad_leads_created ON mirdad_leads(created_at DESC);

-- RLS Policies
ALTER TABLE mirdad_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirdad_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirdad_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirdad_project ENABLE ROW LEVEL SECURITY;

-- Public can view units, amenities, and project info
CREATE POLICY "Public can view units" ON mirdad_units FOR SELECT USING (true);
CREATE POLICY "Public can view amenities" ON mirdad_amenities FOR SELECT USING (true);
CREATE POLICY "Public can view project" ON mirdad_project FOR SELECT USING (true);

-- Anyone can submit leads
CREATE POLICY "Anyone can submit lead" ON mirdad_leads FOR INSERT WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role manages units" ON mirdad_units FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages amenities" ON mirdad_amenities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages leads" ON mirdad_leads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages project" ON mirdad_project FOR ALL USING (auth.role() = 'service_role');

-- Seed project data
INSERT INTO mirdad_project (name, tagline, tagline_fr, developer, location, starting_price_aed, payment_plan, completion_date, total_units, amenities_count, ev_parking_percent, contact_phone, contact_whatsapp, contact_email) VALUES
('MIRDAD', 'Where The Heart Belongs', 'Où le Cœur Appartient', 'Union Properties', 'Motor City, Dubai', 999000, '30/70', 'Q4 2027', 500, 26, 50, '+971 800 886466', '+971 800 877253', 'info@up.ae');

-- Seed unit types
INSERT INTO mirdad_units (unit_type, title, title_fr, description, description_fr, starting_price_aed, size_sqft_min, size_sqft_max, bedrooms, bathrooms, features, features_fr, display_order) VALUES
('studio', 'Studio Apartments', 'Studios', 'Thoughtfully designed studio apartments perfect for young professionals. Open-plan living with premium finishes and smart home features.', 'Studios soigneusement conçus, parfaits pour les jeunes professionnels. Salon ouvert avec finitions premium et fonctionnalités maison intelligente.', 799000, 400, 550, 0, 1, '["Smart Home Ready", "Built-in Wardrobes", "Premium Finishes", "Balcony"]', '["Maison Intelligente", "Placards Intégrés", "Finitions Premium", "Balcon"]', 1),
('1br', '1 Bedroom Apartments', 'Appartements 1 Chambre', 'Elegant one-bedroom residences offering the perfect balance of comfort and style. Featuring spacious living areas and modern kitchens.', 'Résidences élégantes d''une chambre offrant l''équilibre parfait entre confort et style. Avec espaces de vie spacieux et cuisines modernes.', 999000, 650, 850, 1, 1, '["Open Kitchen", "Master En-suite", "Smart Home Ready", "Balcony", "Storage Room"]', '["Cuisine Ouverte", "Suite Parentale", "Maison Intelligente", "Balcon", "Rangement"]', 2),
('2br', '2 Bedroom Apartments', 'Appartements 2 Chambres', 'Spacious two-bedroom apartments designed for families. Generous living spaces, premium appliances, and stunning Motor City views.', 'Appartements spacieux de deux chambres conçus pour les familles. Espaces de vie généreux, appareils premium et vues imprenables sur Motor City.', 1450000, 1100, 1400, 2, 2, '["Maid''s Room", "Walk-in Closet", "Premium Appliances", "Large Balcony", "Smart Home"]', '["Chambre de Bonne", "Dressing", "Appareils Premium", "Grand Balcon", "Maison Intelligente"]', 3),
('3br', '3 Bedroom Apartments', 'Appartements 3 Chambres', 'Luxurious three-bedroom residences for discerning families. Premium finishes throughout, multiple balconies, and panoramic city views.', 'Résidences luxueuses de trois chambres pour familles exigeantes. Finitions premium, multiples balcons et vues panoramiques sur la ville.', 2100000, 1600, 2200, 3, 3, '["Maid''s Room", "Multiple Balconies", "Walk-in Closets", "Premium Kitchen", "Smart Home", "Storage"]', '["Chambre de Bonne", "Multiples Balcons", "Dressings", "Cuisine Premium", "Maison Intelligente", "Rangement"]', 4),
('loft', 'Lofts', 'Lofts', 'Contemporary loft-style living with dramatic double-height ceilings. Industrial-chic design meets luxury amenities for the modern urbanite.', 'Vie contemporaine style loft avec plafonds spectaculaires double hauteur. Design industriel-chic rencontre équipements luxueux pour l''urbain moderne.', 1800000, 1200, 1800, 2, 2, '["Double Height Ceiling", "Mezzanine Level", "Industrial Design", "Premium Finishes", "Smart Home"]', '["Plafond Double Hauteur", "Niveau Mezzanine", "Design Industriel", "Finitions Premium", "Maison Intelligente"]', 5),
('duplex', 'Duplexes', 'Duplex', 'Exceptional duplex residences spanning two floors. Private internal staircases, rooftop terraces, and the finest finishes throughout.', 'Résidences duplex exceptionnelles sur deux étages. Escaliers internes privés, terrasses sur le toit et finitions les plus fines.', 2800000, 2200, 3500, 3, 4, '["Private Terrace", "Internal Staircase", "Rooftop Access", "Premium Kitchen", "Multiple Living Areas", "Smart Home"]', '["Terrasse Privée", "Escalier Interne", "Accès au Toit", "Cuisine Premium", "Multiples Espaces de Vie", "Maison Intelligente"]', 6);

-- Seed amenities
INSERT INTO mirdad_amenities (name, name_fr, icon, category, display_order) VALUES
('Infinity Pool', 'Piscine à Débordement', 'Waves', 'leisure', 1),
('State-of-the-art Gym', 'Salle de Sport Moderne', 'Dumbbell', 'fitness', 2),
('Yoga & Meditation Studio', 'Studio Yoga & Méditation', 'Heart', 'fitness', 3),
('Kids Play Area', 'Aire de Jeux Enfants', 'Baby', 'family', 4),
('BBQ Area', 'Zone Barbecue', 'Flame', 'leisure', 5),
('Landscaped Gardens', 'Jardins Paysagers', 'TreeDeciduous', 'leisure', 6),
('Jogging Track', 'Piste de Jogging', 'Footprints', 'fitness', 7),
('Business Center', 'Centre d''Affaires', 'Briefcase', 'business', 8),
('Co-working Space', 'Espace Coworking', 'Laptop', 'business', 9),
('Concierge Service', 'Service Conciergerie', 'Bell', 'general', 10),
('24/7 Security', 'Sécurité 24/7', 'Shield', 'general', 11),
('Smart Home Features', 'Fonctionnalités Maison Intelligente', 'Smartphone', 'general', 12),
('EV Charging Stations', 'Bornes de Recharge VE', 'Zap', 'sustainability', 13),
('Retail Outlets', 'Commerces', 'ShoppingBag', 'general', 14),
('Cafes & Restaurants', 'Cafés & Restaurants', 'Coffee', 'leisure', 15),
('Sports Courts', 'Terrains de Sport', 'Trophy', 'fitness', 16),
('Cinema Room', 'Salle de Cinéma', 'Clapperboard', 'leisure', 17),
('Spa & Sauna', 'Spa & Sauna', 'Sparkles', 'leisure', 18),
('Prayer Room', 'Salle de Prière', 'Moon', 'general', 19),
('Covered Parking', 'Parking Couvert', 'Car', 'general', 20),
('Bicycle Storage', 'Rangement Vélos', 'Bike', 'sustainability', 21),
('Pet-Friendly Areas', 'Espaces Animaux', 'PawPrint', 'family', 22),
('Outdoor Cinema', 'Cinéma Extérieur', 'Film', 'leisure', 23),
('Rooftop Lounge', 'Salon sur le Toit', 'Cloud', 'leisure', 24),
('Water Features', 'Jeux d''Eau', 'Droplets', 'leisure', 25),
('Green Building Certified', 'Certifié Bâtiment Vert', 'Leaf', 'sustainability', 26);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_mirdad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mirdad_units_updated_at
  BEFORE UPDATE ON mirdad_units
  FOR EACH ROW
  EXECUTE FUNCTION update_mirdad_updated_at();

CREATE TRIGGER mirdad_leads_updated_at
  BEFORE UPDATE ON mirdad_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_mirdad_updated_at();

CREATE TRIGGER mirdad_project_updated_at
  BEFORE UPDATE ON mirdad_project
  FOR EACH ROW
  EXECUTE FUNCTION update_mirdad_updated_at();
