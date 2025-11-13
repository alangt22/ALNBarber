"use client"

import { Header } from "@/app/_components/header"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useTransition, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Loader2, X } from "lucide-react"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { updateBarbershop } from "@/app/_actions/edit-barbershop"
import { ImageUploadField } from "@/app/_components/_inputComponents/ImageUploadField"

import { PhoneListInput } from "@/app/_components/_inputComponents/phone-list-input"
import { cn } from "@/app/_lib/utils"
import { BarberListInput } from "@/app/_components/_inputComponents/barber-list-input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const formSchema = z.object({
  name: z.string().nonempty("O nome é obrigatório"),
  address: z.string().nonempty("O endereço é obrigatório"),
  phones: z.array(z.string()).min(1, "Informe ao menos um telefone"),
  barbers: z.array(z.string()).min(1, "Informe ao menos um barbeiro"),
  description: z.string().optional().or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

const WEEK_DAYS = [
  { key: "sunday", label: "Dom" },
  { key: "monday", label: "Seg" },
  { key: "tuesday", label: "Ter" },
  { key: "wednesday", label: "Qua" },
  { key: "thursday", label: "Qui" },
  { key: "friday", label: "Sex" },
  { key: "saturday", label: "Sáb" },
]

export default function EditBarbershopForm() {
  const router = useRouter()
  const session = useSession()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  const [imageUrl, setImageUrl] = useState("")
  const [imagePreview, setImagePreview] = useState("")

  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [newTime, setNewTime] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  // 🔹 Busca dados existentes
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/get-my-barbershop")
      const data = await res.json()

      if (data) {
        reset({
          name: data.name,
          address: data.address,
          phones: data.phones || [],
          description: data.description ?? "",
          barbers: data.barbers || [],
        })
        setImageUrl(data.imageUrl || "")
        setImagePreview(data.imageUrl || "")
        setSelectedDays(data.workingDays || [])
        setSelectedTimes(data.timeSlots || [])
      }
      setIsLoading(false)
    }

    fetchData()
  }, [reset])

  // 🔹 Alternar seleção de dias
  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  // 🔹 Adicionar horário manual
  const handleAddTime = () => {
    if (!newTime) return
    if (!/^\d{2}:\d{2}$/.test(newTime)) return alert("Use o formato HH:mm")
    if (selectedTimes.includes(newTime)) return alert("Horário já adicionado")

    setSelectedTimes((prev) =>
      [...prev, newTime].sort((a, b) => {
        const [ah, am] = a.split(":").map(Number)
        const [bh, bm] = b.split(":").map(Number)
        return ah === bh ? am - bm : ah - bh
      }),
    )
    setNewTime("")
  }

  const handleRemoveTime = (time: string) => {
    setSelectedTimes((prev) => prev.filter((t) => t !== time))
  }

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
       const barbershop = await updateBarbershop({
          userId: session.data?.user.id as string,
          name: data.name,
          address: data.address,
          phones: data.phones,
          imageUrl: imageUrl || "",
          description: data.description || "",
          workingDays: selectedDays,
          timeSlots: selectedTimes,
          barbers: data.barbers,
        })

        if(!barbershop?.id) throw new Error("Barbearia nao encontrada")

        router.push(`/dashboard/${barbershop.id}`)

        toast.success("✅ Barbearia atualizada com sucesso!")
      } catch (err: any) {
        alert(`❌ Erro: ${err.message}`)
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="mx-auto mt-10 max-w-2xl space-y-6 p-6">
        <h1 className="text-3xl font-bold">Editar Barbearia</h1>
        <p className="text-muted-foreground">
          Atualize as informações da sua barbearia
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Upload de imagem */}
          <ImageUploadField
            imagePreview={imagePreview}
            onUploadComplete={(url) => {
              setImageUrl(url)
              setImagePreview(url)
            }}
            onClear={() => {
              setImageUrl("")
              setImagePreview("")
            }}
          />

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <Input placeholder="Ex: Barber do Alan" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium">Endereço</label>
            <Input placeholder="Rua Exemplo, 123" {...register("address")} />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          {/* Telefones */}
          <div>
            <label className="block text-sm font-medium">Telefones</label>
            <PhoneListInput
              value={watch("phones") || []}
              onChange={(phones) => setValue("phones", phones)}
            />
            {/* Barbeiros */}
            <div className="space-y-2 mt-5">
              <label className="block text-sm font-medium">Barbeiros</label>
              <BarberListInput
               value={watch("barbers") || []}
               onChange={(barbers) => setValue("barbers", barbers)}
              />
            </div>

            {errors.phones && (
              <p className="text-sm text-red-500">{errors.phones.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium">Descrição</label>
            <textarea
              {...register("description")}
              className="min-h-[100px] w-full rounded-md border bg-background p-3"
              placeholder="Ex: Barbearia moderna com atendimento premium..."
            />
          </div>

          {/* Dias de funcionamento */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Dias de funcionamento
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => (
                <Button
                  key={day.key}
                  type="button"
                  variant={
                    selectedDays.includes(day.key) ? "default" : "outline"
                  }
                  className={cn("rounded-full px-3 text-sm")}
                  onClick={() => toggleDay(day.key)}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Horários */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Horários disponíveis
            </label>

            <div className="mb-3 flex items-center gap-2">
              <Input
                placeholder="HH:mm"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-28"
              />
              <Button type="button" onClick={handleAddTime} variant="secondary">
                Adicionar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedTimes.map((time) => (
                <div
                  key={time}
                  className="flex items-center rounded-full bg-secondary px-3 py-1 text-sm"
                >
                  <span>{time}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTime(time)}
                    className="ml-2 text-xs text-muted-foreground hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {selectedTimes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum horário adicionado
                </p>
              )}
            </div>
          </div>

          {/* Botão salvar */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </form>
      </div>
    </>
  )
}
