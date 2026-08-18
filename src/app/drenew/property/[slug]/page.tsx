"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { 
  MapPin, Bed, Bath, Maximize, Calendar, Building2, 
  ChevronLeft, ChevronRight, Phone, MessageCircle,
  Download, FileText, Map
} from "lucide-react"
import { Breadcrumbs } from "@/components/drenew/shared/breadcrumbs"
import { InquiryForm } from "@/components/drenew/shared/inquiry-form"
import { PropertyCard } from "@/components/drenew/shared/property-card"
import { CTABanner } from "@/components/drenew/shared/cta-banner"
import { getPropertyBySlug, PROPERTIES } from "@/components/drenew/data/properties"
import { getAmenitiesByIds } from "@/components/drenew/data/amenities"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface PropertyPageProps {
  params: Promise<{ slug: string }>
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = use(params)
  const property = getPropertyBySlug(slug)
  const [activeImage, setActiveImage] = useState(0)

  if (!property) {
    notFound()
  }

  const amenities = getAmenitiesByIds(property.amenities)
  
  // Get similar properties
  const similarProperties = PROPERTIES.filter(
    (p) => p.slug !== property.slug && (p.communitySlug === property.communitySlug || p.developerSlug === property.developerSlug)
  ).slice(0, 4)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-AE").format(price)
  }

  const priceDisplay = property.priceType === "yearly"
    ? `AED ${formatPrice(property.priceFrom)}/year`
    : property.priceTo
      ? `AED ${formatPrice(property.priceFrom)} - ${formatPrice(property.priceTo)}`
      : `AED ${formatPrice(property.priceFrom)}`

  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#0a0a0a] pt-6 pb-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: property.type === "off-plan" ? "Off-Plan" : property.type === "rental" ? "Rent" : "Buy", href: `/drenew/${property.type === "off-plan" ? "offplan" : property.type === "rental" ? "rent" : "buy"}` },
              { label: property.name },
            ]}
          />

          {/* Gallery */}
          <div className="mt-8 grid lg:grid-cols-3 gap-4">
            {/* Main Image */}
            <div className="lg:col-span-2 relative h-[300px] lg:h-[500px] overflow-hidden border border-white/10">
              <Image
                src={property.images[activeImage]}
                alt={property.name}
                fill
                className="object-cover"
              />
              
              {/* Navigation */}
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((prev) => prev === 0 ? property.images.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setActiveImage((prev) => prev === property.images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Badge */}
              {property.badge && (
                <div className="absolute top-4 left-4">
                  <span className="bg-[#C9A962] text-black text-sm font-medium px-4 py-2">
                    {property.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="hidden lg:flex flex-col gap-4">
              {property.images.slice(0, 3).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`relative h-[156px] overflow-hidden border transition-all ${
                    activeImage === index ? "border-[#C9A962]" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <Image src={image} alt={`${property.name} ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Link href={`/drenew/developer/${property.developerSlug}`} className="text-[#C9A962] text-sm hover:underline">
                    By {property.developer}
                  </Link>
                  <span className="text-white/30">•</span>
                  <span className="text-white/50 text-sm uppercase tracking-wider">
                    {property.type === "off-plan" ? "Off-Plan" : property.type === "rental" ? "For Rent" : "For Sale"}
                  </span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-light text-white mb-4">
                  {property.name}
                </h1>

                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="h-4 w-4" />
                  <Link href={`/drenew/community/${property.communitySlug}`} className="hover:text-[#C9A962]">
                    {property.location}
                  </Link>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10">
                <div className="text-center">
                  <Bed className="h-5 w-5 text-[#C9A962] mx-auto mb-2" />
                  <p className="text-white font-medium">{property.beds}</p>
                  <p className="text-white/50 text-sm">Bedrooms</p>
                </div>
                <div className="text-center">
                  <Bath className="h-5 w-5 text-[#C9A962] mx-auto mb-2" />
                  <p className="text-white font-medium">{property.baths}</p>
                  <p className="text-white/50 text-sm">Bathrooms</p>
                </div>
                <div className="text-center">
                  <Maximize className="h-5 w-5 text-[#C9A962] mx-auto mb-2" />
                  <p className="text-white font-medium">{property.sqft}</p>
                  <p className="text-white/50 text-sm">Sq. Ft.</p>
                </div>
                <div className="text-center">
                  <Calendar className="h-5 w-5 text-[#C9A962] mx-auto mb-2" />
                  <p className="text-white font-medium">{property.handover}</p>
                  <p className="text-white/50 text-sm">Handover</p>
                </div>
              </div>

              {/* Price */}
              <div className="p-6 bg-gradient-to-r from-[#C9A962]/20 to-transparent border-l-4 border-[#C9A962]">
                <p className="text-white/60 text-sm mb-1">Starting From</p>
                <p className="text-3xl font-light text-white">{priceDisplay}</p>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-light text-white mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#C9A962]" />
                  Property Overview
                </h2>
                <p className="text-white/70 leading-relaxed">{property.description}</p>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-xl font-light text-white mb-6">Property Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {amenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center gap-3 p-4 bg-white/5 border border-white/10"
                    >
                      <span className="text-2xl">{amenity.icon}</span>
                      <span className="text-white/80 text-sm">{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Plan */}
              {property.paymentPlan && (
                <div>
                  <h2 className="text-xl font-light text-white mb-6">Payment Plan</h2>
                  <div className="space-y-4">
                    {property.paymentPlan.map((plan, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#C9A962]/20 border border-[#C9A962]/50 flex items-center justify-center text-[#C9A962] text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="text-white">{plan.milestone}</span>
                        </div>
                        <span className="text-[#C9A962] font-medium">{plan.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {property.nearbyAttractions && (
                <div>
                  <h2 className="text-xl font-light text-white mb-6">Location Highlights</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {property.nearbyAttractions.map((attraction, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-[#C9A962]" />
                          <span className="text-white/80">{attraction.name}</span>
                        </div>
                        <span className="text-white/50 text-sm">{attraction.distance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Downloads */}
              <div>
                <h2 className="text-xl font-light text-white mb-6">Downloads</h2>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-none">
                    <Download className="h-4 w-4 mr-2" />
                    Brochure
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-none">
                    <FileText className="h-4 w-4 mr-2" />
                    Floor Plans
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-none">
                    <Map className="h-4 w-4 mr-2" />
                    Master Plan
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Inquiry Form */}
              <div className="sticky top-24">
                <InquiryForm propertyName={property.name} />

                {/* Quick Contact */}
                <div className="mt-6 flex gap-4">
                  <a
                    href={`https://wa.me/+971527543243?text=Hi, I'm interested in ${property.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-none">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  </a>
                  <a href="tel:+971527543243" className="flex-1">
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 rounded-none">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <section className="py-16 bg-[#0a0a0a] border-t border-white/10">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-light text-white mb-8">Similar Properties</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((prop) => (
                <PropertyCard key={prop.slug} property={prop} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CTABanner variant="gold" />
    </>
  )
}
