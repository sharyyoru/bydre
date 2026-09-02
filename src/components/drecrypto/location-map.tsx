"use client"

import { MapPin, Navigation, Building2, ShoppingBag, GraduationCap, Plane } from "lucide-react"

interface LocationMapProps {
  latitude: number | null
  longitude: number | null
  location: string
  propertyName: string
}

interface NearbyPlace {
  name: string
  type: string
  distance: string
  icon: React.ComponentType<{ className?: string }>
}

export function LocationMap({ latitude, longitude, location, propertyName }: LocationMapProps) {
  // Default to Dubai center if no coordinates
  const lat = latitude || 25.2048
  const lng = longitude || 55.2708

  // Generate nearby places based on location
  const nearbyPlaces: NearbyPlace[] = [
    { name: "Dubai Mall", type: "Shopping", distance: "5 min", icon: ShoppingBag },
    { name: "Burj Khalifa", type: "Landmark", distance: "8 min", icon: Building2 },
    { name: "Dubai Metro", type: "Transport", distance: "3 min", icon: Navigation },
    { name: "International School", type: "Education", distance: "10 min", icon: GraduationCap },
    { name: "Dubai Airport", type: "Airport", distance: "20 min", icon: Plane },
  ]

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Map Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-white font-medium flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#C9A962]" />
          Location
        </h3>
        <p className="text-white/50 text-sm">{location}</p>
      </div>

      {/* Map */}
      <div className="relative h-[300px] bg-[#1a1a1a]">
        {/* Static Map Fallback (no API key needed) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#C9A962]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-[#C9A962]" />
            </div>
            <p className="text-white font-medium">{propertyName}</p>
            <p className="text-white/50 text-sm">{location}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#C9A962] hover:bg-[#b8994d] text-black text-sm font-medium rounded-lg transition-colors"
            >
              <Navigation className="h-4 w-4" />
              Open in Google Maps
            </a>
          </div>
        </div>

        {/* Background Map Image (decorative) */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${lng},${lat},13,0/600x300@2x?access_token=pk.placeholder")`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
      </div>

      {/* Nearby Places */}
      <div className="p-4">
        <h4 className="text-white/60 text-sm uppercase tracking-wider mb-4">Nearby</h4>
        <div className="grid grid-cols-2 gap-3">
          {nearbyPlaces.map((place) => (
            <div 
              key={place.name}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
            >
              <div className="w-10 h-10 bg-[#C9A962]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <place.icon className="h-5 w-5 text-[#C9A962]" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm truncate">{place.name}</p>
                <p className="text-white/50 text-xs">{place.distance}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Get Directions */}
      <div className="p-4 border-t border-white/10">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 border border-white/20 rounded-lg text-white hover:bg-white/5 transition-colors"
        >
          <Navigation className="h-4 w-4" />
          Get Directions
        </a>
      </div>
    </div>
  )
}
