
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { ChatBot } from "../_components/_chat-bot/chat-bot"

export default async function ChatPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <ChatBot userId={session?.user?.id} />
    </div>
  )
}
