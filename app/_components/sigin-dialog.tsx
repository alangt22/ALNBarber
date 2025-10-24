import Image from "next/image"
import { Button } from "./ui/button"
import { DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { signIn } from "next-auth/react"

export function SiginDialog() {
  async function handleLogin() {
    await signIn("google")
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Faça login na plataforma</DialogTitle>
        <DialogDescription>
          Conecte-se usando sua conta do Google.
        </DialogDescription>
      </DialogHeader>
      <Button
        variant="outline"
        className="gap-1 font-bold"
        onClick={handleLogin}
      >
        <Image
          src="/google.svg"
          alt="Fazer login com Google"
          width={18}
          height={18}
        />
        Google
      </Button>
    </>
  )
}
