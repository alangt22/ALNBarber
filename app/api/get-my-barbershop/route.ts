/* import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json(null)

  const barbershop = await db.barberShop.findFirst({
    where: { userId: session.user.id },
  })

  return NextResponse.json(barbershop)
}
 */


// app/api/get-my-barbershop/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
  }

  const barbershop = await db.barberShop.findFirst({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      address: true,
      phones: true,
      description: true,
      imageUrl: true,
      workingDays: true,
      timeSlots: true,
      barbers: true,
    },
  })

  if (!barbershop) {
    return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
  }

  return NextResponse.json(barbershop)
}
