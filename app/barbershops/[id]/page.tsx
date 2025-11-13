import { ChatWidget } from "@/app/_components/_chat-bot/chat-widget"
import { PhoneItem } from "@/app/_components/phone-item"
import { ServiceItem } from "@/app/_components/service-item"
import { Sidebar } from "@/app/_components/sidebar-sheet"
import { Button } from "@/app/_components/ui/button"
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet"
import { authOptions } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { ChevronLeftIcon, MapPinIcon, MenuIcon, StarIcon } from "lucide-react"
import { getServerSession } from "next-auth"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

interface BarberShopPageProps {
  params: {
    id: string
  }
}

export default async function BarberShopPage({ params }: BarberShopPageProps) {
  const session = await getServerSession(authOptions)

  if (session?.user.role === "BARBER") {
    return notFound()
  }

  const barbershop = await db.barberShop.findUnique({
    where: {
      id: params.id,
    },
    include: {
      services: true,
    },
  })

  if (!barbershop) {
    return notFound()
  }

  const plainBarbershop = {
  ...barbershop,
  services: barbershop.services.map((s) => ({
    ...s,
    price: s.price.toNumber(), // 👈 Converte Decimal -> number
  })),
}

  return (
    <div className="flex w-full flex-col items-center">
      {/* Imagem principal */}
      <div className="relative h-[250px] w-full lg:h-[400px]">
        <Image
          src={barbershop.imageUrl || ""}
          fill
          alt={barbershop.name}
          className="object-cover"
        />

        <Button
          size="icon"
          variant="secondary"
          className="absolute left-4 top-4"
          asChild
        >
          <Link href="/">
            <ChevronLeftIcon />
          </Link>
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="absolute right-4 top-4"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <Sidebar />
        </Sheet>
      </div>

      {/* Container centralizado no desktop */}
      <div className="w-full md:text-center lg:max-w-5xl">
        {/* Dados principais */}
        <div className="border-b border-solid p-5">
          <h1 className="mb-3 text-xl font-bold md:text-3xl">{barbershop.name}</h1>
          <div className="mb-2 flex items-center gap-2 md:justify-center">
            <MapPinIcon className="text-primary" size={18} />
            <p className="text-sm">{barbershop.address}</p>
          </div>

          <div className="flex items-center gap-1 md:justify-center">
            <StarIcon className="fill-primary text-primary" size={18} />
            <p className="text-sm">5,0 (10 avaliações)</p>
          </div>
        </div>

        {/* Sobre nós */}
        <div className="space-y-3 border-b border-solid p-5 lg:px-0">
          <h2 className="text-xs font-bold uppercase text-gray-400">
            Sobre nós
          </h2>
          <p className="text-justify text-sm leading-relaxed">
            {barbershop.description}
          </p>
        </div>

        {/* Lista de serviços */}
        <div className="space-y-3 border-b border-solid p-5 lg:px-0">
          <h2 className="mb-3 text-xs font-bold uppercase text-gray-400">
            Serviços
          </h2>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-6">
            {plainBarbershop.services.map((service) => (
              <ServiceItem
                key={service.id}
                service={{
                  ...service,
                  barbershop: {
                    name: plainBarbershop.name,
                    workingDays: plainBarbershop.workingDays,
                    timeSlots: plainBarbershop.timeSlots,
                    barbers: plainBarbershop.barbers,
                  },
                }}
              />
            ))}
          </div>
        </div>

        {/* Telefones */}
        <div className="space-y-3 p-5 lg:px-0">
          <h2 className="text-xs font-bold uppercase text-gray-400">Contato</h2>
          <div className="flex flex-col gap-2">
            {barbershop.phones.map((phone) => (
              <PhoneItem key={phone} phone={phone} />
            ))}
          </div>
        </div>
      </div>

      {/* Chat (opcional) */}
      {/* <ChatWidget userId={session?.user?.id} barbershopId={barbershop?.id} /> */}
    </div>
  )
}
