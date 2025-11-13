"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface ActionButtonProps {
  href: string
  label: string
  variant?: "default" | "secondary" | "outline"
}

export function ActionButton({ href, label, variant = "default" }: ActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    setIsLoading(true)
    router.push(href)
  }

  return (
    <Button
      variant={variant}
      className="mt-3 w-full flex justify-center items-center"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : label}
    </Button>
  )
}
