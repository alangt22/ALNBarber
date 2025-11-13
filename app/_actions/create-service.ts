"use server"

import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

interface CreateServiceParams {
  name: string
  description: string
  price: number
  imageUrl: string
  durationMinutes: number 
  barbershopId: string // obrigatoriamente necessário
}

export const createService = async ({
  name,
  description,
  price,
  imageUrl,
  durationMinutes,
  barbershopId,
}: CreateServiceParams) => {
  const session = await getServerSession(authOptions)

  if (!session) throw new Error("Usuário não logado")

  // 🔹 Garantir que a barbearia pertence ao usuário
  const barbershop = await db.barberShop.findFirst({
    where: { id: barbershopId, userId: session.user.id },
  })

  if (!barbershop) throw new Error("Barbearia não encontrada ou sem permissão")

  // 🔹 Criar serviço conectando com barbearia existente
  await db.barberShopService.create({
    data: {
      name,
      description,
      price,
      imageUrl,
      durationMinutes,
      barbershop: { connect: { id: barbershop.id } },
    },
  })
}
