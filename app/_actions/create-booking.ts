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
  time: string
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
  time,
}: CreateBookingParams) => {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Usuário não autenticado.")
  if (session.user.id !== userId) throw new Error("Usuário inválido.")

  // LOG 1 — FRONT
  console.log("📩 RECEBIDO DO FRONT:", {
    serviceId,
    userId,
    date,
    time,
    barberName,
  })

  // Buscar serviço
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

  // Validar barbeiro
  if (!barbershop.barbers.includes(barberName)) {
    throw new Error(
      `O barbeiro ${barberName} não pertence à barbearia ${barbershop.name}.`
    )
  }

  // PROCESSAR DATA
  const selectedDate = new Date(date)

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const day = selectedDate.getDate()

  console.log("📆 DATA PROCESSADA:", { year, month, day })

  // CORREÇÃO: usar o horário REAL enviado pelo front
  const [hour, minute] = time.split(":").map(Number)

  const bookingStart = new Date(year, month, day, hour, minute, 0, 0)
  const bookingTime = time

  console.log("🕒 HORÁRIO FINAL MONTADO:", {
    bookingStartLocal: bookingStart.toString(),
    bookingStartISO: bookingStart.toISOString(),
    bookingTime,
  })

  // Descobre dia da semana
  const bookingDay = DAY_MAP[bookingStart.getDay()]
  console.log("📅 Dia detectado:", bookingDay)

  // Validar se barbearia funciona nesse dia
  if (!barbershop.workingDays.includes(bookingDay)) {
    throw new Error(
      `A barbearia ${barbershop.name} não funciona aos ${DAY_NAMES_PT[bookingDay]}s.`
    )
  }

  // Validar horário
  console.log("⏱️ TIME SLOTS DA BARBEARIA:", barbershop.timeSlots)

  if (!barbershop.timeSlots.includes(bookingTime)) {
    console.log("❌ HORÁRIO INVALIDO:", bookingTime)
    throw new Error(`Horário ${bookingTime} não disponível.`)
  }

  // Calcular término do serviço
  const slotDuration = 30
  const serviceDuration = service.durationMinutes ?? 30
  const slotsToBlock =
    serviceDuration % slotDuration === 0
      ? serviceDuration / slotDuration
      : Math.ceil(serviceDuration / slotDuration)

  const bookingEnd = addMinutes(bookingStart, slotDuration * slotsToBlock)

  console.log(
    `🧮 DURAÇÃO: ${serviceDuration}min → termina às ${bookingEnd
      .toTimeString()
      .slice(0, 5)}`
  )

  // Buscar agendamentos do dia
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
      service: { select: { durationMinutes: true } },
    },
  })

  console.log("📚 AGENDAMENTOS DO DIA:", existingBookings.length)

  // Verificar conflito
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
          .slice(0, 5)}] vs existente [${existingStart
          .toTimeString()
          .slice(0, 5)}–${existingEnd.toTimeString().slice(0, 5)}]`
      )
    }

    return overlap
  })

  if (hasConflict) {
    throw new Error("Este horário entra em conflito com outro agendamento.")
  }

  // Criar agendamento
  await db.booking.create({
    data: {
      serviceId,
      userId,
      date: bookingStart,
      barberName,
      serviceDuration,
      time: bookingTime,
    },
  })

  console.log("✅ AGENDAMENTO CRIADO!")

  revalidatePath("/barbershops/[id]")
  revalidatePath("/bookings")
}
