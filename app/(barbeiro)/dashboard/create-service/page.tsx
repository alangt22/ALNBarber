"use client"

import type React from "react"

import { Header } from "@/app/_components/header"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useTransition, useState } from "react"
import { useSession } from "next-auth/react"
import { Upload, Loader2, ImageIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { createService } from "@/app/_actions/create-service"
import { ImageUploadField } from "@/app/_components/_inputComponents/ImageUploadField"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const formSchema = z.object({
  name: z.string().nonempty("O nome é obrigatório"),
  price: z.string().nonempty("O preco é obrigatório"),
  description: z.string().optional().or(z.literal("")),
  durationMinutes: z
    .string()
    .nonempty("A duração é obrigatória")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Informe um número válido",
    ),
})

type FormData = z.infer<typeof formSchema>

export default function CreateBarbershop() {
  const session = useSession()
  const router = useRouter()
  if (!session.data?.user || session.data?.user.role !== "BARBER") {
    router.push("/")
  }

  const [isPending, startTransition] = useTransition()

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        await createService({
          barbershopId: session.data?.user.barbershopId as string,
          name: data.name,
          description: data.description || "",
          price: data.price as unknown as number,
          imageUrl: imageUrl || "",
          durationMinutes: Number(data.durationMinutes),
        })

        
        reset()
        setImageFile(null)
        setImagePreview("")
        setImageUrl("")
        router.push(`/dashboard/${session.data?.user.barbershopId}`)
        toast.success("✅ Serviço criado com sucesso!")
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
          <h1 className="text-3xl font-bold">Cadastro de serviços</h1>
          <p className="text-muted-foreground">Preencha os dados do serviço</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ImageUploadField
            imagePreview={imagePreview}
            onUploadComplete={(url) => {
              setImageUrl(url)
              setImagePreview(url) // salva a preview pra exibir
            }}
            onClear={() => {
              setImageFile(null)
              setImagePreview("")
              setImageUrl("")
            }}
          />

          {/* Nome */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Nome do serviço</label>
            <Input placeholder="Ex: Corte de cabelo..." {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Valor do serviço
            </label>
            <Input placeholder="Ex: R$ 50" {...register("price")} />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>

                    {/* Duração */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Duração (minutos)</label>
            <Input
              placeholder="Ex: 30"
              type="number"
              min="10"
              max="240"
              {...register("durationMinutes")}
            />
            {errors.durationMinutes && (
              <p className="text-sm text-red-500">{errors.durationMinutes.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Descrição (opcional)
            </label>
            <textarea
              placeholder="Ex: Corte de cabelo masculino"
              {...register("description")}
              className="min-h-[100px] w-full resize-none rounded-md border bg-background p-3 focus:outline-none focus:ring-2 focus:ring-ring"
            />
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
              "Cadastrar Serviço"
            )}
          </Button>
        </form>
      </div>
    </>
  )
}
