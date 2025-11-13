/* "use server"
import { endOfDay, startOfDay } from "date-fns"
import { db } from "../_lib/prisma"

interface GetBookingProps {
  serviceId: string
  date: Date
}

export const getBookings = async ({ date }: GetBookingProps) => {
  const bookings = await db.booking.findMany({
    where: {
      date: {
        lte: endOfDay(date),
        gte: startOfDay(date),
        
      },
    },
  })
  return bookings
}
 */




"use server"
import { endOfDay, startOfDay } from "date-fns"
import { db } from "../_lib/prisma"

interface GetBookingProps {
  date: Date
  serviceId: string
}

export const getBookings = async ({ date }: GetBookingProps) => {
  const bookings = await db.booking.findMany({
    where: {
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
    include: {
      service: {
        select: {
          durationMinutes: true,
        },
      },
    },
  })

  // 🔧 Garante que cada booking tenha a duração correta
  return bookings.map((b) => ({
    ...b,
    serviceDuration: b.serviceDuration || b.service?.durationMinutes || 30,
  }))
}
