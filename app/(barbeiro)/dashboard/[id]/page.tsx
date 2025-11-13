// /app/dashboard/page.tsx
import { getServerSession } from "next-auth"

import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/app/_lib/auth"
import Link from "next/link"
import { Button } from "@/app/_components/ui/button"
import { BarbershopBookingsPage } from "../_components/bookings-page"
import { db } from "@/app/_lib/prisma"
import Image from "next/image"
import {
  ChevronLeftIcon,
  MapPinIcon,
  MenuIcon,
  StarIcon,
  UserIcon,
} from "lucide-react"
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet"
import { Sidebar } from "@/app/_components/sidebar-sheet"
import { ServiceItem } from "@/app/_components/service-item"
import { DashboardServicesToggle } from "../_components/dashboard-services"

interface BarberShopPageProps {
  params: {
    id: string
  }
}

export default async function Dashboard({ params }: BarberShopPageProps) {
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

  // 🔽 Converte Decimals em números
  const plainBarbershop = {
    ...barbershop,
    services: barbershop.services.map((service) => ({
      ...service,
      price: service.price.toNumber(), // 👈 Converte Decimal -> number
    })),
  }
  const session = await getServerSession(authOptions)

  // se não estiver logado, redireciona pro login
  if (!session) {
    redirect("/api/auth/signin")
  }

  // se o usuário não for barbeiro, redireciona pro painel de cliente
  if (session.user.role !== "BARBER") {
    redirect("/")
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative h-[250px] w-full">
        <Image
          src={barbershop.imageUrl || ""}
          fill
          alt={barbershop.name}
          className="object-cover"
        />

        <Button
          size="icon"
          variant="secondary"
          className="absolute left-4 top-4 md:left-36 md:top-10"
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
              className="absolute right-4 top-4 md:right-36 md:top-10"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <Sidebar />
        </Sheet>
      </div>

      {/* Conteúdo centralizado no desktop */}
      <div className="mx-auto w-full max-w-4xl">
        {/* Dados principais */}
        <div className="border-b border-solid p-5 md:text-center">
          <div className="flex items-center justify-between md:flex-col md:justify-center md:gap-4">
            <h1 className="mb-3 text-3xl font-bold md:text-5xl">
              {barbershop.name}
            </h1>
            <Button className="w-26 p-1 md:mb-3">
              <Link href="/dashboard/edit-barbershop" className="text-sm">
                Editar Barbearia
              </Link>
            </Button>
          </div>

          <div className="mb-2 flex items-center gap-2 md:justify-center">
            <MapPinIcon className="text-primary" size={18} />
            <p className="text-sm">{barbershop.address}</p>
          </div>

          <div className="flex items-center gap-1 md:justify-center">
            <StarIcon className="fill-primary text-primary" size={18} />
            <p className="text-sm">5,0 (10 avaliações)</p>
          </div>
        </div>

        {/* Barbeiros */}
        <div className="border-b border-solid p-5 md:text-center">
          {barbershop.barbers.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase text-gray-400">
                Nossos barbeiros
              </h2>

              <div className="flex flex-wrap justify-center gap-3">
                {barbershop.barbers.map((barber, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 shadow-sm transition-all hover:shadow-md"
                  >
                    <UserIcon className="text-primary" size={18} />
                    <p className="text-sm font-medium text-foreground">
                      {barber}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sobre nós */}
        <div className="space-y-3 border-b border-solid p-5 md:text-center">
          <h2 className="text-xs font-bold uppercase text-gray-400">
            Sobre nós
          </h2>
          <p className="text-justify text-sm md:text-center">
            {barbershop.description}
          </p>
        </div>

        {/* Reservas e Serviços */}
        <BarbershopBookingsPage />
        <DashboardServicesToggle
          services={plainBarbershop.services}
          barbershopName={plainBarbershop.name}
          workingDays={plainBarbershop.workingDays}
          timeSlots={plainBarbershop.timeSlots}
        />
      </div>
    </div>
  )
}
