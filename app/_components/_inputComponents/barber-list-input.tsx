"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "../ui/button"

interface BarberListInputProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function BarberListInput({ value, onChange }: BarberListInputProps) {
  const [currentBarber, setCurrentBarber] = useState("")

  const handleAddBarber = () => {
    const trimmed = currentBarber.trim()
    if (!trimmed) return // evita nome vazio

    // evita duplicados (case insensitive)
    const exists = value.some(
      (b) => b.toLowerCase() === trimmed.toLowerCase()
    )
    if (!exists) {
      onChange([...value, trimmed])
    }

    setCurrentBarber("")
  }

  const handleRemove = (barber: string) => {
    onChange(value.filter((b) => b !== barber))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      handleAddBarber()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={currentBarber}
          onChange={(e) => setCurrentBarber(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite o nome do barbeiro e pressione Enter"
          className="flex-1 rounded-md border px-3 py-2 text-sm bg-transparent"
        />
        <Button type="button" variant="outline" onClick={handleAddBarber}>
          Adicionar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((barber) => (
          <div
            key={barber}
            className="flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm"
          >
            {barber}
            <button
              type="button"
              onClick={() => handleRemove(barber)}
              className="ml-1 text-muted-foreground hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
