"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/app/_components/ui/button"
import { ServiceItem } from "@/app/_components/service-item"
import { Loader } from "@/app/_components/loader"
import { ro } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface DashboardServicesToggleProps {
  services: any[]
  barbershopName: string
  workingDays?: string[]
  timeSlots?: string[]
}

export function DashboardServicesToggle({
  services,
  barbershopName,
  workingDays,
  timeSlots,
}: DashboardServicesToggleProps) {
  7
  const router = useRouter()
  const [showServices, setShowServices] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateService = () => {
    setIsLoading(true)
    router.push("/dashboard/create-service")
  }

  return (
    <div className="space-y-3 border-b border-solid p-5">
      <h2 className="mb-3 text-xl font-bold uppercase text-gray-400">
        Serviços
      </h2>

      <Button onClick={() => setShowServices(!showServices)}>
        {showServices ? "Ocultar Serviços" : "Ver Serviços Cadastrados"}
      </Button>

      {showServices && (
        <div className="grid grid-cols-2 gap-3">
          {services.map((service) => (
            <ServiceItem
              key={service.id}
              service={{
                ...service,
                barbershop: {
                  name: barbershopName,
                  workingDays,
                  timeSlots,
                },
              }}
            />
          ))}


        </div>
        
      )}
                <Button
            className="w-50 relative mt-3 flex items-center justify-center"
            onClick={handleCreateService}
            disabled={isLoading}
          >
            {/* Texto invisível que mantém o tamanho original */}
            <span className="opacity-0">{"Cadastrar Novo Serviço"}</span>

            {/* Loader ou texto real, sobrepostos */}
            <span className="absolute inset-0 flex items-center justify-center">
              {isLoading ? (
                <Loader color="white" size={20} />
              ) : (
                "Cadastrar Novo Serviço"
              )}
            </span>
          </Button>
    </div>
  )
}
