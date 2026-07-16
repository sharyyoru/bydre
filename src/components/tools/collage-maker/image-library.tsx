"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { CollageImage } from "@/lib/collage"
import { validateImageFile, createThumbnail } from "@/lib/collage"
import { toast } from "sonner"

interface ImageLibraryProps {
  images: CollageImage[]
  onImagesAdd: (images: CollageImage[]) => void
  onImageRemove: (id: string) => void
  onImagesReorder: (images: CollageImage[]) => void
  maxImages?: number
}

export function ImageLibrary({
  images,
  onImagesAdd,
  onImageRemove,
  onImagesReorder,
  maxImages = 500,
}: ImageLibraryProps) {
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await processFiles(files)
    e.target.value = ''
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      await processFiles(files)
    },
    []
  )

  const processFiles = async (files: File[]) => {
    const remainingSlots = maxImages - images.length
    if (files.length > remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more images (max ${maxImages})`)
      files = files.slice(0, remainingSlots)
    }

    const validFiles = files.filter((file) => {
      if (!validateImageFile(file)) {
        toast.error(`${file.name} is not a valid image file`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploading(true)
    try {
      const newImages: CollageImage[] = []

      for (const file of validFiles) {
        const thumbnail = await createThumbnail(file)
        newImages.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          thumbnail,
          order: images.length + newImages.length,
        })
      }

      onImagesAdd(newImages)
      toast.success(`Added ${newImages.length} image${newImages.length > 1 ? 's' : ''}`)
    } catch (error) {
      console.error('Error processing images:', error)
      toast.error('Failed to process some images')
    } finally {
      setUploading(false)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      order: idx,
    }))

    onImagesReorder(reorderedImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Images</h3>
          <span className="text-sm text-muted-foreground">
            {images.length} / {maxImages}
          </span>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Drop images here</p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || images.length >= maxImages}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No images added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group cursor-move rounded-lg overflow-hidden border-2 ${
                    draggedIndex === index ? 'border-primary opacity-50' : 'border-border'
                  }`}
                >
                  <div className="aspect-square">
                    <img
                      src={image.thumbnail}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        onImageRemove(image.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
