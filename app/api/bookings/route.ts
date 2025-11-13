/* import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "BARBER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Pegar o parâmetro de mês da query string
    const searchParams = request.nextUrl.searchParams
    const monthParam = searchParams.get("month") // formato: "2025-01"

    if (!monthParam) {
      return NextResponse.json({ error: "Mês não especificado" }, { status: 400 })
    }

    // Parse do mês e ano
    const [year, month] = monthParam.split("-").map(Number)
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))

    // Buscar a barbearia do usuário logado
    const barbershop = await db.barberShop.findFirst({
      where: {
        userId: session.user.id,
      },
    })

    if (!barbershop) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    // Buscar os agendamentos dos serviços dessa barbearia no mês selecionado
    const bookings = await db.booking.findMany({
      where: {
        service: {
          barbershopId: barbershop.id,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error)
    return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 })
  }
}
 */



import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "BARBER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Pegar o parâmetro de mês da query string
    const searchParams = request.nextUrl.searchParams
    const monthParam = searchParams.get("month") // formato: "2025-01"

    if (!monthParam) {
      return NextResponse.json({ error: "Mês não especificado" }, { status: 400 })
    }

    // Parse do mês e ano
    const [year, month] = monthParam.split("-").map(Number)
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))

    // Buscar a barbearia do usuário logado
    const barbershop = await db.barberShop.findFirst({
      where: {
        userId: session.user.id,
      },
    })

    if (!barbershop) {
      return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 })
    }

    // Buscar os agendamentos dos serviços dessa barbearia no mês selecionado
    const bookings = await db.booking.findMany({
      where: {
        service: {
          barbershopId: barbershop.id,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
            price: true,
            barbershop: {
              select: {
                name: true,
                imageUrl: true,
                address: true,
                phones: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error)
    return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 })
  }
}
