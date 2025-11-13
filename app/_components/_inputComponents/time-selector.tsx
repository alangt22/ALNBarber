"use client"

import { useEffect, useState } from "react"
import { Label } from "../ui/label"
import { Button } from "../ui/button"

interface TimeSelectorProps {
  selectedTimes: string[]
  onSelectedTimesChange: (times: string[]) => void
}

export function TimeSelector({ selectedTimes, onSelectedTimesChange }: TimeSelectorProps) {
  const [timeSlots, setTimeSlots] = useState<string[]>([])

  // Gera os horários fixos de 06:00 até 23:00
  const generateTimeSlots = () => {
    const slots: string[] = []
    let current = 6 * 60 // 6:00 em minutos
    const end = 23 * 60 // 23:00 em minutos

    while (current <= end) {
      const h = Math.floor(current / 60)
      const m = current % 60
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
      current += 30
    }

    return slots
  }

  // Gera a lista uma vez ao montar
  useEffect(() => {
    setTimeSlots(generateTimeSlots())
  }, [])

  // Alterna seleção de um horário
  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      onSelectedTimesChange(selectedTimes.filter((t) => t !== time))
    } else {
      onSelectedTimesChange([...selectedTimes, time])
    }
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Selecione os horários disponíveis</Label>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {timeSlots.map((time) => {
          const isSelected = selectedTimes.includes(time)
          return (
            <Button
              key={time}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => toggleTime(time)}
              className={`text-sm transition ${
                isSelected ? "bg-primary text-white" : "hover:bg-muted"
              }`}
            >
              {time}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
