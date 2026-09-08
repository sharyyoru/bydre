export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'why-invest-saadiyat-island-2024',
    title: 'Why Saadiyat Island is Abu Dhabi\'s Premier Investment Destination in 2024',
    excerpt: 'Discover why Saadiyat Island continues to attract global investors with its unique blend of culture, luxury, and strategic location.',
    content: `
## The Cultural Capital of the UAE

Saadiyat Island has established itself as the cultural heart of Abu Dhabi and the wider UAE. Home to the iconic Louvre Abu Dhabi, the island offers residents unprecedented access to world-class art and culture.

## Strategic Location Benefits

Located just 500 meters from the Abu Dhabi mainland, Saadiyat Island offers:

- **10 minutes** to Abu Dhabi International Airport
- **15 minutes** to Abu Dhabi Downtown
- **Direct access** to pristine natural beaches

## Strong Investment Returns

The Abu Dhabi real estate market has shown remarkable resilience and growth. Saadiyat Island properties have consistently outperformed market averages.

## Why SEI Saadiyat Stands Out

SEI Saadiyat by Aldar represents the next evolution of island living. With 778 thoughtfully designed residences across 6 towers, SEI offers:

- Prices starting from AED 2.95M
- Flexible 50/50 payment plan
- Premium amenities and finishes
- Expected handover in 2030
    `,
    date: '2024-09-01',
    readTime: '5 min read',
    category: 'Investment',
    image: '/images/sei/sei-exterior-1.jpeg',
  },
  {
    slug: 'understanding-50-50-payment-plans-uae',
    title: 'Understanding 50/50 Payment Plans: A Smart Way to Buy Property in UAE',
    excerpt: 'Learn how 50/50 payment plans work and why they make luxury property ownership more accessible than ever.',
    content: `
## What is a 50/50 Payment Plan?

A 50/50 payment plan is a developer-backed financing structure that divides your property purchase into two main phases:

1. **Construction Phase (50%)**: Pay half during the building period
2. **Handover Phase (50%)**: Pay the remaining half upon receiving your property

## Benefits of 50/50 Payment Plans

### Lower Initial Investment
Secure a premium property with just 5-10% at booking.

### No Bank Involvement During Construction
Unlike mortgages, 50/50 plans don't require bank approval during construction.

### Flexibility to Plan Finances
With payments spread over 3-4 years, you have time to arrange financing.

## SEI Saadiyat's Payment Structure

| Milestone | Payment |
|-----------|---------|
| Booking | 5% |
| During Construction | 45% |
| On Handover | 50% |
    `,
    date: '2024-08-15',
    readTime: '4 min read',
    category: 'Finance',
    image: '/images/sei/sei-interior-1.jpeg',
  },
  {
    slug: 'saadiyat-island-lifestyle-guide',
    title: 'Living on Saadiyat Island: A Complete Lifestyle Guide',
    excerpt: 'From world-class beaches to cultural landmarks, discover what makes Saadiyat Island the most coveted address in Abu Dhabi.',
    content: `
## The Saadiyat Lifestyle

Saadiyat Island isn't just a place to live—it's a lifestyle statement.

## Natural Beauty

### Pristine Beaches
Saadiyat boasts some of the most beautiful natural beaches in the Arabian Gulf.

### Protected Wildlife
The island's commitment to environmental preservation means residents coexist with diverse wildlife.

## Cultural Attractions

### Louvre Abu Dhabi
The iconic museum houses an impressive collection spanning civilizations and cultures.

### Upcoming Museums
- **Guggenheim Abu Dhabi**
- **Zayed National Museum**

## Why SEI Saadiyat?

SEI Saadiyat positions you at the heart of this exceptional lifestyle.
    `,
    date: '2024-08-01',
    readTime: '6 min read',
    category: 'Lifestyle',
    image: '/images/sei/sei-exterior-2.jpeg',
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}
