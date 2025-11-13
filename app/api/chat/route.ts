import { NextResponse } from "next/server"
import { db } from "@/app/_lib/prisma"

type ChatSession = {
  step: "idle" | "askService" | "askDate" | "askTime" | "askBarber"
  barbershopId?: string
  serviceId?: string
  barberName?: string
  date?: string
  time?: string
}

const sessions = new Map<string, ChatSession>()

function extractTime(text: string): string | null {
  const match = text.match(/\b([01]?\d|2[0-3])(?::|h)?([0-5]\d)?\b/)
  if (!match) return null
  const hour = match[1]
  const minute = match[2] ?? "00"
  return `${hour.length === 1 ? "0" + hour : hour}:${minute}`
}

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json()
    const userKey = userId || `anon-${crypto.randomUUID()}`
    const userMessageRaw = messages[messages.length - 1]?.content || ""
    const userMessage = userMessageRaw.toLowerCase()

    let session = sessions.get(userKey) ?? { step: "idle" }

    // ============================================================
    // 1️⃣ Listar barbearias abertas hoje
    // ============================================================
    if (
      (userMessage.includes("barbearia") || userMessage.includes("barbearias")) &&
      (userMessage.includes("disponível") ||
        userMessage.includes("disponíveis") ||
        userMessage.includes("aberta") ||
        userMessage.includes("abertas") ||
        userMessage.includes("hoje") ||
        userMessage.includes("ver barbearias") ||
        userMessage.includes("ver barbearia"))
    ) {
      const today = new Date()
      const daysOfWeek = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ]
      const todayName = daysOfWeek[today.getDay()]

      // buscar barbearias
      const shops = await db.barberShop.findMany({
        where: { workingDays: { has: todayName } },
        select: { id: true, name: true, address: true, phones: true },
      })

      if (!shops.length) {
        return NextResponse.json({ reply: "Nenhuma barbearia está aberta hoje 😢" })
      }

      const formatted = shops
        .map(
          (shop) =>
            `🏠 ${shop.name}\n📍 ${shop.address}\n📞 ${shop.phones.join(", ")}`
        )
        .join("\n\n")

      return NextResponse.json({
        reply: `Essas barbearias estão abertas hoje:\n\n${formatted}\n\nDigite o nome da barbearia que deseja ver os serviços ✂️`,
      })
    }

    // ============================================================
    // 2️⃣ Usuário escolheu uma barbearia (procura por nome)
    // ============================================================
    // buscar barbearia pelo nome
    // mostra serviços
    const barbershop = await db.barberShop.findFirst({
      where: { name: { mode: "insensitive", contains: userMessage } },
      include: { services: true },
    })

    if (barbershop && session.step === "idle") {
      session = { step: "askService", barbershopId: barbershop.id }
      sessions.set(userKey, session)

      const formattedServices = barbershop.services
        .map((s: { id: string; name: string; price: any }) => `💈 ${s.name} - R$${String(s.price)}`)
        .join("\n")

      return NextResponse.json({
        reply: `Esses são os serviços da ${barbershop.name}:\n\n${formattedServices}\n\nQual serviço você deseja agendar? 💬`,
      })
    }

    // ============================================================
    // 3️⃣ Usuário escolheu um serviço
    // ============================================================
    if (session.step === "askService" && session.barbershopId) {
      const service = await db.barberShopService.findFirst({
        where: {
          barbershopId: session.barbershopId,
          name: { mode: "insensitive", contains: userMessage },
        },
      })

      if (service) {
        session.step = "askDate"
        session.serviceId = service.id
        sessions.set(userKey, session)

        return NextResponse.json({
          reply: `Perfeito! 🧾 ${service.name} selecionado.\n\nQual dia você deseja agendar? (Ex: 08/11/2025) 📅`,
        })
      } else {
        return NextResponse.json({
          reply:
            "Não reconheci esse serviço. Digite o nome exato do serviço que você viu na lista, por exemplo: 'Corte de Cabelo'.",
        })
      }
    }

    // ============================================================
    // 4️⃣ Usuário informou a data — usa workingDays + timeSlots (schema)
    // ============================================================
    if (session.step === "askDate" && session.serviceId) {
      const dateMatch = userMessage.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
      if (!dateMatch) {
        return NextResponse.json({
          reply:
            "Não reconheci a data. Por favor escreva no formato DD/MM/AAAA, ex: 08/11/2025 📅",
        })
      }

      const [_, dayStr, monthStr, yearStr] = dateMatch
      const day = Number(dayStr)
      const month = Number(monthStr)
      const year = Number(yearStr)

      const selectedDate = new Date(year, month - 1, day)
      // valida data no passado
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        return NextResponse.json({
          reply: `Não é possível agendar em uma data passada. Por favor escolha uma data futura (ex: 08/11/2025).`,
        })
      }

      // determina weekday conforme seu schema (lowercase short names)
      const weekday = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][selectedDate.getDay()]

      // busca a barbearia pelo id e pega workingDays e timeSlots (existentes no schema)
      const shop = await db.barberShop.findUnique({
        where: { id: session.barbershopId },
        select: { workingDays: true, timeSlots: true },
      })

      if (!shop) {
        return NextResponse.json({ reply: "Barbearia não encontrada 😢" })
      }

      // Verifica se a barbearia trabalha nesse dia
      if (!shop.workingDays || !shop.workingDays.includes(weekday)) {
        return NextResponse.json({
          reply: `A barbearia não abre nesse dia (${dayStr}/${monthStr}/${yearStr}). Por favor, escolha outra data 📅`,
        })
      }

      // timeSlots do schema deve conter todos os intervals (ex: ["08:00","08:30",...])
      const allTimes = Array.isArray(shop.timeSlots) ? shop.timeSlots : []

      // Busca horários ocupados no dia (bookings)
      const bookings = await db.booking.findMany({
        where: {
          service: {
            barbershopId: session.barbershopId,
          },
          date: {
            gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
            lt: new Date(selectedDate.setHours(23, 59, 59, 999)),
          },
        },
        select: { date: true },
      })

      const taken = bookings.map((b) =>
        new Date(b.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      )

      // Filtra a lista de timeSlots removendo os já ocupados
      const available = allTimes.filter((t) => !taken.includes(t))

      if (available.length === 0) {
        return NextResponse.json({
          reply: `Poxa 😕, não há horários disponíveis para ${dayStr}/${monthStr}/${yearStr}. Tente outro dia!`,
        })
      }

      session.step = "askTime"
      session.date = selectedDate.toISOString()
      sessions.set(userKey, session)

      const formattedTimes = available.join(" | ")

      return NextResponse.json({
        reply: `Ótimo! 📅 ${dayStr}/${monthStr}/${yearStr}.\n\nEsses horários estão disponíveis:\n🕒 ${formattedTimes}\n\nDigite ou clique no horário desejado.`,
      })
    }

    // ============================================================
    // 5️⃣ Usuário informou o horário
    // ============================================================
    if (session.step === "askTime" && session.serviceId && session.date) {
      const time = extractTime(userMessage)
      if (time) {
        session.step = "askBarber"
        session.time = time
        sessions.set(userKey, session)

        const shop = await db.barberShop.findUnique({
          where: { id: session.barbershopId },
          select: { barbers: true },
        })

        const barbersList: string[] = shop?.barbers ?? []

        if (barbersList.length === 0) {
          return NextResponse.json({
            reply: `Horário ${time} registrado.\nNão há barbeiros cadastrados explicitamente. Deseja confirmar o agendamento com "confirmar"?`,
          })
        }

        const formattedBarbers = barbersList.map((b) => `💇 ${b}`).join("\n")

        return NextResponse.json({
          reply: `Perfeito! 🕒 ${time}.\n\nAgora, com qual barbeiro deseja agendar?\n\n${formattedBarbers}`,
        })
      } else {
        return NextResponse.json({
          reply: "Não entendi o horário. Por favor escolha um dos disponíveis, ex: '15:00'.",
        })
      }
    }

    // ============================================================
    // 6️⃣ Usuário escolheu barbeiro → criar agendamento
    // ============================================================
    if (session.step === "askBarber" && session.serviceId && session.time && session.date) {
      const shop = await db.barberShop.findUnique({
        where: { id: session.barbershopId },
        select: { barbers: true, name: true },
      })

      const barbersList: string[] = shop?.barbers ?? []
      const matched = barbersList.find((b) => b.toLowerCase().includes(userMessage))
      const barberName = matched ?? userMessageRaw

      const baseDate = new Date(session.date)
      const [hour, minute] = session.time.split(":").map(Number)
      baseDate.setHours(hour, minute, 0, 0)

      const service = await db.barberShopService.findUnique({
        where: { id: session.serviceId },
      })

      await db.booking.create({
        data: {
          userId: userId || "anonimo",
          serviceId: session.serviceId,
          date: baseDate,
          barberName,
          serviceDuration: service?.durationMinutes ?? 30,
        },
      })

      sessions.delete(userKey)

      return NextResponse.json({
        reply: `✅ Agendamento confirmado!\n\n🏠 Barbearia: ${shop?.name ?? "—"}\n💈 Serviço: ${service?.name ?? "—"}\n✂️ Barbeiro: ${barberName}\n📅 Data: ${baseDate.toLocaleDateString("pt-BR")}\n🕒 Horário: ${session.time}`,
      })
    }

    // ============================================================
    // Fallback
    // ============================================================
    return NextResponse.json({
      reply:
        "Desculpe, não entendi. Pode repetir? (Tente: 'quais barbearias estão abertas hoje')",
    })
  } catch (error) {
    console.error("Erro no chat:", error)
    return NextResponse.json(
      { reply: "Erro interno ao processar o chat." },
      { status: 500 }
    )
  }
}
