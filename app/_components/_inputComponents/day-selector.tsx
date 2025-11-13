"use client"

import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"



interface DaysSelectorProps {
  selectedDays: string[]
  onChange: (days: string[]) => void
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Segunda-feira" },
  { value: "tuesday", label: "Terça-feira" },
  { value: "wednesday", label: "Quarta-feira" },
  { value: "thursday", label: "Quinta-feira" },
  { value: "friday", label: "Sexta-feira" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
]

export function DaysSelector({ selectedDays, onChange }: DaysSelectorProps) {
  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day))
    } else {
      onChange([...selectedDays, day])
    }
  }

  return (
    <div className="space-y-3">
      {DAYS_OF_WEEK.map((day) => (
        <div key={day.value} className="flex items-center space-x-2">
          <Checkbox
            id={day.value}
            checked={selectedDays.includes(day.value)}
            onCheckedChange={() => handleDayToggle(day.value)}
          />
          <Label htmlFor={day.value} className="text-sm font-normal cursor-pointer">
            {day.label}
          </Label>
        </div>
      ))}
    </div>
  )
}
