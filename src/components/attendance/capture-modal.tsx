"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, MapPin, RefreshCw } from "lucide-react"
import { captureFrame, getGeolocation, startCamera, stopCamera } from "@/lib/attendance/camera"

export interface CaptureResult {
  photo: string | null
  lat: number | null
  lng: number | null
}

interface Props {
  open: boolean
  title: string
  requireSelfie: boolean
  captureGeo: boolean
  submitting: boolean
  onCancel: () => void
  onConfirm: (result: CaptureResult) => void
}

export function CaptureModal({ open, title, requireSelfie, captureGeo, submitting, onCancel, onConfirm }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [camError, setCamError] = useState<string | null>(null)
  const [geo, setGeo] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
  const [geoBusy, setGeoBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setPhoto(null)
    setCamError(null)
    setGeo({ lat: null, lng: null })

    if (captureGeo) {
      setGeoBusy(true)
      getGeolocation().then((g) => {
        setGeo({ lat: g.lat, lng: g.lng })
        setGeoBusy(false)
      })
    }

    let cancelled = false
    if (requireSelfie) {
      startCamera()
        .then((stream) => {
          if (cancelled) {
            stopCamera(stream)
            return
          }
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
          }
        })
        .catch((e) => setCamError(e?.message || "Camera unavailable"))
    }

    return () => {
      cancelled = true
      stopCamera(streamRef.current)
      streamRef.current = null
    }
  }, [open, requireSelfie, captureGeo])

  const takePhoto = () => {
    if (videoRef.current) setPhoto(captureFrame(videoRef.current))
  }

  const confirm = () => {
    onConfirm({ photo, lat: geo.lat, lng: geo.lng })
  }

  const canConfirm = (!requireSelfie || !!photo) && !submitting

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {requireSelfie && (
          <div className="overflow-hidden rounded-xl bg-black/90 aspect-square flex items-center justify-center">
            {camError ? (
              <p className="p-4 text-center text-sm text-white/80">{camError}</p>
            ) : photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Selfie preview" className="h-full w-full object-cover" />
            ) : (
              <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {!captureGeo ? (
            <span>Location not required</span>
          ) : geoBusy ? (
            <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Getting location…</span>
          ) : geo.lat != null ? (
            <span>Location captured ({geo.lat.toFixed(4)}, {geo.lng?.toFixed(4)})</span>
          ) : (
            <span>Location unavailable</span>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
          {requireSelfie && !camError && (
            photo ? (
              <Button variant="outline" onClick={() => setPhoto(null)} disabled={submitting} className="gap-1">
                <RefreshCw className="h-4 w-4" /> Retake
              </Button>
            ) : (
              <Button onClick={takePhoto} className="gap-1">
                <Camera className="h-4 w-4" /> Capture
              </Button>
            )
          )}
          <Button
            onClick={confirm}
            disabled={!canConfirm}
            className="bg-[#0A1628] hover:bg-[#0A1628]/90 gap-1"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
