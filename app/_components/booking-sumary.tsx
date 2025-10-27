import { format } from "date-fns"
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
