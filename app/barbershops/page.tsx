import { BarbershopItem } from "../_components/barbershop-item"
import { Header } from "../_components/header"
import { Search } from "../_components/search"
import { db } from "../_lib/prisma"

interface BarberShopsPageProps {
  searchParams: {
    title?: string
    service?: string
  }
}

export default async function BarberShopsPage({
  searchParams,
}: BarberShopsPageProps) {
  const barberShops = await db.barberShop.findMany({
    where: {
      OR: [
        searchParams?.title
          ? {
              name: {
                contains: searchParams?.title,
                mode: "insensitive",
              },
            }
          : {},
        searchParams?.service
          ? {
              services: {
                some: {
                  name: {
                    contains: searchParams?.service,
                    mode: "insensitive",
                  },
                },
              },
            }
          : {},
      ],
    },
  })

  return (
    <div>
      <Header />
      <div className="my-6 px-5">
        <Search />
      </div>
      <div className="px-5">
        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
          Resultados para {searchParams?.title || searchParams?.service}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {barberShops.map((barberShop) => (
            <BarbershopItem key={barberShop.id} barbershop={barberShop} />
          ))}
        </div>
      </div>
    </div>
  )
}
