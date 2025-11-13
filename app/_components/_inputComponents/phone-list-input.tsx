"use client"

import { useState } from "react"
import InputMask from "react-input-mask"
import { X } from "lucide-react"
import { Button } from "../ui/button"


interface PhoneListInputProps {
  value: string[]
  onChange: (value: string[]) => void
}
 
export function PhoneListInput({ value, onChange }: PhoneListInputProps) {
  const [currentPhone, setCurrentPhone] = useState("")

  const handleAddPhone = () => {
    const cleaned = currentPhone.replace(/\D/g, "")
    if (cleaned.length < 10) return // evita telefones incompletos

    const formatted = formatPhone(cleaned)
    if (!value.includes(formatted)) {
      onChange([...value, formatted])
    }
    setCurrentPhone("")
  }

  const handleRemove = (phone: string) => {
    onChange(value.filter((p) => p !== phone))
  }

  const formatPhone = (num: string) => {
    if (num.length === 11)
      return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`
    if (num.length === 10)
      return `(${num.slice(0, 2)}) ${num.slice(2, 6)}-${num.slice(6)}`
    return num
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      handleAddPhone()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <InputMask
          mask="(99) 99999-9999"
          maskChar={null}
          value={currentPhone}
          onChange={(e) => setCurrentPhone(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite o telefone e pressione Enter"
          className="flex-1 rounded-md border px-3 py-2 text-sm bg-transparent"
        />
        <Button type="button" variant="outline" onClick={handleAddPhone}>
          Adicionar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((phone) => (
          <div
            key={phone}
            className="flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm"
          >
            {phone}
            <button
              type="button"
              onClick={() => handleRemove(phone)}
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
