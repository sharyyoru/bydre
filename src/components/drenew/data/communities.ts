// Communities data for DreNew pages

export interface Community {
  slug: string
  name: string
  description: string
  shortDescription: string
  propertyCount: number
  image: string
  images: string[]
  highlights: { label: string; value: string }[]
  nearbyAttractions: { name: string; distance: string }[]
  propertyTypes: string[]
  priceRange: { min: number; max: number }
  featured?: boolean
}

export const COMMUNITIES: Community[] = [
  {
    slug: "downtown-dubai",
    name: "Downtown Dubai",
    shortDescription: "Home to iconic landmarks and luxury living.",
    description: "Downtown Dubai is one of the world's most prestigious addresses, home to the iconic Burj Khalifa, Dubai Mall, and Dubai Fountain. This master-planned community by Emaar offers a vibrant mix of residential towers, hotels, and entertainment destinations. Living here means being at the heart of Dubai's most dynamic urban landscape, with world-class dining, shopping, and cultural experiences at your doorstep.",
    propertyCount: 50,
    image: "https://images.unsplash.com/photo-1546412414-e1885259563a?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1546412414-e1885259563a?w=800&q=80",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
    ],
    highlights: [
      { label: "Lifestyle", value: "Urban Luxury" },
      { label: "Avg. Price/sqft", value: "AED 2,800" },
      { label: "ROI", value: "5-7%" },
      { label: "Walk Score", value: "95/100" },
    ],
    nearbyAttractions: [
      { name: "Burj Khalifa / Dubai Mall", distance: "On-site" },
      { name: "Dubai Opera", distance: "5 mins walk" },
      { name: "DIFC", distance: "8 mins" },
      { name: "Dubai Airport", distance: "15 mins" },
    ],
    propertyTypes: ["Apartments", "Penthouses", "Serviced Residences"],
    priceRange: { min: 1500000, max: 50000000 },
    featured: true,
  },
  {
    slug: "business-bay",
    name: "Business Bay",
    shortDescription: "A thriving urban hub along Dubai Canal.",
    description: "Business Bay is Dubai's answer to Manhattan – a thriving urban district that combines high-powered commercial energy with upscale residential living. Located along the Dubai Canal and neighboring Downtown Dubai, it offers a fast-paced lifestyle with unmatched city access. The skyline features some of Dubai's most iconic towers, with stunning views of the Canal and Burj Khalifa.",
    propertyCount: 48,
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    ],
    highlights: [
      { label: "Lifestyle", value: "Urban Professional" },
      { label: "Avg. Price/sqft", value: "AED 1,800" },
      { label: "ROI", value: "6-8%" },
      { label: "Walk Score", value: "88/100" },
    ],
    nearbyAttractions: [
      { name: "Burj Khalifa / Dubai Mall", distance: "10 mins" },
      { name: "Dubai Creek Harbour", distance: "14 mins" },
      { name: "Dubai Airport", distance: "15 mins" },
      { name: "Dubai Hills Mall", distance: "30 mins" },
    ],
    propertyTypes: ["Apartments", "Penthouses", "Offices"],
    priceRange: { min: 800000, max: 30000000 },
    featured: true,
  },
  {
    slug: "palm-jumeirah",
    name: "Palm Jumeirah",
    shortDescription: "Dubai's most iconic waterfront destination.",
    description: "Palm Jumeirah is the world's largest artificial island and one of Dubai's most exclusive addresses. Shaped like a palm tree, this engineering marvel offers beachfront villas, luxury apartments, and five-star resorts. Living on the Palm means enjoying private beaches, spectacular sunsets, and a resort-style lifestyle year-round.",
    propertyCount: 35,
    image: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    ],
    highlights: [
      { label: "Lifestyle", value: "Beachfront Luxury" },
      { label: "Avg. Price/sqft", value: "AED 3,500" },
      { label: "ROI", value: "4-6%" },
      { label: "Beach Access", value: "Private" },
    ],
    nearbyAttractions: [
      { name: "Atlantis The Palm", distance: "5 mins" },
      { name: "Nakheel Mall", distance: "8 mins" },
      { name: "Dubai Marina", distance: "12 mins" },
      { name: "Mall of Emirates", distance: "20 mins" },
    ],
    propertyTypes: ["Villas", "Apartments", "Penthouses", "Townhouses"],
    priceRange: { min: 2000000, max: 100000000 },
    featured: true,
  },
  {
    slug: "dubai-hills-estate",
    name: "Dubai Hills Estate",
    shortDescription: "A premium golf community with green landscapes.",
    description: "Dubai Hills Estate is Emaar's flagship master-planned community featuring an 18-hole championship golf course, expansive parks, and a mix of luxury villas and contemporary apartments. This self-contained city offers Dubai Hills Mall, schools, hospitals, and endless recreational facilities, making it perfect for families seeking a balanced lifestyle.",
    propertyCount: 42,
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    ],
    highlights: [
      { label: "Lifestyle", value: "Golf & Family" },
      { label: "Avg. Price/sqft", value: "AED 1,600" },
      { label: "ROI", value: "5-7%" },
      { label: "Green Space", value: "45%" },
    ],
    nearbyAttractions: [
      { name: "Dubai Hills Mall", distance: "5 mins" },
      { name: "Downtown Dubai", distance: "15 mins" },
      { name: "Dubai Airport", distance: "20 mins" },
      { name: "Business Bay", distance: "12 mins" },
    ],
    propertyTypes: ["Villas", "Apartments", "Townhouses"],
    priceRange: { min: 1200000, max: 50000000 },
    featured: true,
  },
  {
    slug: "dubai-marina",
    name: "Dubai Marina",
    shortDescription: "Vibrant waterfront living with marina views.",
    description: "Dubai Marina is one of the world's largest man-made marinas, offering a vibrant waterfront lifestyle with stunning views of luxury yachts and glittering towers. The Marina Walk promenade features restaurants, cafes, and boutiques, while residents enjoy easy access to JBR Beach and world-class amenities.",
    propertyCount: 56,
    image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80",
    ],
    highlights: [
      { label: "Lifestyle", value: "Marina Living" },
      { label: "Avg. Price/sqft", value: "AED 1,500" },
      { label: "ROI", value: "6-8%" },
      { label: "Walk Score", value: "92/100" },
    ],
    nearbyAttractions: [
      { name: "JBR Beach", distance: "10 mins walk" },
      { name: "Marina Mall", distance: "5 mins walk" },
      { name: "Palm Jumeirah", distance: "10 mins" },
      { name: "Mall of Emirates", distance: "15 mins" },
    ],
    propertyTypes: ["Apartments", "Penthouses"],
    priceRange: { min: 900000, max: 25000000 },
    featured: true,
  },
  {
    slug: "jvc",
    name: "Jumeirah Village Circle",
    shortDescription: "Affordable family-friendly community.",
    description: "Jumeirah Village Circle (JVC) is one of Dubai's most popular residential communities, known for its affordability and family-friendly environment. With a mix of villas, townhouses, and apartments surrounding lush parks, JVC offers excellent value and easy access to major highways.",
    propertyCount: 65,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    ],
    highlights: [
      { label: "Lifestyle", value: "Family Living" },
      { label: "Avg. Price/sqft", value: "AED 850" },
      { label: "ROI", value: "7-9%" },
      { label: "Community Rating", value: "4.5/5" },
    ],
    nearbyAttractions: [
      { name: "Circle Mall", distance: "5 mins" },
      { name: "Dubai Marina", distance: "15 mins" },
      { name: "Mall of Emirates", distance: "12 mins" },
      { name: "Dubai Autodrome", distance: "10 mins" },
    ],
    propertyTypes: ["Apartments", "Villas", "Townhouses"],
    priceRange: { min: 400000, max: 5000000 },
  },
  {
    slug: "dubai-creek-harbour",
    name: "Dubai Creek Harbour",
    shortDescription: "A new downtown with the future Creek Tower.",
    description: "Dubai Creek Harbour is Emaar's ambitious waterfront development that will be home to the iconic Creek Tower. This emerging downtown offers a blend of residential, commercial, and leisure spaces with stunning views of Dubai Creek and the wildlife sanctuary.",
    propertyCount: 46,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    ],
    highlights: [
      { label: "Lifestyle", value: "Waterfront Modern" },
      { label: "Avg. Price/sqft", value: "AED 1,400" },
      { label: "ROI", value: "6-8%" },
      { label: "Nature Reserve", value: "Adjacent" },
    ],
    nearbyAttractions: [
      { name: "Ras Al Khor Sanctuary", distance: "5 mins" },
      { name: "Festival City Mall", distance: "10 mins" },
      { name: "Downtown Dubai", distance: "15 mins" },
      { name: "Dubai Airport", distance: "12 mins" },
    ],
    propertyTypes: ["Apartments", "Townhouses"],
    priceRange: { min: 1000000, max: 20000000 },
  },
  {
    slug: "emaar-beachfront",
    name: "Emaar Beachfront",
    shortDescription: "Private beachfront living between JBR and Palm.",
    description: "Emaar Beachfront is an exclusive island destination located between JBR and Palm Jumeirah. This private community offers direct beach access, a marina, and stunning views of the Arabian Gulf, making it one of Dubai's most desirable beachfront addresses.",
    propertyCount: 33,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
      "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    ],
    highlights: [
      { label: "Lifestyle", value: "Beachfront" },
      { label: "Avg. Price/sqft", value: "AED 2,400" },
      { label: "ROI", value: "5-6%" },
      { label: "Beach", value: "1.5km Private" },
    ],
    nearbyAttractions: [
      { name: "JBR Beach", distance: "5 mins walk" },
      { name: "Palm Jumeirah", distance: "5 mins" },
      { name: "Dubai Marina", distance: "8 mins" },
      { name: "Mall of Emirates", distance: "15 mins" },
    ],
    propertyTypes: ["Apartments", "Penthouses"],
    priceRange: { min: 1500000, max: 35000000 },
  },
  {
    slug: "damac-hills",
    name: "DAMAC Hills",
    shortDescription: "A world-class golf community with Trump Golf Club.",
    description: "DAMAC Hills is a prestigious golf community featuring the Trump International Golf Club Dubai. This self-contained destination offers luxury villas, townhouses, and apartments surrounded by lush green landscapes, with a range of amenities including restaurants, retail, and recreational facilities.",
    propertyCount: 38,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
    ],
    highlights: [
      { label: "Lifestyle", value: "Golf Living" },
      { label: "Avg. Price/sqft", value: "AED 1,100" },
      { label: "ROI", value: "5-7%" },
      { label: "Golf Course", value: "18-Hole" },
    ],
    nearbyAttractions: [
      { name: "Trump Golf Club", distance: "On-site" },
      { name: "Mall of Emirates", distance: "15 mins" },
      { name: "Dubai Marina", distance: "20 mins" },
      { name: "Al Maktoum Airport", distance: "25 mins" },
    ],
    propertyTypes: ["Villas", "Townhouses", "Apartments"],
    priceRange: { min: 1000000, max: 25000000 },
  },
  {
    slug: "town-square",
    name: "Town Square",
    shortDescription: "Community-focused living with extensive parks.",
    description: "Town Square by Nshama is a vibrant community designed around the concept of new urbanism. Featuring extensive parks, a central plaza, and a mix of apartments and townhouses, it offers an affordable yet high-quality lifestyle with excellent community facilities.",
    propertyCount: 28,
    image: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    ],
    highlights: [
      { label: "Lifestyle", value: "Community Living" },
      { label: "Avg. Price/sqft", value: "AED 750" },
      { label: "ROI", value: "7-8%" },
      { label: "Parks", value: "300+ acres" },
    ],
    nearbyAttractions: [
      { name: "Town Square Park", distance: "On-site" },
      { name: "Reel Cinema", distance: "5 mins walk" },
      { name: "Dubai Outlet Mall", distance: "10 mins" },
      { name: "Global Village", distance: "15 mins" },
    ],
    propertyTypes: ["Apartments", "Townhouses"],
    priceRange: { min: 500000, max: 3000000 },
  },
]

// Helper functions
export function getCommunityBySlug(slug: string): Community | undefined {
  return COMMUNITIES.find((c) => c.slug === slug)
}

export function getFeaturedCommunities(): Community[] {
  return COMMUNITIES.filter((c) => c.featured)
}
