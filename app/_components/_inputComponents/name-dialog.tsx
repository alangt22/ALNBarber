"use client"

import { useState, useTransition } from "react"
import { useSession } from "next-auth/react"
import { Button } from "../ui/button"
import { DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Input } from "../ui/input"

import { toast } from "sonner" // ou use seu próprio sistema de toast
import { updateUser } from "../../_actions/edit-name"

interface NameDialogProps {
  onClose?: () => void
}

export function NameDialog({ onClose }: NameDialogProps) {
  const { data: session, update } = useSession()
  const [name, setName] = useState(session?.user?.name || "")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Digite um nome válido.")
      return
    }

    startTransition(async () => {
      try {
        await updateUser({
          userId: session?.user?.id!,
          name,
        })

        toast.success("Nome atualizado com sucesso!")

        // Atualiza sessão para refletir novo nome
        await update({ name })
        onClose?.()
      } catch (error: any) {
        toast.error(error.message || "Erro ao atualizar nome.")
      }
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edite seu nome</DialogTitle>
        <DialogDescription>
          Altere o nome exibido no seu perfil.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-3">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Digite seu novo nome"
        />

        <Button
          onClick={handleSubmit}
          disabled={isPending}
          variant="outline"
          className="w-full gap-1 font-bold"
        >
          {isPending ? "Salvando..." : "Editar Nome"}
        </Button>
      </div>
    </>
  )
}
