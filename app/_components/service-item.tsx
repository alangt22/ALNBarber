"use client"

import { BarberShop, BarberShopService, Booking } from "@prisma/client"
import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import { Calendar } from "./ui/calendar"
import { ptBR } from "date-fns/locale"
import { useEffect, useMemo, useState } from "react"
import { addMinutes, isPast, isToday, set, startOfDay } from "date-fns"
import { createBooking } from "../_actions/create-booking"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getBookings } from "../_actions/get-booking"
import { Dialog, DialogContent } from "./ui/dialog"
import { SiginDialog } from "./sigin-dialog"
import { BookingSumary } from "./_cardBooking/booking-sumary"

interface ServiceItemProps {
  service: {
    id: string
    name: string
    description: string
    imageUrl: string
    price: number // 👈 troque de Decimal para number
    durationMinutes: number
    barbershopId: string
    barbershop: {
      name: string
      timeSlots: string[]
      workingDays: string[]
      barbers: string[]
    }
  }
}
interface BookingWithDuration {
  date: Date
  service?: { durationMinutes: number }
  serviceDuration?: number // pode vir do banco ou da prop
}


interface GetTimeListProps {
  bookings: BookingWithDuration[]
  selectDay: Date
  timeSlots: string[]
  serviceDuration: number
}



export function getTimeList({
  bookings,
  selectDay,
  timeSlots,
  serviceDuration,
}: GetTimeListProps) {
  const now = new Date()
  const slotDuration = 30 // apenas referência se precisar
  console.log("📅 Dia selecionado:", selectDay.toISOString())
  console.log("⏱ Duração do serviço atual:", serviceDuration)

  return timeSlots.filter((time) => {
    const [hour, minute] = time.split(":").map(Number)
    const startTime = set(selectDay, {
      hours: hour,
      minutes: minute,
      seconds: 0,
      milliseconds: 0,
    })

    // término exato sem arredondamentos
    const endTime = addMinutes(startTime, serviceDuration)

    // bloqueia horários passados
    if (isToday(selectDay) && isPast(startTime)) return false
    if (selectDay < new Date(now.setHours(0, 0, 0, 0))) return false

    // verifica conflito: nota importante -> não trata start === existingEnd como overlap
    const hasConflict = bookings.some((b) => {
      const bookingStart = new Date(b.date)
      // usa o valor exato salvo no booking (se tiver)
      const bookedDuration = b.serviceDuration ?? (b.service?.durationMinutes ?? 30)
      const bookingEnd = addMinutes(bookingStart, bookedDuration)

      // overlap estrito: true somente se os intervalos realmente se sobrepõem
      const overlap = startTime < bookingEnd && endTime > bookingStart

      if (overlap) {
        console.log(
          `⚠️ conflito: slot ${time} → existente ${bookingStart.toTimeString().slice(0,5)} - ${bookingEnd.toTimeString().slice(0,5)}; pedido ${startTime.toTimeString().slice(0,5)} - ${endTime.toTimeString().slice(0,5)}`
        )
      }
      return overlap
    })

    if (hasConflict) return false

    console.log(`✅ Slot liberado: ${time}`)
    return true
  })
}


export function ServiceItem({ service }: ServiceItemProps) {
  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false)
  const { data } = useSession()
  const [selectedBarber, setSelectedBarber] = useState<string | undefined>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | undefined>()
  const [dayBookings, setDayBookings] = useState<Booking[]>([])
  const [bookingsSheetsIsOpen, setBookingsSheetsIsOpen] = useState(false)

  // dias bloqueados
  const disabledDays = useMemo(() => {
    const allDays = [0, 1, 2, 3, 4, 5, 6]
    const openDays = service.barbershop?.workingDays.map((d) => d.toLowerCase())
    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }
    return allDays.filter((i) => !openDays?.includes(Object.keys(dayMap)[i]))
  }, [service.barbershop?.workingDays])

  useEffect(() => {
    if (!selectedDate) return
    setDayBookings([])
    setSelectedTime(undefined)

    ;(async () => {
      const bookings = await getBookings({
        date: selectedDate,
        serviceId: service.id,
      })
      // bookings do backend podem ou não incluir info de duração.
      // Aqui garantimos que cada item tem .serviceDuration:
      const mapped = bookings.map((b: any) => ({
        ...b,
        date: new Date(b.date),
        serviceDuration:
          // se o booking já veio com service.durationMinutes
          (b.service && (b.service.durationMinutes ?? b.service.duration)) ??
          // fallback: usar a duração do serviço atual (segurança)
          service.durationMinutes ??
          30,
      }))
      setDayBookings(mapped)
    })()
  }, [selectedDate, service.id, service.durationMinutes])

  function handleDateSelect(date: Date | undefined) {
    if (!date) {
      setSelectedDate(undefined)
      setSelectedTime(undefined)
      return
    }
    setSelectedDate(startOfDay(date))
    setSelectedTime(undefined)
  }

  const handleSheetOpenChange = (open: boolean) => {
    setBookingsSheetsIsOpen(open)
    if (open) {
      setSelectedDate(startOfDay(new Date()))
      setSelectedTime(undefined)
      setDayBookings([])
    } else {
      setSelectedDate(undefined)
      setSelectedTime(undefined)
      setDayBookings([])
    }
  }

  async function handleCreateBooking() {
    try {
      if (!selectedDate || !selectedTime) return
      if (!data?.user?.id) return

      const [hour, minute] = selectedTime.split(":").map(Number)
      const bookingDate = set(selectedDate, {
        hours: hour,
        minutes: minute,
        seconds: 0,
        milliseconds: 0,
      })

      // envia bookingDate direto, sem ajustar fuso manualmente
      await createBooking({
        serviceId: service.id,
        userId: data.user.id,
        date: bookingDate,
        barberName: selectedBarber || "",
        time: selectedTime,
      })

      handleSheetOpenChange(false)
      toast.success("Reserva criada com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar agendamento")
    }
  }

  const timeList = useMemo(() => {
    if (!selectedDate) return []

    // mapeia dayBookings para o formato que getTimeList espera
    const bookingsForList = (dayBookings as any[]).map((b) => ({
      date: new Date(b.date),
      serviceDuration: b.serviceDuration,
    }))

    const list = getTimeList({
      bookings: bookingsForList,
      selectDay: selectedDate,
      timeSlots: service.barbershop.timeSlots,
      serviceDuration: service.durationMinutes ?? 30,
    })

    return list.sort((a, b) => {
      const [ah, am] = a.split(":").map(Number)
      const [bh, bm] = b.split(":").map(Number)
      return ah === bh ? am - bm : ah - bh
    })
  }, [
    dayBookings,
    selectedDate,
    service.barbershop.timeSlots,
    service.durationMinutes,
  ])

  return (
    <>
      <Card>
        <CardContent className="flex-wrap items-center gap-3 p-3">
          <div className="relative h-[110px] w-full">
            <Image
              src={service.imageUrl}
              fill
              alt={service.name}
              className="rounded-lg object-cover"
            />
          </div>

          <div className="space-y-2 w-full h-full">
            <h3 className="text-sm font-semibold">{service.name}</h3>
            <p className="text-sm text-gray-400 line-clamp-3">{service.description}</p>

            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-primary">
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(service.price))}
              </p>
              <span className="ml-2 text-xs text-muted-foreground">
                ⏱ {service.durationMinutes} min
              </span>
            </div>

            <Sheet
              open={bookingsSheetsIsOpen}
              onOpenChange={handleSheetOpenChange}
            >
              {data?.user.role === "USER" && (
                <Button
                  className="lg:ml-0 hover:bg-primary w-full" 
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (data?.user) {
                      handleSheetOpenChange(true)
                    } else {
                      setSignInDialogIsOpen(true)
                    }
                  }}
                >
                  Reservar
                </Button>
              )}

              <SheetContent className="overflow-auto px-0">
                <SheetHeader>
                  <SheetTitle>Fazer Reserva</SheetTitle>
                </SheetHeader>

                <div className="ml-3 border-b border-solid">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    fromDate={new Date()}
                    disabled={(date) => disabledDays.includes(date.getDay())}
                  />
                </div>

                {selectedDate && (
                  <div className="flex gap-3 overflow-x-auto p-3 [&::-webkit-scrollbar]:hidden">
                    {timeList.length > 0 ? (
                      timeList.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          className="rounded-full"
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))
                    ) : (
                      <p className="w-full text-center text-xs">
                        Nenhum horário disponível
                      </p>
                    )}
                  </div>
                )}

                {service.barbershop.barbers?.length > 0 && (
                  <div className="p-2">
                    <p className="mb-2 text-sm font-semibold">Escolha o barbeiro:</p>
                    <div className="flex flex-wrap gap-2">
                      {service.barbershop.barbers.map((barber) => (
                        <Button
                          key={barber}
                          variant={selectedBarber === barber ? "default" : "outline"}
                          onClick={() => setSelectedBarber(barber)}
                          className="rounded-full"
                        >
                          {barber}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDate && selectedTime && (
                  <div className="p-5">
                    <BookingSumary
                      service={service as any}
                      barbershop={service.barbershop as any}
                      selectedDate={set(selectedDate, {
                        hours: Number(selectedTime.split(":")[0]),
                        minutes: Number(selectedTime.split(":")[1]),
                      })}
                      selectedBarber={selectedBarber}
                    />
                  </div>
                )}

                <SheetFooter className="px-5">
                  <SheetClose asChild>
                    <Button
                      type="submit"
                      onClick={handleCreateBooking}
                      disabled={!selectedDate || !selectedTime}
                    >
                      Confirmar
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      <Dialog open={signInDialogIsOpen} onOpenChange={setSignInDialogIsOpen}>
        <DialogContent className="w-[90%]">
          <SiginDialog />
        </DialogContent>
      </Dialog>
    </>
  )
}
