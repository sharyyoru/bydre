export type TemplateType = 
  | "instagram_post" 
  | "instagram_story" 
  | "facebook_post" 
  | "property_flyer" 
  | "youtube_thumbnail" 
  | "linkedin_post"

export type BrandingType = "personal" | "company"

export type ContentStyle = "luxury" | "modern" | "minimal" | "bold"

export interface TemplateConfig {
  type: TemplateType
  label: string
  description: string
  width: number
  height: number
  icon: string
}

export const TEMPLATE_CONFIGS: Record<TemplateType, TemplateConfig> = {
  instagram_post: {
    type: "instagram_post",
    label: "Instagram Post",
    description: "Square format for feed posts",
    width: 1080,
    height: 1080,
    icon: "instagram",
  },
  instagram_story: {
    type: "instagram_story",
    label: "Instagram Story",
    description: "Vertical format for stories",
    width: 1080,
    height: 1920,
    icon: "smartphone",
  },
  facebook_post: {
    type: "facebook_post",
    label: "Facebook Post",
    description: "Landscape format for Facebook",
    width: 1200,
    height: 630,
    icon: "facebook",
  },
  property_flyer: {
    type: "property_flyer",
    label: "Property Flyer",
    description: "A4 print-ready flyer",
    width: 2480,
    height: 3508,
    icon: "file-text",
  },
  youtube_thumbnail: {
    type: "youtube_thumbnail",
    label: "YouTube Thumbnail",
    description: "Eye-catching video thumbnail",
    width: 1280,
    height: 720,
    icon: "youtube",
  },
  linkedin_post: {
    type: "linkedin_post",
    label: "LinkedIn Post",
    description: "Professional network format",
    width: 1200,
    height: 627,
    icon: "linkedin",
  },
}

export interface AgentBranding {
  id: string
  user_id: string
  workspace_id: string
  photo_url: string | null
  display_name: string | null
  phone: string | null
  email: string | null
  primary_color: string
  secondary_color: string
  tagline: string | null
  logo_url: string | null
}

export interface GeneratedContent {
  headline: string
  body_copy: string
  hashtags: string[]
  cta: string
  selected_image: string | null
}

export interface CreativeAsset {
  id: string
  workspace_id: string
  project_id: string | null
  created_by: string
  template_type: TemplateType
  branding_type: BrandingType
  headline: string | null
  body_copy: string | null
  hashtags: string[] | null
  cta: string | null
  image_url: string | null
  canva_design_id: string | null
  canva_edit_url: string | null
  export_url: string | null
  status: "draft" | "exported" | "published"
  created_at: string
  updated_at: string
}

export interface GenieMapProject {
  id: string
  workspace_id: string
  external_id: number
  name: string
  developer_name: string | null
  district_name: string | null
  status: "available" | "sold_out" | "launch" | null
  price_min: number | null
  price_max: number | null
  price_per_sqft: number | null
  area_min: number | null
  area_max: number | null
  handover_date: string | null
  unit_types: Array<{
    type: string
    beds: number
    area: number
    price: number
  }>
  image_url: string | null
  images: string[]
  documents: string[]
  description: string | null
  amenities: string[]
}
