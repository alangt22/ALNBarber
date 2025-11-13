"use client"

import { Button } from "./ui/button"
import {
  Calendar1Icon,
  HomeIcon,
  LogInIcon,
  LogOutIcon,
  Pencil,
  Scissors,
} from "lucide-react"
import { SheetClose, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"
import { quickSearchOptions } from "../_constants/search"
import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarImage } from "./ui/avatar"
import { SiginDialog } from "./sigin-dialog"
import { NameDialog } from "./_inputComponents/name-dialog"
import { useState } from "react"

export function Sidebar() {
  const { data } = useSession()
  const [openNameDialog, setOpenNameDialog] = useState(false)
  async function handleLogout() {
    await signOut({ callbackUrl: "/" })
  }

  // captura o primeiro ID da barbearia associada ao usuário (caso exista)
  const barberShopId = data?.user?.barbershopId?.[0]

  return (
    <SheetContent className="overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="text-left">Menu</SheetTitle>
      </SheetHeader>

      {/* Header com dados do usuário */}
      <div className="flex items-center justify-between gap-3 border-b border-solid py-5">
        {data?.user ? (
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={data?.user?.image ?? ""} />
            </Avatar>

            <div>
              <Dialog open={openNameDialog} onOpenChange={setOpenNameDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="link"
                    className="text-default flex items-center gap-1 p-0 font-bold no-underline transition-colors hover:text-primary/80 hover:no-underline"
                  >
                    <p>{data?.user?.name}</p>
                    <span className="text-sm text-gray-500">(editar)</span>
                    <Pencil className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90%]">
                  <NameDialog onClose={() => setOpenNameDialog(false)} />
                </DialogContent>
              </Dialog>
              <p className="text-xs">{data?.user?.email}</p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-bold">Olá, faça seu login!</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon">
                  <LogInIcon />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90%]">
                <SiginDialog />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {/* Menu de navegação */}
      <div className="flex flex-col gap-1 border-b border-solid p-5 py-5">
        <SheetClose asChild>
          <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/">
              <HomeIcon size={18} />
              Início
            </Link>
          </Button>
        </SheetClose>

        {data?.user.role === "USER" && (
          <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/bookings">
              <Calendar1Icon size={18} />
              Agendamentos
            </Link>
          </Button>
        )}

        {/* Painel da barbearia com ID dinâmico */}
        {data?.user?.role === "BARBER" && data?.user?.barbershopId && (
          <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href={`/dashboard/${data.user.barbershopId}`}>
              <Scissors size={18} />
              Painel da barbearia
            </Link>
          </Button>
        )}
      </div>

      {/* Opções rápidas para o cliente */}
      {data?.user.role === "USER" && (
        <div className="flex flex-col gap-1 border-b border-solid p-5 py-5">
          {quickSearchOptions.map((option) => (
            <Button
              className="justify-start gap-2"
              variant="ghost"
              key={option.title}
              asChild
            >
              <Link href={`/barbershops?service=${option.title}`}>
                <Image
                  src={option.imageUrl}
                  alt={option.title}
                  width={18}
                  height={18}
                />
                {option.title}
              </Link>
            </Button>
          ))}
        </div>
      )}

      {/* Logout */}
      <div className="flex flex-col gap-2 p-5 py-5">
        {data?.user && (
          <Button
            variant="ghost"
            className="justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOutIcon size={18} />
            Sair da conta
          </Button>
        )}
      </div>
    </SheetContent>
  )
}
