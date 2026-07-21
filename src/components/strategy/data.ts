// Single source of truth for the Social Media Strategy page.
// All copy and numbers live here — edit freely; the UI reads from these constants.

export type PageKey = "main" | "global" | "careers"

export interface Deliverables {
  feed: number
  stories: number
  reels: number
  shorts: number
}

export interface PagePlaybook {
  key: PageKey
  handle: string
  name: string
  role: string
  accent: string // tailwind-friendly hex used for accents/charts
  objective: string
  audience: string[]
  tone: string[]
  pillars: { title: string; description: string; examples: string[] }[]
  deliverables: Deliverables
  goldenRule: string
}

export const WEEKS_PER_MONTH = 4.3

export const PLAYBOOKS: PagePlaybook[] = [
  {
    key: "main",
    handle: "@drehomes_realestate",
    name: "Main — Brand",
    role: "Flagship brand page",
    accent: "#0A1628",
    objective:
      "Establish DreHomes as the flagship real-estate brand in Dubai — aspirational, authoritative, and instantly recognizable. This is the brand's face, not a recruitment or sales feed.",
    audience: [
      "High-intent buyers & investors",
      "Existing clients & referrals",
      "Industry peers & press",
      "The wider Dubai audience",
    ],
    tone: ["Aspirational", "Polished", "Authoritative", "Lifestyle-led"],
    pillars: [
      {
        title: "Brand Storytelling",
        description: "The DreHomes identity, vision, and the people behind it.",
        examples: ["Founder/vision reels", "Brand film cutdowns", "Milestones & awards"],
      },
      {
        title: "Signature Listings",
        description: "Hero properties shot cinematically to anchor the brand's premium feel.",
        examples: ["Cinematic property tours", "Before/after reveals", "Golden-hour walkthroughs"],
      },
      {
        title: "Market Authority",
        description: "Sharp, credible commentary that positions DreHomes as the expert.",
        examples: ["Market snapshots", "Area spotlights", "'Ask an expert' explainers"],
      },
      {
        title: "Lifestyle & Culture",
        description: "The Dubai lifestyle and the culture clients buy into.",
        examples: ["Neighborhood lifestyle reels", "Client wins & handovers", "Team culture moments"],
      },
    ],
    deliverables: { feed: 4, stories: 10, reels: 3, shorts: 3 },
    goldenRule: "No recruitment CTAs. Everything reinforces the premium brand.",
  },
  {
    key: "global",
    handle: "@drehomes.global",
    name: "Global — Multilingual",
    role: "International investor & agent reach",
    accent: "#2563EB",
    objective:
      "Reach international investors and global agent talent by publishing localized content across seven languages. Win priority markets and make DreHomes feel native everywhere.",
    audience: [
      "Overseas investors (EU, GCC, CIS)",
      "Global agents seeking a Dubai base",
      "Relocation & second-home buyers",
      "Diaspora communities",
    ],
    tone: ["Informative", "Trust-building", "Locally native", "Investor-savvy"],
    pillars: [
      {
        title: "Investor Education",
        description: "Demystify Dubai real estate for a global audience.",
        examples: ["ROI/yield explainers", "Golden Visa guides", "Tax & ownership FAQs"],
      },
      {
        title: "International Listings",
        description: "Properties framed for cross-border buyers.",
        examples: ["Investment-grade units", "Off-plan launches", "Price-in-your-currency posts"],
      },
      {
        title: "Region Spotlights",
        description: "Content tailored to each priority language market.",
        examples: ["'Dubai for Russians' series", "Turkish investor stories", "EU relocation guides"],
      },
      {
        title: "Relocation & Lifestyle",
        description: "The practical + aspirational case for moving/investing.",
        examples: ["Cost-of-living comparisons", "Schools & communities", "Day-in-Dubai reels"],
      },
    ],
    deliverables: { feed: 5, stories: 7, reels: 4, shorts: 4 },
    goldenRule: "Never single-language. Every asset is localized and market-aware.",
  },
  {
    key: "careers",
    handle: "@drehomes_careers",
    name: "Careers — Talent",
    role: "Recruitment & employer brand",
    accent: "#059669",
    objective:
      "Attract and convert agent talent — locally and globally — by showcasing the earning potential, support, and culture of building a career at DreHomes.",
    audience: [
      "Experienced agents (local & international)",
      "Career-switchers into real estate",
      "New agents seeking training",
      "Global talent considering Dubai",
    ],
    tone: ["Motivational", "Authentic", "Transparent", "High-energy"],
    pillars: [
      {
        title: "Agent Stories",
        description: "Real testimonials and success journeys that sell the dream credibly.",
        examples: ["Top-agent interviews", "'From X to DreHomes' stories", "Commission milestone wins"],
      },
      {
        title: "Day-in-the-Life",
        description: "Show the reality and energy of the role.",
        examples: ["POV agent day reels", "Deal-closing moments", "Office & viewings behind-the-scenes"],
      },
      {
        title: "Earnings & Growth",
        description: "Transparent upside and progression to drive applications.",
        examples: ["Commission structure explainers", "Earning-potential breakdowns", "Career-path ladders"],
      },
      {
        title: "Training & Culture",
        description: "The support system and team culture that de-risk the move.",
        examples: ["Onboarding & training", "Mentorship spotlights", "Team culture & events"],
      },
    ],
    deliverables: { feed: 3, stories: 6, reels: 3, shorts: 3 },
    goldenRule: "Recruitment-only. Every post drives toward 'apply / DM us'.",
  },
]

export const GLOBAL_LANGUAGES = [
  "Arabic",
  "Russian",
  "Turkish",
  "German",
  "Spanish",
  "French",
  "Italian",
]

export const PRIORITY_LANGUAGES = ["Arabic", "Russian"]

export const LANGUAGE_MODEL = {
  approach:
    "Produce one master asset, then localize with burned-in subtitles + native caption/hashtags — not 7× the workload.",
  rotation:
    "Feed spotlights 2–3 languages per week; Stories cycle through all 7. Arabic + Russian run every week (priority markets).",
}

// Content segregation matrix: rows = content type, cells = allowed on each page.
export interface MatrixRow {
  type: string
  main: boolean
  global: boolean
  careers: boolean
  note?: string
}

export const SEGREGATION_MATRIX: MatrixRow[] = [
  { type: "Brand storytelling", main: true, global: false, careers: false, note: "Brand identity lives on Main." },
  { type: "Signature/cinematic listings", main: true, global: true, careers: false, note: "Global reframes for investors." },
  { type: "Market authority / insights", main: true, global: true, careers: false },
  { type: "Multilingual / localized content", main: false, global: true, careers: false, note: "Exclusive to Global." },
  { type: "Investor education & ROI", main: false, global: true, careers: false },
  { type: "Agent testimonials", main: false, global: false, careers: true },
  { type: "Earnings / commission", main: false, global: false, careers: true, note: "Careers only." },
  { type: "Training & culture", main: false, global: false, careers: true },
  { type: "Recruitment CTAs (apply/DM)", main: false, global: false, careers: true },
  { type: "Lifestyle reels", main: true, global: true, careers: true, note: "Angle differs per page." },
]

export const DONTS = [
  "No recruitment CTAs on the Main brand page.",
  "No single-language-only content on Global.",
  "No luxury-brand flexing on Careers without a talent/earning angle.",
  "Don't cross-post identical captions — always adapt to each page's intent.",
]

export interface ChannelStep {
  label: string
  detail: string
}

export const REPURPOSING_FLOW: ChannelStep[] = [
  { label: "Shoot day", detail: "Capture vertical-first footage usable across all formats." },
  { label: "IG Reels", detail: "Primary format on all 3 pages — hook-led, 15–45s." },
  { label: "IG Stories", detail: "Daily cadence; polls, BTS, quick tips, link stickers." },
  { label: "YouTube Shorts", detail: "Repurpose top Reels/Stories — ~10 Shorts/week aggregated." },
]

export interface KpiGroup {
  page: string
  accent: string
  kpis: string[]
}

export const KPIS: KpiGroup[] = [
  {
    page: "Main — Brand",
    accent: "#0A1628",
    kpis: ["Reach & impressions", "Profile visits", "Saves & shares", "Engagement rate", "Brand search lift"],
  },
  {
    page: "Global — Multilingual",
    accent: "#2563EB",
    kpis: ["Follower growth by geo", "Per-language engagement", "Investor DMs / leads", "Reach in priority markets"],
  },
  {
    page: "Careers — Talent",
    accent: "#059669",
    kpis: ["Applications & inquiries", "DM leads", "Reel saves & shares", "Cost-per-applicant (later)"],
  },
]

export interface Phase {
  name: string
  status: "active" | "next" | "future"
  timeframe: string
  points: string[]
}

export const ROADMAP: Phase[] = [
  {
    name: "Phase 1 — Foundation",
    status: "active",
    timeframe: "Now",
    points: [
      "3 IG pages live with distinct roles & cadence",
      "YouTube Shorts repurposing engine",
      "Content pillars & segregation enforced",
      "Multilingual localization model on Global",
    ],
  },
  {
    name: "Phase 2 — Expansion",
    status: "next",
    timeframe: "Next quarter",
    points: [
      "YouTube long-form (market reports, agent interviews)",
      "TikTok test for Careers & Global",
      "LinkedIn for Careers/B2B recruitment",
      "Light paid boosting on top performers",
    ],
  },
  {
    name: "Phase 3 — Scale",
    status: "future",
    timeframe: "Later",
    points: [
      "Paid performance funnels (leads & applications)",
      "Influencer / agent-creator program",
      "Analytics automation via Social Monitor",
      "Attribution & CAC/LTV reporting",
    ],
  },
]

export function totalsFor(period: "week" | "month") {
  const mult = period === "month" ? WEEKS_PER_MONTH : 1
  const base = PLAYBOOKS.reduce(
    (acc, p) => ({
      feed: acc.feed + p.deliverables.feed,
      stories: acc.stories + p.deliverables.stories,
      reels: acc.reels + p.deliverables.reels,
      shorts: acc.shorts + p.deliverables.shorts,
    }),
    { feed: 0, stories: 0, reels: 0, shorts: 0 }
  )
  return {
    feed: Math.round(base.feed * mult),
    stories: Math.round(base.stories * mult),
    reels: Math.round(base.reels * mult),
    shorts: Math.round(base.shorts * mult),
  }
}
