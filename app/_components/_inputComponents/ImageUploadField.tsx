"use client"

import Image from "next/image"
import { Loader2, Upload, ImageIcon, X } from "lucide-react"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { useState } from "react"

interface ImageUploadFieldProps {
  imagePreview?: string
  onUploadComplete: (url: string) => void
  onClear?: () => void
}

export function ImageUploadField({
  imagePreview,
  onUploadComplete,
  onClear,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => onUploadComplete(reader.result as string)
    reader.readAsDataURL(file)

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
        onUploadComplete(data.secure_url)
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

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Imagem do serviço</label>

      <div className="flex flex-col gap-4">
        {imagePreview ? (
          <div className="relative h-48 w-full overflow-hidden rounded-lg border-2 border-border">
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              className="object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            {onClear && !isUploading && (
              <button
                type="button"
                onClick={onClear}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
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
      </div>
      {imagePreview && (
        <p className="text-xs text-green-600">✓ Imagem carregada com sucesso</p>
      )}
    </div>
  )
}
