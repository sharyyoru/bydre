import { createHmac, timingSafeEqual } from "crypto"

const cookieName = "presentation_access"

function secret() {
  return process.env.PRESENTATION_COOKIE_SECRET || process.env.PRESENTATION_PASSWORD || ""
}

export function createPresentationToken() {
  const issuedAt = Math.floor(Date.now() / 1000)
  const payload = `dre-presentation:${issuedAt}`
  const signature = createHmac("sha256", secret()).update(payload).digest("hex")
  return `${issuedAt}.${signature}`
}

export function hasPresentationAccess(token?: string) {
  if (!token || !secret()) return false
  const [issuedAt, signature] = token.split(".")
  if (!issuedAt || !signature) return false
  const timestamp = Number(issuedAt)
  if (!Number.isFinite(timestamp) || timestamp < Math.floor(Date.now() / 1000) - 60 * 60 * 12) return false
  const expected = createHmac("sha256", secret()).update(`dre-presentation:${issuedAt}`).digest("hex")
  if (signature.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export { cookieName }
