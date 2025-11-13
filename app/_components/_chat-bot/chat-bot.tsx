 "use client"

import { useState } from "react"

type Message = { role: "user" | "assistant"; content: string }

export function ChatBot({ userId, barbershopId }: { userId?: string; barbershopId?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false) // controla se o chat está aberto

  async function sendMessage() {
    if (!input.trim()) return

    const newMessages: Message[] = [...messages, { role: "user", content: input }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, userId, barbershopId }),
    })

    const data = await res.json()
    setMessages([...newMessages, { role: "assistant", content: data.reply }])
    setLoading(false)
  }

  return (
    <>
    
      {!open && (
        <button
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center text-2xl"
          onClick={() => setOpen(true)}
        >
          💬
        </button>
      )}

      
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 rounded-xl border bg-background shadow-2xl p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-sm">ALN Barber Bot</h2>
            <button className="text-gray-500" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mb-3 space-y-2 max-h-[350px] scrollbar-thin">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-primary text-white self-end ml-auto"
                    : "bg-muted text-foreground self-start"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && <p className="text-sm text-muted-foreground">Digitando...</p>}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2 text-sm text-black"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite aqui..."
            />
            <button
              className="rounded-md bg-primary px-4 py-2 text-white"
              onClick={sendMessage}
              disabled={loading}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
 
