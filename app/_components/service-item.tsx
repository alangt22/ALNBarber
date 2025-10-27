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
import { isPast, isToday, set } from "date-fns"
import { createBooking } from "../_actions/create-booking"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getBookings } from "../_actions/get-booking"
import { Dialog, DialogContent } from "./ui/dialog"
import { SiginDialog } from "./sigin-dialog"
import { BookingSumary } from "./booking-sumary"

interface ServiceItemProps {
  service: BarberShopService
  barbershop: Pick<BarberShop, "name">
}

const TIME_LIST = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

interface GetTimeListProps {
  bookings: Booking[]
  selectDay: Date
}

const getTimeList = ({ bookings, selectDay }: GetTimeListProps) => {
  const timeList = TIME_LIST.filter((time) => {
    const hour = Number(time.split(":")[0])
    const minute = Number(time.split(":")[1])

    // horarios que ja passaram nao seram exibidos
    const timeIsOnThePast = isPast(
      set(new Date(), { hours: hour, minutes: minute }),
    )
    if (timeIsOnThePast && isToday(selectDay)) {
      return false
    }
    const hasBookingOnCurrentTime = bookings.some(
      (booking) =>
        booking.date.getHours() === hour &&
        booking.date.getMinutes() === minute,
    )
    if (hasBookingOnCurrentTime) {
      return false
    }
    return true
  })

  return timeList
}

export function ServiceItem({ service, barbershop }: ServiceItemProps) {
  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false)
  const { data } = useSession()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [dayBookings, setDayBookings] = useState<Booking[]>([])
  const [bookingsSheetsIsOpen, setBookingsSheetsIsOpen] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      if (!selectedDate) return
      const bookings = await getBookings({
        date: selectedDate,
        serviceId: service.id,
      })
      setDayBookings(bookings)
    }
    fetch()
  }, [selectedDate, service.id])

  function handleBookingClick() {
    if (data?.user) {
      return setBookingsSheetsIsOpen(true)
    }
    return setSignInDialogIsOpen(true)
  }

  function handleOpenBookings() {
    setSelectedDate(undefined)
    setSelectedTime(undefined)
    setDayBookings([])
    setBookingsSheetsIsOpen(false)
  }

  function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date)
  }

  function handleTimeSelect(time: string | undefined) {
    setSelectedTime(time)
  }

  async function handleCreateBooking() {
    try {
      if (!selectedDate || !selectedTime) return

      const hour = Number(selectedTime.split(":")[0])
      const minute = selectedTime.split(":")[1]
      const newDate = set(selectedDate, {
        hours: hour,
        minutes: Number(minute),
      })

      if (!data?.user?.id) return
      await createBooking({
        serviceId: service.id,
        userId: data.user.id,
        date: newDate,
      })
      handleOpenBookings()
      toast.success("Reserva criada com sucesso")
    } catch (error) {
      console.log(error)
      toast.error("Erro ao criar agendamento")
    }
  }

  const timeList = useMemo(() => {
    if (!selectedDate) return []
    return getTimeList({
      bookings: dayBookings,
      selectDay: selectedDate,
    })
  }, [dayBookings, selectedDate])

  return (
    <>
      <Card>
        <CardContent className="flex items-center gap-3 p-3">
          <div className="relative max-h-[110px] min-h-[110px] min-w-[110px] max-w-[110px]">
            <Image
              src={service.imageUrl}
              fill
              alt={service.name}
              className="rounded-lg object-cover"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{service.name}</h3>
            <p className="text-sm text-gray-400">{service.description}</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-primary">
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(service.price))}
              </p>

              <Sheet
                open={bookingsSheetsIsOpen}
                onOpenChange={handleOpenBookings}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBookingClick}
                >
                  Reservar
                </Button>

                <SheetContent className="px-0">
                  <SheetHeader>
                    <SheetTitle>Fazer Reserva</SheetTitle>
                  </SheetHeader>

                  <div className="mx-16 border-b border-solid py-5">
                    <Calendar
                      mode="single"
                      locale={ptBR}
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      fromDate={new Date()}
                      styles={{
                        head_cell: {
                          width: "100%",
                          textTransform: "capitalize",
                        },
                        cell: {
                          width: "100%",
                        },
                        button: {
                          width: "100%",
                        },
                        nav_button_previous: {
                          width: "32px",
                          height: "32px",
                        },
                        nav_button_next: {
                          width: "32px",
                          height: "32px",
                        },
                        caption: {
                          textTransform: "capitalize",
                        },
                      }}
                    />
                  </div>

                  {selectedDate && (
                    <div className="flex gap-3 overflow-x-auto p-5 [&::-webkit-scrollbar]:hidden">
                      {timeList.length > 0 ? (
                        timeList.map((time) => (
                          <Button
                            key={time}
                            variant={
                              selectedTime === time ? "default" : "outline"
                            }
                            className="rounded-full"
                            onClick={() => handleTimeSelect(time)}
                          >
                            {time}
                          </Button>
                        ))
                      ) : (
                        <p className="text-xs">Nenhum horário disponível</p>
                      )}
                    </div>
                  )}

                  {selectedTime && selectedDate && (
                    <div className="p-5">
                      <BookingSumary
                        service={service}
                        barbershop={barbershop}
                        selectedDate={set(selectedDate, {
                          hours: Number(selectedTime.split(":")[0]),
                          minutes: Number(selectedTime.split(":")[1]),
                        })}
                      />
                    </div>
                  )}
                  <SheetFooter className="mt-5 px-5">
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
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={signInDialogIsOpen}
        onOpenChange={(open) => setSignInDialogIsOpen(open)}
      >
        <DialogContent className="w-[90%]">
          <SiginDialog />
        </DialogContent>
      </Dialog>
    </>
  )
}
