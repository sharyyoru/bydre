"use client"

import { ReactNode } from "react"

// Simplified wallet provider - RainbowKit has dependency issues
// For now, we'll use a mock provider and add real wallet connect later
export function WalletProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// Mock ConnectButton for compatibility
export function MockConnectButton({ children }: { children?: ReactNode }) {
  return <>{children}</>
}
