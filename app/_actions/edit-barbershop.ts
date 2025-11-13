"use server"

import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { revalidatePath } from "next/cache"

interface UpdateBarbershopParams {
  userId: string
  name: string
  address: string
  phones: string[]
  imageUrl: string
  description?: string
  workingDays: string[]
  timeSlots: string[]
  barbers: string[]
}

export const updateBarbershop = async ({
  userId,
  name,
  address,
  phones,
  imageUrl,
  description,
  workingDays,
  timeSlots,
  barbers,
}: UpdateBarbershopParams) => {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (session.user.id !== userId) {
    throw new Error("Você não tem permissão para editar esta barbearia")
  }

  // Verifica se o usuário já tem barbearia
  const existingShop = await db.barberShop.findFirst({
    where: { userId },
  })

  if (!existingShop) {
    throw new Error("Barbearia não encontrada para este usuário")
  }

  // Ordena os horários antes de salvar
  const sortedTimeSlots = [...timeSlots].sort((a, b) => {
    const [ah, am] = a.split(":").map(Number)
    const [bh, bm] = b.split(":").map(Number)
    return ah === bh ? am - bm : ah - bh
  })

  // Atualiza dados
  const barbershop = await db.barberShop.update({
    where: { id: existingShop.id },
    data: {
      name,
      address,
      phones,
      imageUrl,
      description,
      workingDays,
      barbers,
      timeSlots: sortedTimeSlots,
    },
  })

  // Atualiza imagem do perfil do usuário (caso tenha mudado)
  await db.user.update({
    where: { id: userId },
    data: { image: imageUrl },
  })

  revalidatePath("/dashboard/barber")
  return barbershop
}
