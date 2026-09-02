"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Grid3X3, Expand } from "lucide-react"

interface ImageGalleryProps {
  images: string[]
  propertyName: string
}

// Fallback images if none provided
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
  "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80",
  "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
]

export function ImageGallery({ images, propertyName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [showGrid, setShowGrid] = useState(false)

  // Use provided images or fallback
  const galleryImages = images.length > 0 ? images : FALLBACK_IMAGES

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
  }, [galleryImages.length])

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
  }, [galleryImages.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === "Escape") setLightboxOpen(false)
      if (e.key === "ArrowLeft") goToPrev()
      if (e.key === "ArrowRight") goToNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxOpen, goToPrev, goToNext])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [lightboxOpen])

  return (
    <>
      {/* Main Gallery */}
      <div className="grid grid-cols-4 gap-2 h-[400px] lg:h-[500px]">
        {/* Main Image */}
        <div 
          className="col-span-4 lg:col-span-3 relative cursor-pointer group"
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={galleryImages[activeIndex]}
            alt={`${propertyName} - Image ${activeIndex + 1}`}
            fill
            className="object-cover rounded-lg"
            priority
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Expand className="h-10 w-10 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Navigation Arrows */}
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-full text-white text-sm">
            {activeIndex + 1} / {galleryImages.length}
          </div>

          {/* View All Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowGrid(true); setLightboxOpen(true) }}
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white px-4 py-2 rounded-lg text-black text-sm font-medium flex items-center gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            View All ({galleryImages.length})
          </button>
        </div>

        {/* Thumbnail Strip (Desktop) */}
        <div className="hidden lg:flex flex-col gap-2">
          {galleryImages.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`relative flex-1 rounded-lg overflow-hidden border-2 transition-colors ${
                activeIndex === index ? "border-[#C9A962]" : "border-transparent hover:border-white/30"
              }`}
            >
              <Image
                src={image}
                alt={`${propertyName} - Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
              {index === 3 && galleryImages.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-medium">+{galleryImages.length - 4}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setShowGrid(!showGrid) }}
                className={`p-2 rounded-lg transition-colors ${showGrid ? "bg-white/20" : "hover:bg-white/10"}`}
              >
                <Grid3X3 className="h-5 w-5 text-white" />
              </button>
              <span className="text-white">{propertyName}</span>
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            {showGrid ? (
              /* Grid View */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-6xl">
                {galleryImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => { setActiveIndex(index); setShowGrid(false) }}
                    className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 ring-[#C9A962]"
                  >
                    <Image
                      src={image}
                      alt={`${propertyName} - ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : (
              /* Single Image View */
              <div className="relative w-full h-full max-w-5xl">
                <Image
                  src={galleryImages[activeIndex]}
                  alt={`${propertyName} - Image ${activeIndex + 1}`}
                  fill
                  className="object-contain"
                />
                
                {/* Navigation */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={goToPrev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Thumbnail Strip (Bottom) */}
          {!showGrid && galleryImages.length > 1 && (
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2 overflow-x-auto justify-center">
                {galleryImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeIndex === index ? "border-[#C9A962]" : "border-transparent hover:border-white/30"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
