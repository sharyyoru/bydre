// Client-only helpers for capturing a check-in selfie and geolocation.

export interface GeoResult {
  lat: number | null
  lng: number | null
  error?: string
}

const MAX_DIM = 640

/** Request a single geolocation fix. Resolves with nulls if denied/unavailable. */
export function getGeolocation(timeoutMs = 8000): Promise<GeoResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ lat: null, lng: null, error: "Geolocation not supported" })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => resolve({ lat: null, lng: null, error: err.message }),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60000 }
    )
  })
}

/** Start a webcam stream (front camera preferred). */
export async function startCamera(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
    audio: false,
  })
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}

/** Capture a downscaled JPEG data URL from a live <video> element. */
export function captureFrame(video: HTMLVideoElement): string {
  const w = video.videoWidth || 640
  const h = video.videoHeight || 480
  const scale = Math.min(1, MAX_DIM / Math.max(w, h))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", 0.8)
}
