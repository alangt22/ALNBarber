/* import { BarberShop } from "@prisma/client"
import { Card, CardContent } from "../ui/card"
import Image from "next/image"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { StarIcon } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/_lib/auth"

interface BarbershopItemProps {
  barbershop: BarberShop
}

export async function BarbershopItem({ barbershop }: BarbershopItemProps) {
  const session = await getServerSession(authOptions)
  return (
    <Card className="roun-2xl min-w-[167px]">
      <CardContent className="p-0 px-1 pb-2 pt-1">
        <div className="relative h-[159px] w-full">
          <Image
            fill
            className="rounded-2xl object-cover"
            src={barbershop.imageUrl || ""}
            alt={barbershop.name}
          />

          <Badge
            className="absolute left-2 top-2 space-x-1"
            variant="secondary"
          >
            <StarIcon size={12} className="fill-primary" />
            <p className="text-xs font-semibold">5,0</p>
          </Badge>
        </div>

        <div className="px-1 py-3">
          <h3 className="truncate font-semibold">{barbershop.name}</h3>
          <p className="truncate text-sm text-gray-400">{barbershop.address}</p>
          {session?.user.role === "USER" ? (
            <Button
              variant="secondary"
              className="mt-3 w-full hover:bg-primary"
              asChild
            >
              <Link href={`/barbershops/${barbershop.id}`}>Reservar</Link>
            </Button>
          ) : session?.user.role === "BARBER" ? (
            <Button
              variant="secondary"
              className="mt-3 w-full hover:bg-primary"
              asChild
            >
              <Link href={`/dashboard/${barbershop.id}`}>Dashboard</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
 */



import { BarberShop } from "@prisma/client"
import { Card, CardContent } from "../ui/card"
import Image from "next/image"
import { Badge } from "../ui/badge"
import { StarIcon } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/_lib/auth"
import { ActionButton } from "../_buttonReservar-Dashbard/action-button"


interface BarbershopItemProps {
  barbershop: BarberShop
}

export async function BarbershopItem({ barbershop }: BarbershopItemProps) {
  const session = await getServerSession(authOptions)

  return (
    <Card className="roun-2xl min-w-[167px]">
      <CardContent className="p-0 px-1 pb-2 pt-1">
        <div className="relative h-[159px] w-full">
          <Image
            fill
            className="rounded-2xl object-cover"
            src={barbershop.imageUrl || ""}
            alt={barbershop.name}
          />

          <Badge
            className="absolute left-2 top-2 space-x-1"
            variant="secondary"
          >
            <StarIcon size={12} className="fill-primary" />
            <p className="text-xs font-semibold">5,0</p>
          </Badge>
        </div>

        <div className="px-1 py-3">
          <h3 className="truncate font-semibold">{barbershop.name}</h3>
          <p className="truncate text-sm text-gray-400">{barbershop.address}</p>

          {session?.user.role === "USER" ? (
            <ActionButton
              href={`/barbershops/${barbershop.id}`}
              label="Reservar"
              variant="secondary"
            />
          ) : session?.user.role === "BARBER" ? (
            <ActionButton
              href={`/dashboard/${barbershop.id}`}
              label="Dashboard"
              variant="secondary"
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
