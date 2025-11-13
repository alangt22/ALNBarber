"use client"

import { Loader2 } from "lucide-react"

interface LoaderProps {
  size?: number
  color?: string
}

export function Loader({ size = 20, color = "currentColor" }: LoaderProps) {
  return (
    <div className="flex items-center justify-center w-full">
      <Loader2 className="animate-spin" size={size} color={color} />
    </div>
  )
}
