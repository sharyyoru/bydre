// Amenities data with icons for DreNew pages

export interface Amenity {
  id: string
  label: string
  icon: string
}

export const AMENITIES: Record<string, Amenity> = {
  pool: { id: "pool", label: "Swimming Pool", icon: "🏊" },
  gym: { id: "gym", label: "Fitness Center", icon: "💪" },
  spa: { id: "spa", label: "Spa & Wellness", icon: "🧖" },
  beach: { id: "beach", label: "Beach Access", icon: "🏖️" },
  marina: { id: "marina", label: "Marina", icon: "⛵" },
  golf: { id: "golf", label: "Golf Course", icon: "⛳" },
  tennis: { id: "tennis", label: "Tennis Court", icon: "🎾" },
  "kids-play": { id: "kids-play", label: "Kids Playground", icon: "🛝" },
  parks: { id: "parks", label: "Parks & Gardens", icon: "🌳" },
  retail: { id: "retail", label: "Retail Outlets", icon: "🛍️" },
  restaurants: { id: "restaurants", label: "Restaurants", icon: "🍽️" },
  concierge: { id: "concierge", label: "Concierge", icon: "🛎️" },
  valet: { id: "valet", label: "Valet Parking", icon: "🚗" },
  security: { id: "security", label: "24/7 Security", icon: "🔒" },
  parking: { id: "parking", label: "Covered Parking", icon: "🅿️" },
  "ev-charging": { id: "ev-charging", label: "EV Charging", icon: "⚡" },
  yoga: { id: "yoga", label: "Yoga Studio", icon: "🧘" },
  bbq: { id: "bbq", label: "BBQ Area", icon: "🍖" },
  steam: { id: "steam", label: "Steam Room", icon: "💨" },
  sauna: { id: "sauna", label: "Sauna", icon: "🔥" },
  schools: { id: "schools", label: "Schools Nearby", icon: "🏫" },
  hospital: { id: "hospital", label: "Hospital Nearby", icon: "🏥" },
  mall: { id: "mall", label: "Shopping Mall", icon: "🏬" },
  clubhouse: { id: "clubhouse", label: "Clubhouse", icon: "🏛️" },
  cycling: { id: "cycling", label: "Cycling Tracks", icon: "🚴" },
  promenade: { id: "promenade", label: "Promenade", icon: "🚶" },
  cinema: { id: "cinema", label: "Cinema", icon: "🎬" },
  "skate-park": { id: "skate-park", label: "Skate Park", icon: "🛹" },
  mosque: { id: "mosque", label: "Mosque", icon: "🕌" },
  nursery: { id: "nursery", label: "Nursery", icon: "👶" },
  "maid-room": { id: "maid-room", label: "Maid's Room", icon: "🛏️" },
  garden: { id: "garden", label: "Private Garden", icon: "🌺" },
  furnished: { id: "furnished", label: "Fully Furnished", icon: "🛋️" },
  "private-beach": { id: "private-beach", label: "Private Beach", icon: "🏝️" },
  helipad: { id: "helipad", label: "Helipad", icon: "🚁" },
  "car-elevator": { id: "car-elevator", label: "Car Elevator", icon: "🚙" },
}

export function getAmenityById(id: string): Amenity | undefined {
  return AMENITIES[id]
}

export function getAmenitiesByIds(ids: string[]): Amenity[] {
  return ids.map((id) => AMENITIES[id]).filter(Boolean)
}
