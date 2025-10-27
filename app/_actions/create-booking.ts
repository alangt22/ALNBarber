"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

interface CreateBookingParams {
  serviceId: string
  userId: string
  date: Date
}
export const createBooking = async ({
  serviceId,
  userId,
  date,
}: CreateBookingParams) => {
  const user = await getServerSession(authOptions)

  if (!user) {
    throw new Error("Usuario nao logado")
  }

  if (user.user.id !== userId) {
    throw new Error("Usuario nao encontrado")
  }

  await db.booking.create({
    data: {
      serviceId,
      userId,
      date,
    },
  })
  revalidatePath("/barbershops/[id]")
  revalidatePath("/bookings")
}
