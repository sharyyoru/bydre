// Developers data for DreNew pages

export interface Developer {
  slug: string
  name: string
  logo: string
  description: string
  shortDescription: string
  projectCount: number
  establishedYear: number
  headquarters: string
  image: string
  stats: { label: string; value: string }[]
  communities: string[]
  featured?: boolean
}

export const DEVELOPERS: Developer[] = [
  {
    slug: "emaar",
    name: "Emaar Properties",
    logo: "E",
    shortDescription: "Creator of iconic landmarks like Burj Khalifa and Dubai Mall.",
    description: "Emaar Properties is one of the world's most valuable and admired real estate development companies. A public joint stock company listed on the Dubai Financial Market, Emaar has a proven track record of delivering iconic masterplanned communities and world-famous landmarks. Notable projects include Burj Khalifa, Dubai Mall, Dubai Marina, and Dubai Hills Estate.",
    projectCount: 257,
    establishedYear: 1997,
    headquarters: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1546412414-e1885259563a?w=800&q=80",
    stats: [
      { label: "Projects Delivered", value: "60+" },
      { label: "Countries", value: "6" },
      { label: "Homes Delivered", value: "90,000+" },
      { label: "Market Cap", value: "$18B+" },
    ],
    communities: ["Downtown Dubai", "Dubai Hills Estate", "Dubai Creek Harbour", "Emaar Beachfront", "Dubai Marina", "Arabian Ranches"],
    featured: true,
  },
  {
    slug: "damac",
    name: "DAMAC Properties",
    logo: "D",
    shortDescription: "Luxury developer known for branded residences and golf communities.",
    description: "DAMAC Properties has been at the forefront of the Middle East's luxury real estate market since 2002. The company is known for its branded residences in partnership with fashion and automotive brands including Versace, Fendi, and now Bugatti. DAMAC has delivered over 43,000 homes across the UAE and beyond.",
    projectCount: 102,
    establishedYear: 2002,
    headquarters: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    stats: [
      { label: "Homes Delivered", value: "43,000+" },
      { label: "Brand Partners", value: "10+" },
      { label: "Countries", value: "4" },
      { label: "Employees", value: "4,000+" },
    ],
    communities: ["DAMAC Hills", "DAMAC Hills 2", "Business Bay", "Downtown Dubai", "JLT"],
    featured: true,
  },
  {
    slug: "sobha",
    name: "Sobha Realty",
    logo: "S",
    shortDescription: "Backward-integrated developer known for exceptional craftsmanship.",
    description: "Sobha Realty is a luxury real estate developer known for its backward integration model, where all aspects of construction are handled in-house. This ensures exceptional quality and craftsmanship across all projects. The company's flagship development, Sobha Hartland, showcases their commitment to delivering premium residences.",
    projectCount: 64,
    establishedYear: 1976,
    headquarters: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    stats: [
      { label: "Homes Delivered", value: "15,000+" },
      { label: "Countries", value: "7" },
      { label: "Land Bank", value: "8,000 acres" },
      { label: "Experience", value: "47+ years" },
    ],
    communities: ["Sobha Hartland", "Sobha Hartland 2", "Dubai Harbour", "MBR City"],
    featured: true,
  },
  {
    slug: "nakheel",
    name: "Nakheel",
    logo: "N",
    shortDescription: "Visionary developer behind Palm Jumeirah and The World Islands.",
    description: "Nakheel is the developer behind some of Dubai's most ambitious and recognizable developments including Palm Jumeirah, The World Islands, and Dragon City. As a master developer owned by Dubai government, Nakheel has been instrumental in shaping Dubai's unique skyline and creating iconic communities.",
    projectCount: 58,
    establishedYear: 2000,
    headquarters: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80",
    stats: [
      { label: "Communities", value: "15+" },
      { label: "Residents", value: "300,000+" },
      { label: "Retail Space", value: "17M sqft" },
      { label: "Hospitality Keys", value: "5,000+" },
    ],
    communities: ["Palm Jumeirah", "Jumeirah Islands", "Jumeirah Park", "Dragon City", "Discovery Gardens"],
    featured: true,
  },
  {
    slug: "aldar",
    name: "Aldar Properties",
    logo: "A",
    shortDescription: "Abu Dhabi's leading developer with iconic projects.",
    description: "Aldar Properties is the leading real estate developer in Abu Dhabi, responsible for iconic developments including Yas Island, Saadiyat Island, and Al Raha Beach. The company's portfolio includes residential, retail, commercial, and hospitality assets across prime locations in the UAE.",
    projectCount: 46,
    establishedYear: 2004,
    headquarters: "Abu Dhabi, UAE",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    stats: [
      { label: "Assets Under Management", value: "$12B+" },
      { label: "Land Bank", value: "69M sqm" },
      { label: "Developments", value: "20+" },
      { label: "Employees", value: "2,500+" },
    ],
    communities: ["Yas Island", "Saadiyat Island", "Al Raha Beach", "Reem Island"],
  },
  {
    slug: "nshama",
    name: "Nshama",
    logo: "N",
    shortDescription: "Developer focused on affordable quality homes and community living.",
    description: "Nshama is a UAE-based developer focused on creating vibrant, community-focused developments. Their flagship project, Town Square, epitomizes their approach of delivering high-quality, affordable homes with extensive community amenities. Nshama's developments feature innovative designs and strong value propositions.",
    projectCount: 42,
    establishedYear: 2014,
    headquarters: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80",
    stats: [
      { label: "Homes Delivered", value: "18,000+" },
      { label: "Communities", value: "3" },
      { label: "Park Space", value: "300+ acres" },
      { label: "Retail Space", value: "2M sqft" },
    ],
    communities: ["Town Square", "Rawda Apartments"],
  },
  {
    slug: "danube",
    name: "Danube Properties",
    logo: "D",
    shortDescription: "Known for affordable luxury with easy payment plans.",
    description: "Danube Properties has revolutionized Dubai's real estate market with its affordable luxury concept and innovative 1% monthly payment plans. The developer focuses on delivering quality homes with resort-style amenities at accessible price points, making property ownership achievable for more residents.",
    projectCount: 38,
    establishedYear: 2014,
    headquarters: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    stats: [
      { label: "Projects", value: "25+" },
      { label: "Units Delivered", value: "12,000+" },
      { label: "Avg. Payment Plan", value: "1% Monthly" },
      { label: "Communities", value: "10+" },
    ],
    communities: ["Business Bay", "JVC", "Arjan", "Al Furjan", "Sports City"],
  },
  {
    slug: "meraas",
    name: "Meraas",
    logo: "M",
    shortDescription: "Lifestyle developer behind City Walk, Bluewaters, and La Mer.",
    description: "Meraas is a Dubai-based holding company that has redefined urban living through innovative lifestyle destinations. Their portfolio includes City Walk, Bluewaters Island, La Mer, and The Beach at JBR. Meraas developments are known for their unique character and integration of retail, dining, and entertainment.",
    projectCount: 35,
    establishedYear: 2007,
    headquarters: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
    stats: [
      { label: "Destinations", value: "15+" },
      { label: "Retail Space", value: "10M sqft" },
      { label: "Hotels", value: "10+" },
      { label: "Beach Frontage", value: "5km+" },
    ],
    communities: ["City Walk", "Bluewaters", "Port de La Mer", "Marsa Al Arab"],
  },
  {
    slug: "binghatti",
    name: "Binghatti",
    logo: "B",
    shortDescription: "Innovative developer known for iconic architectural designs.",
    description: "Binghatti is known for its distinctive architectural style characterized by geometric patterns and crystalline facades. The developer has rapidly grown to become one of Dubai's most recognized names, with projects across Business Bay, JVC, and other prime locations. Their latest ventures include branded residences with Bugatti and Mercedes-Benz.",
    projectCount: 45,
    establishedYear: 2008,
    headquarters: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    stats: [
      { label: "Projects", value: "40+" },
      { label: "Units", value: "15,000+" },
      { label: "Brand Partners", value: "3" },
      { label: "Communities", value: "8+" },
    ],
    communities: ["Business Bay", "JVC", "Al Jaddaf", "Dubai Science Park", "Downtown Dubai"],
    featured: true,
  },
]

// Helper functions
export function getDeveloperBySlug(slug: string): Developer | undefined {
  return DEVELOPERS.find((d) => d.slug === slug)
}

export function getFeaturedDevelopers(): Developer[] {
  return DEVELOPERS.filter((d) => d.featured)
}
