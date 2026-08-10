import { MapPin, Car, Plane, Building, ShoppingBag } from "lucide-react"

interface LocationSectionProps {
  dict: {
    location: {
      title: string
      subtitle: string
      distances: {
        downtown: string
        airport: string
        marina: string
        mall: string
        autodrome: string
      }
      minutes: string
    }
  }
}

const distances = [
  { key: "downtown", icon: Building, time: 20 },
  { key: "airport", icon: Plane, time: 25 },
  { key: "marina", icon: MapPin, time: 20 },
  { key: "mall", icon: ShoppingBag, time: 15 },
  { key: "autodrome", icon: Car, time: 5 },
]

export function LocationSection({ dict }: LocationSectionProps) {
  return (
    <section id="location" className="py-20 lg:py-32 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Map Placeholder */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
        <div className="w-full h-full bg-[url('/mirdad/map-bg.jpg')] bg-cover bg-center" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-12 bg-[#C9A962]" />
            <span className="text-[#C9A962] text-sm tracking-[0.2em] uppercase">Location</span>
            <div className="h-px w-12 bg-[#C9A962]" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4">
            {dict.location.title}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {dict.location.subtitle}
          </p>
        </div>

        {/* Map & Distances */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Map Placeholder */}
          <div className="aspect-square lg:aspect-[4/3] bg-white/5 border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-[#C9A962] mx-auto mb-4" />
                <p className="text-white font-semibold text-lg">Motor City, Dubai</p>
                <p className="text-white/50 text-sm">Interactive Map</p>
              </div>
            </div>
            {/* Location Pin Marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-6 h-6 bg-[#C9A962] rounded-full animate-ping opacity-30" />
              <div className="absolute top-0 left-0 w-6 h-6 bg-[#C9A962] rounded-full" />
            </div>
          </div>

          {/* Distance Cards */}
          <div className="space-y-4">
            {distances.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-5 bg-white/5 border border-white/10 hover:border-[#C9A962]/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#C9A962]/10 flex items-center justify-center group-hover:bg-[#C9A962]/20 transition-colors">
                      <Icon className="w-5 h-5 text-[#C9A962]" />
                    </div>
                    <span className="text-white font-medium">
                      {dict.location.distances[item.key as keyof typeof dict.location.distances]}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-light text-[#C9A962]">{item.time}</span>
                    <span className="text-white/50 text-sm ml-1">{dict.location.minutes}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Connectivity Banner */}
        <div className="mt-16 p-8 bg-gradient-to-r from-[#C9A962]/10 via-[#C9A962]/5 to-transparent border border-[#C9A962]/20 text-center">
          <p className="text-white/80 text-lg">
            <span className="text-[#C9A962] font-semibold">Abu Dhabi</span>
            {" → 1hr → "}
            <span className="text-white font-semibold">Motor City</span>
            {" → 30min → "}
            <span className="text-[#C9A962] font-semibold">Sharjah</span>
          </p>
        </div>
      </div>
    </section>
  )
}
