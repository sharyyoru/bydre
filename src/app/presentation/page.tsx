import type { Metadata } from "next"
import { cookies } from "next/headers"
import { PresentationDeck } from "@/components/presentation/presentation-deck"
import { PresentationGate } from "@/components/presentation/presentation-gate"
import { cookieName, hasPresentationAccess } from "@/lib/presentation-access"

export const metadata: Metadata = { title: "DreHomes Marketing Team Playbook", robots: { index: false, follow: false } }

export default function PresentationPage() {
  const allowed = hasPresentationAccess(cookies().get(cookieName)?.value)
  return allowed ? <PresentationDeck /> : <PresentationGate />
}
