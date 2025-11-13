/* import { format } from "date-fns"
import { Card, CardContent } from "./ui/card"
import { BarberShop, BarberShopService } from "@prisma/client"
import { ptBR } from "date-fns/locale"

interface BookingSumaryProps {
  service: Pick<BarberShopService, "name" | "price">
  barbershop: Pick<BarberShop, "name">
  selectedDate: Date
}

export function BookingSumary({
  service,
  barbershop,
  selectedDate,
}: BookingSumaryProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{service.name}</h2>
          <p className="text-sm font-bold">
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(service.price))}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400">Data</h2>
          <p className="text-sm">
            {format(selectedDate, "d 'de' MMMM", {
              locale: ptBR,
            })}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400">Horário</h2>
          <p className="text-sm">{format(selectedDate, "HH:mm")}</p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400">Barbearia</h2>
          <p className="text-sm">{barbershop?.name}</p>
        </div>
      </CardContent>
    </Card>
  )
}
 */

import { Card, CardContent } from "../ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Prisma } from "@prisma/client"
import { Clock } from "lucide-react"

interface BookingSumaryProps {
  service: Prisma.BarberShopServiceGetPayload<{
    include: {
      barbershop: {
        select: {
          name: true
          timeSlots: true
          barbers: true
        }
      }
    }
  }>
  barbershop: Partial<Prisma.BarberShopGetPayload<object>> | null
  selectedDate: Date
  selectedBarber?: string // ✅ nova prop
}

export function BookingSumary({
  service,
  barbershop,
  selectedDate,
  selectedBarber,
}: BookingSumaryProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{service.name}</h2>
          <p className="text-sm font-bold">
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(service.price))}
          </p>
        </div>

        {/* Tempo de duração */}
        {service.durationMinutes && (
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> Duração
            </h2>
            <p className="text-sm">{service.durationMinutes} min</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-muted-foreground">Data</h2>
          <p className="text-sm">
            {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-muted-foreground">Horário</h2>
          <p className="text-sm">
            {format(selectedDate, "HH:mm", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-muted-foreground">Barbearia</h2>
          <p className="text-sm">{barbershop?.name}</p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-muted-foreground">Barbeiro</h2>
          <p className="text-sm">{selectedBarber || "Não selecionado"}</p>
        </div>
      </CardContent>
    </Card>
  )
}
