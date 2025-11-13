
import { Header } from "./_components/header"
import { Button } from "./_components/ui/button"
import Image from "next/image"
import { db } from "./_lib/prisma"
import { BarbershopItem } from "./_components/_cardBarberShop/barbershop-item"
import { quickSearchOptions } from "./_constants/search"
import { BookingItem } from "./_components/_cardBooking/booking-item"
import { Search } from "./_components/_inputComponents/search"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "./_lib/auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Scissors } from "lucide-react"
import { ChatWidget } from "./_components/_chat-bot/chat-widget"
 
export default async function Home() {
  const session = await getServerSession(authOptions)
  const barbershops = await db.barberShop.findMany({})
  const popularBarbershops = await db.barberShop.findMany({
    orderBy: {
      name: "desc",
    },
  })

  const userBarbershop = session?.user
    ? await db.barberShop.findFirst({
        where: { userId: session.user.id },
      })
    : null

  const confirmedBookings = session?.user
    ? await db.booking.findMany({
        where: {
          userId: session?.user.id,
          date: {
            gte: new Date(),
          },
        },
        include: {
          service: {
            include: {
              barbershop: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      })
    : []

  const displayName = userBarbershop?.name || session?.user?.name || "Bem-vindo"

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-7xl p-5 md:px-8 lg:px-12">
        <h2 className="text-xl font-bold md:text-2xl">Olá, {displayName}!</h2>
        <p className="md:text-lg">
          <span className="capitalize">{format(new Date(), "EEEE, dd", { locale: ptBR })}</span>
          <span>&nbsp;de&nbsp;</span>
          <span className="capitalize">{format(new Date(), "MMMM", { locale: ptBR })}</span>
        </p>

        <div className="mt-6 md:max-w-2xl">
          <Search />
        </div>

        <div className="mt-6 flex gap-3 overflow-x-scroll md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
          {quickSearchOptions.map((option) => (
            <Button className="gap-2" variant="secondary" key={option.title} asChild>
              <Link href={`/barbershops?service=${option.title}`}>
                <Image src={option.imageUrl || "/placeholder.svg"} width={16} height={16} alt={option.title} />
                {option.title}
              </Link>
            </Button>
          ))}
        </div>

        <div className="relative mt-6 h-[150px] w-full md:h-[250px] lg:h-[450px]">
          <Image src="/banner.png" alt="Agende nos melhores com ALN Barber" fill className="rounded-xl object-cover" />
        </div>

        {session?.user?.role === "USER" && (
          <div className="mt-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 md:p-8 lg:p-10">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <Scissors className="h-6 w-6 text-primary md:h-8 md:w-8" />
                  <h3 className="text-lg font-bold md:text-2xl">Você é barbeiro?</h3>
                </div>
                <p className="text-sm text-muted-foreground md:text-base">
                  Cadastre sua barbearia na plataforma e comece a gerenciar seus agendamentos de forma profissional.
                  Alcance mais clientes e organize seu negócio!
                </p>
              </div>
              <Button size="lg" className="w-full md:w-auto" asChild>
                <Link href="/create-barbershop">Criar Minha Barbearia</Link>
              </Button>
            </div>
          </div>
        )}

        {confirmedBookings.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400 md:text-sm">Agendamentos</h2>

            <div className="flex gap-3 overflow-x-auto md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
              {confirmedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={JSON.parse(JSON.stringify(booking))} />
              ))}
            </div>
          </>
        )}

        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400 md:text-sm">Recomendados</h2>

        <div className="flex gap-3 overflow-auto md:grid md:grid-cols-2 md:gap-4 md:overflow-visible lg:grid-cols-4 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden">
          {barbershops.map((barbershop) => (
            <BarbershopItem key={barbershop.id} barbershop={barbershop} />
          ))}
        </div>

        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400 md:text-sm">Populares</h2>

        <div className="flex gap-4 overflow-auto md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden">
          {popularBarbershops.map((barbershop) => (
            <BarbershopItem key={barbershop.id} barbershop={barbershop} />
          ))}
        </div>
        {session?.user?.role === "USER" && <ChatWidget userId={session?.user?.id} />}
      </div>
    </div>
  )
}
