import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET = "attendance-selfies"

/** Decode a base64 (optionally data-URL) string into a Buffer + mime. */
function decodeBase64(input: string): { buffer: Buffer; mimeType: string } {
  const match = input.match(/^data:([^;]+);base64,(.*)$/)
  const mimeType = match ? match[1] : "image/jpeg"
  const data = match ? match[2] : input
  return { buffer: Buffer.from(data, "base64"), mimeType }
}

/**
 * Upload a check-in/out selfie to the private bucket. Returns the object path,
 * keyed as {workspaceId}/{userId}/... to satisfy storage RLS.
 */
export async function uploadSelfie(
  workspaceId: string,
  userId: string,
  workDate: string,
  which: "in" | "out",
  base64: string
): Promise<string> {
  const admin = createAdminClient()
  const { buffer, mimeType } = decodeBase64(base64)
  const ext = mimeType.includes("png") ? "png" : "jpg"
  const path = `${workspaceId}/${userId}/${workDate}-${which}-${Date.now()}.${ext}`
  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: true,
  })
  if (error) throw new Error(`Selfie upload failed: ${error.message}`)
  return path
}

/** Mint a short-lived signed URL for a stored selfie path. */
export async function signedSelfieUrl(path: string, expiresIn = 300): Promise<string | null> {
  if (!path) return null
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error) return null
  return data.signedUrl
}
