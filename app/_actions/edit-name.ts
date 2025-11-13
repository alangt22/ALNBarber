"use server"

import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

interface UpdateUserParams {
  userId: string
  name: string
}

export const updateUser = async ({
  userId,
  name,
}: UpdateUserParams) => {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  if (session.user.id !== userId) {
    throw new Error("Você não tem permissão para editar este usuário")
  }

  // Verifica se o usuário já existe
  const existingUser = await db.user.findFirst({
    where: { id: userId },
  })

  if (!existingUser) {
    throw new Error("Usuário não encontrado")
  }

  // Atualiza dados
  await db.user.update({
    where: { id: existingUser.id },
    data: {
      name,
    },
  })

  return { success: true }
}
