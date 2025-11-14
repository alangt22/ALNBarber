"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { addMinutes } from "date-fns"

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

const BRAZIL_OFFSET = "-03:00"

function pad(n: number) {
  return String(n).padStart(2, "0")
}

/**
 * Gera um Date UTC correspondente a uma data local do Brasil.
 * Ex: "2025-11-15 08:00" (BR) -> "2025-11-15 11:00Z"
 */
function buildUtcFromBrazilLocal(
  year: number,
  monthIndex: number, // 0-based
  day: number,
  hour: number,
  minute: number,
  second = 0,
  ms = 0
) {
  const iso = `${year}-${pad(monthIndex + 1)}-${pad(day)}T${pad(
    hour
  )}:${pad(minute)}:${pad(second)}.${String(ms).padStart(3, "0")}${BRAZIL_OFFSET}`
  return new Date(iso)
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

  console.log("📩 RECEBIDO DO FRONT:", {
    serviceId,
    userId,
    date,
    time,
    barberName,
  })

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

  if (!barbershop.barbers.includes(barberName)) {
    throw new Error(
      `O barbeiro ${barberName} não pertence à barbearia ${barbershop.name}.`
    )
  }

  // DATA LOCAL (vinda do front)
  const selectedDate = new Date(date)
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const day = selectedDate.getDate()

  // hora/minuto vindos do front (string "HH:MM")
  const [hour, minute] = time.split(":").map(Number)

  // Convertendo BR → UTC antes de salvar
  const bookingStart = buildUtcFromBrazilLocal(year, month, day, hour, minute)

  console.log("📌 BR → UTC:", {
    br: `${year}-${pad(month + 1)}-${pad(day)} ${time} ${BRAZIL_OFFSET}`,
    utc: bookingStart.toISOString(),
  })

  const bookingTime = time

  // Dia da semana baseado no horário BR (não UTC)
  const bookingDay = DAY_MAP[selectedDate.getDay()] // selecionado pelo usuário

  if (!barbershop.workingDays.includes(bookingDay)) {
    throw new Error(
      `A barbearia ${barbershop.name} não funciona aos ${DAY_NAMES_PT[bookingDay]}s.`
    )
  }

  if (!barbershop.timeSlots.includes(bookingTime)) {
    throw new Error(`Horário ${bookingTime} não disponível.`)
  }

  const slotDuration = 30
  const serviceDuration = service.durationMinutes ?? 30
  const slotsToBlock =
    serviceDuration % slotDuration === 0
      ? serviceDuration / slotDuration
      : Math.ceil(serviceDuration / slotDuration)

  const bookingEnd = addMinutes(bookingStart, slotDuration * slotsToBlock)

  // Dia completo em UTC equivalente ao dia BR selecionado
  const dayStartUtc = buildUtcFromBrazilLocal(year, month, day, 0, 0, 0, 0)
  const dayEndUtc = buildUtcFromBrazilLocal(year, month, day, 23, 59, 59, 999)

  const existingBookings = await db.booking.findMany({
    where: {
      barberName,
      date: { gte: dayStartUtc, lte: dayEndUtc },
    },
    include: { service: { select: { durationMinutes: true } } },
  })

  console.log("📚 AGENDAMENTOS DO DIA:", existingBookings.length)

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
        `⚠️ CONFLITO: Novo [${bookingStart.toISOString()}–${bookingEnd.toISOString()}] vs existente [${existingStart.toISOString()}–${existingEnd.toISOString()}]`
      )
    }
    return overlap
  })

  if (hasConflict) {
    throw new Error("Este horário entra em conflito com outro agendamento.")
  }

  await db.booking.create({
    data: {
      serviceId,
      userId,
      date: bookingStart, // SALVA EM UTC
      barberName,
      serviceDuration,
      time: bookingTime,
    },
  })

  console.log("✅ AGENDAMENTO CRIADO!")

  revalidatePath("/barbershops/[id]")
  revalidatePath("/bookings")
}
