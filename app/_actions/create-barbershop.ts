"use server"

import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { revalidatePath } from "next/cache"

interface CreateBarbershopParams {
  userId: string
  name: string
  address: string
  phones: string[]
  barbers: string[]
  role: string
  imageUrl: string
  description: string
  workingDays: string[]
  intervalMinutes?: number
  timeSlots?: string[]
}

function validateHHMM(time: string) {
  if (!/^\d{2}:\d{2}$/.test(time)) return false
  const [h, m] = time.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return false
  if (h < 0 || h > 23) return false
  if (m < 0 || m > 59) return false
  return true
}

function generateTimeSlots(openTime: string, closeTime: string, intervalMinutes = 30) {
  const slots: string[] = []
  const [openH, openM] = openTime.split(":").map(Number)
  const [closeH, closeM] = closeTime.split(":").map(Number)

  let current = openH * 60 + openM
  const end = closeH * 60 + closeM

  // se interval <= 0, fallback para 30
  const interval = intervalMinutes && intervalMinutes > 0 ? intervalMinutes : 30

  while (current < end) {
    const hours = Math.floor(current / 60)
    const minutes = current % 60
    slots.push(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`)
    current += interval
  }

  return slots
}

export const createBarbershop = async ({
  userId,
  name,
  address,
  phones,
  role,
  imageUrl,
  barbers,
  description,
  workingDays,
  timeSlots,
  intervalMinutes = 30,
}: CreateBarbershopParams) => {
  // Autenticação
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error("Usuário não está autenticado.")
  }

  if (session.user.id !== userId) {
    throw new Error("Usuário inválido.")
  }

  // Validações básicas
  if (!name?.trim()) throw new Error("Nome obrigatório.")
  if (!address?.trim()) throw new Error("Endereço obrigatório.")
  if (!phones || phones.length === 0) throw new Error("Informe ao menos um telefone.")
  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    throw new Error("Selecione ao menos um dia de funcionamento.")
  }
 


  const barbershop = await db.barberShop.create({
    data: {
      userId,
      name,
      address,
      phones,
      role,
      imageUrl,
      barbers,
      description,
      workingDays,
      timeSlots
    },
  })

  // Atualiza role do usuário (para BARBER) e imagem do perfil
  await db.user.update({
    where: { id: userId },
    data: {
      role: "BARBER",
      image: imageUrl || undefined,
    },
  })

  revalidatePath("/")
  revalidatePath("/create-barbershop")
  return barbershop

}









