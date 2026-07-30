import { Attachment } from "@/lib/dreagent/types"

const MAX_IMAGE_DIM = 1280
/** Total base64 payload cap (~3.5MB) to stay under the serverless body limit. */
export const MAX_TOTAL_BASE64 = 3_500_000

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function downscaleImage(dataUrl: string): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Canvas not supported"))
      ctx.drawImage(img, 0, 0, w, h)
      const out = canvas.toDataURL("image/jpeg", 0.85)
      resolve({ data: out.split(",")[1] || "", mimeType: "image/jpeg" })
    }
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = dataUrl
  })
}

/** Convert a File to a Gemini-ready Attachment (images downscaled to JPEG). */
export async function fileToAttachment(file: File): Promise<Attachment> {
  const dataUrl = await readAsDataUrl(file)
  if (file.type.startsWith("image/")) {
    const { data, mimeType } = await downscaleImage(dataUrl)
    return { kind: "image", name: file.name, mimeType, data }
  }
  return {
    kind: "file",
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    data: dataUrl.split(",")[1] || "",
  }
}

export function totalBase64(attachments: Attachment[]): number {
  return attachments.reduce((sum, a) => sum + (a.data?.length || 0), 0)
}
