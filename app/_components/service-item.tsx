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
import { useEffect, useState } from "react"
import { format, set } from "date-fns"
import { createBooking } from "../_actions/create-booking"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getBookings } from "../_actions/get-booking"
import { Dialog, DialogContent } from "./ui/dialog"
import { SiginDialog } from "./sigin-dialog"

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

const getTimeList = (bookings: Booking[]) => {
  const timeList = TIME_LIST.filter((time) => {
    const hour = Number(time.split(":")[0])
    const minute = Number(time.split(":")[1])
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
      setSignInDialogIsOpen(true)
      return
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
                      {getTimeList(dayBookings).map((time) => (
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
                      ))}
                    </div>
                  )}

                  {selectedTime && selectedDate && (
                    <div className="p-5">
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
                            <p className="text-sm">{selectedTime}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <h2 className="text-sm text-gray-400">Barbearia</h2>
                            <p className="text-sm">{barbershop?.name}</p>
                          </div>
                        </CardContent>
                      </Card>
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
