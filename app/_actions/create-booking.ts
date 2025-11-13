"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { addMinutes, startOfDay, endOfDay } from "date-fns"

interface CreateBookingParams {
  serviceId: string
  userId: string
  date: Date
  barberName: string
}

const DAY_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
}

const DAY_NAMES_PT: Record<string, string> = {
  sunday: "Domingo",
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
}

export const createBooking = async ({
  serviceId,
  userId,
  date,
  barberName,
}: CreateBookingParams) => {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Usuário não autenticado.")
  if (session.user.id !== userId) throw new Error("Usuário inválido.")

  // 🔹 Busca serviço com duração e barbearia vinculada
  const service = await db.barberShopService.findUnique({
    where: { id: serviceId },
    include: {
      barbershop: {
        select: {
          name: true,
          workingDays: true,
          timeSlots: true,
          barbers: true,
        },
      },
    },
  })

  if (!service) throw new Error("Serviço não encontrado.")
  const { barbershop } = service

  // 🔹 Valida barbeiro
  if (!barbershop.barbers.includes(barberName)) {
    throw new Error(
      `O barbeiro ${barberName} não pertence à barbearia ${barbershop.name}.`
    )
  }

  const bookingStart = new Date(date)
  const bookingDay = DAY_MAP[bookingStart.getDay()]
  const bookingTime = bookingStart.toTimeString().slice(0, 5)

  // 🔹 Valida se a barbearia funciona nesse dia
  if (!barbershop.workingDays.includes(bookingDay)) {
    throw new Error(
      `A barbearia ${barbershop.name} não funciona aos ${DAY_NAMES_PT[bookingDay]}s.`
    )
  }

  // 🔹 Valida se o horário está dentro dos timeSlots válidos
  if (!barbershop.timeSlots.includes(bookingTime)) {
    throw new Error(`Horário ${bookingTime} não disponível.`)
  }

  // 🔹 Calcula horário de término com base em múltiplos de 30 min
  const slotDuration = 30
  const serviceDuration = service.durationMinutes ?? 30
  const slotsToBlock =
    serviceDuration % slotDuration === 0
      ? serviceDuration / slotDuration
      : Math.ceil(serviceDuration / slotDuration)
  const bookingEnd = addMinutes(bookingStart, slotDuration * slotsToBlock)

  console.log(
    `🕒 Criando agendamento: ${bookingTime} (${serviceDuration}min) → termina às ${bookingEnd
      .toTimeString()
      .slice(0, 5)}`
  )

  // 🔹 Busca agendamentos existentes no mesmo dia/barbeiro
  const dayStart = startOfDay(bookingStart)
  const dayEnd = endOfDay(bookingStart)

  const existingBookings = await db.booking.findMany({
    where: {
      barberName,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    include: {
      service: {
        select: { durationMinutes: true },
      },
    },
  })

  // 🔍 Verifica conflito
  const hasConflict = existingBookings.some((existing) => {
    const existingStart = new Date(existing.date)
    const existingDuration = existing.service?.durationMinutes ?? 30
    const existingSlots =
      existingDuration % slotDuration === 0
        ? existingDuration / slotDuration
        : Math.ceil(existingDuration / slotDuration)
    const existingEnd = addMinutes(existingStart, slotDuration * existingSlots)

    const overlap = bookingStart < existingEnd && bookingEnd > existingStart

    if (overlap) {
      console.log(
        `⚠️ CONFLITO: Novo [${bookingTime}–${bookingEnd
          .toTimeString()
          .slice(0, 5)}] colide com [${existingStart
          .toTimeString()
          .slice(0, 5)}–${existingEnd.toTimeString().slice(0, 5)}]`
      )
    }

    return overlap
  })

  if (hasConflict) {
    throw new Error("Este horário entra em conflito com outro agendamento.")
  }

  // ✅ Cria o agendamento
  await db.booking.create({
    data: {
      serviceId,
      userId,
      date: bookingStart,
      barberName,
      serviceDuration,
    },
  })

  revalidatePath("/barbershops/[id]")
  revalidatePath("/bookings")
}
