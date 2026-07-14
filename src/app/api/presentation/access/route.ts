import { NextRequest, NextResponse } from "next/server"
import { createPresentationToken, cookieName } from "@/lib/presentation-access"

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  if (!process.env.PRESENTATION_PASSWORD || password !== process.env.PRESENTATION_PASSWORD) {
    return NextResponse.json({ error: "Incorrect presentation password" }, { status: 401 })
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieName, createPresentationToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/presentation",
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieName, "", { httpOnly: true, maxAge: 0, path: "/presentation" })
  return response
}
