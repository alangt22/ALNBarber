"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/app/_components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BookingItem } from "@/app/_components/_cardBooking/booking-item"
import { Header } from "@/app/_components/header"

interface Booking {
  id: string
  date: string
  user: {
    name: string | null
    email: string
  }
  service: {
    name: string
    price: number
    barbershop: {
      name: string
      imageUrl: string | null
      address: string
      phones: string[]
    } | null
  }
}

export function BarbershopBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  // Gerar lista de meses (últimos 6 meses + próximos 6 meses)
  const generateMonthOptions = () => {
    const options = []
    const now = new Date()

    for (let i = -6; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const label = format(date, "MMMM 'de' yyyy", { locale: ptBR })
      options.push({ value, label })
    }

    return options
  }

  const monthOptions = generateMonthOptions()

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/bookings?month=${selectedMonth}`)
        if (response.ok) {
          const data = await response.json()
          setBookings(data)
        }
      } catch (error) {
        console.error("Erro ao buscar agendamentos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [selectedMonth])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Agendamentos da Barbearia</h1>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando agendamentos...
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Nenhum agendamento encontrado para este mês.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingItem
                key={booking.id}
                booking={
                  {
                    ...booking,
                    date: new Date(booking.date),
                  } as any
                }
                showClientName
              />
            ))}
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Total de agendamentos</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-medium">Receita total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(
                    bookings.reduce(
                      (sum, booking) => sum + Number(booking.service.price),
                      0,
                    ),
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
