"use client"

import type React from "react"

import { Header } from "@/app/_components/header"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useTransition, useState } from "react"
import { createBarbershop } from "@/app/_actions/create-barbershop"

import { useSession } from "next-auth/react"
import { Upload, Loader2, ImageIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { TimeSelector } from "@/app/_components/_inputComponents/time-selector"
import { DaysSelector } from "@/app/_components/_inputComponents/day-selector"
import { useRouter } from "next/navigation"
import { PhoneListInput } from "@/app/_components/_inputComponents/phone-list-input"
import { BarberListInput } from "@/app/_components/_inputComponents/barber-list-input"
import { toast } from "sonner"

// 🧾 Esquema de validação com telefones como array
const formSchema = z.object({
  name: z.string().nonempty("O nome é obrigatório"),
  address: z.string().nonempty("O endereço é obrigatório"),
  phones: z.array(z.string().nonempty()).min(1, "Informe ao menos um telefone"),
  barbers: z
    .array(z.string().nonempty())
    .min(1, "Informe ao menos um barbeiro"),
  description: z.string().optional().or(z.literal("")),
  workingDays: z
    .array(z.string())
    .min(1, "Selecione ao menos um dia de funcionamento"),
})

type FormData = z.infer<typeof formSchema>

export default function CreateBarbershop() {
  const router = useRouter()
  const session = useSession()
  if (!session.data?.user) {
    router.push("/")
  }

  const [isPending, startTransition] = useTransition()
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workingDays: selectedDays,
      phones: [], // 👈 telefones começam vazios
    },
  })

  const phones = watch("phones") || []
  const barbers = watch("barbers") || []

  const handlePhonesChange = (newPhones: string[]) => {
    setValue("phones", newPhones, { shouldValidate: true })
  }
  const handleBarbersChange = (newBarbers: string[]) => {
    setValue("barbers", newBarbers, { shouldValidate: true })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setImageFile(file)

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.secure_url) {
        setImageUrl(data.secure_url)
      } else {
        alert("❌ Erro ao fazer upload da imagem")
      }
    } catch (error) {
      console.error("Erro no upload:", error)
      alert("❌ Erro ao fazer upload da imagem")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDaysChange = (days: string[]) => {
    setSelectedDays(days)
    setValue("workingDays", days)
  }

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        const barbershop = await createBarbershop({
          userId: session.data?.user.id as string,
          name: data.name,
          address: data.address,
          phones: data.phones, // já vem como array ✅
          barbers: data.barbers,
          role: "BARBER",
          imageUrl: imageUrl || "",
          description: data.description || "",
          workingDays: data.workingDays,
          timeSlots: selectedTimes,
        })

        if (!barbershop?.id) {
          throw new Error("Falha ao criar barbearia (sem ID retornado)")
        }

        reset()
        setImageFile(null)
        setImagePreview("")
        setImageUrl("")
        setSelectedDays([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ])
        router.push(`/dashboard/${barbershop.id}`)
        toast.success("✅ Barbearia criada com sucesso!")
      } catch (err: any) {
        alert(`❌ Erro: ${err.message}`)
      }
    })
  }

  return (
    <>
      <Header />
      <div className="mx-auto mt-10 max-w-2xl space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Criar Barbearia</h1>
          <p className="text-muted-foreground">
            Preencha os dados da sua barbearia
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Upload de imagem */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Imagem da Barbearia
            </label>
            <div className="flex flex-col gap-4">
              {imagePreview ? (
                <div className="relative h-48 w-full overflow-hidden rounded-lg border-2 border-border">
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground">
                  <ImageIcon className="h-12 w-12" />
                  <p className="text-sm">Nenhuma imagem selecionada</p>
                </div>
              )}

              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading}
                />
                <label htmlFor="image-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full cursor-pointer bg-transparent"
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Fazendo upload...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Selecionar imagem do dispositivo
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>

              {imageUrl && (
                <p className="text-xs text-green-600">
                  ✓ Imagem carregada com sucesso
                </p>
              )}
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Nome da Barbearia
            </label>
            <Input placeholder="Ex: Barber do Alan" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Endereço</label>
            <Input
              placeholder="Rua Exemplo, 123 - Bairro"
              {...register("address")}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          {/* Telefones (agora dinâmico e formatado) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Telefones</label>
            <PhoneListInput value={phones} onChange={handlePhonesChange} />
            {errors.phones && (
              <p className="text-sm text-red-500">{errors.phones.message}</p>
            )}
          </div>

          {/* Barbeiros */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Barbeiros</label>
            <BarberListInput value={barbers} onChange={handleBarbersChange} />
            {errors.barbers && (
              <p className="text-sm text-red-500">{errors.barbers.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Descrição (opcional)
            </label>
            <textarea
              placeholder="Ex: Barbearia moderna com atendimento premium..."
              {...register("description")}
              className="min-h-[100px] w-full resize-none rounded-md border bg-background p-3 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Dias */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Dias de Funcionamento
            </label>
            <div className="rounded-lg border bg-card p-4">
              <DaysSelector
                selectedDays={selectedDays}
                onChange={handleDaysChange}
              />
            </div>
            {errors.workingDays && (
              <p className="text-sm text-red-500">
                {errors.workingDays.message}
              </p>
            )}
          </div>

          {/* Horários */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Horário de Funcionamento
            </label>
            <div className="rounded-lg border bg-card p-4">
              <TimeSelector
                selectedTimes={selectedTimes}
                onSelectedTimesChange={setSelectedTimes}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || isUploading}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Barbearia"
            )}
          </Button>
        </form>
      </div>
    </>
  )
}
