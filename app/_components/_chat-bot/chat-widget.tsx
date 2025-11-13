/* "use client"

import { useState } from "react"

type Role = "user" | "assistant"
type Message = { role: Role; content: string }

export function ChatWidget({ userId, barbershopId }: { userId?: string; barbershopId?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! 👋 Sou o assistente da Aln Barber.\n\nDeseja ver as barbearias disponíveis ou agendar um horário?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<string[]>([])

  async function sendMessage(content: string) {
    if (!content.trim()) return

    const newMessage: Message = { role: "user", content }
    const newMessages = [...messages, newMessage]
    setMessages(newMessages)
    setInput("")
    setLoading(true)
    setOptions([])

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, userId, barbershopId }),
    })

    const data = await res.json()
    const reply: Message = { role: "assistant", content: data.reply }
    setMessages([...newMessages, reply])

    if (data.options) {
      setOptions(data.options)
    }

    setLoading(false)
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 w-80 rounded-xl border bg-background shadow-2xl p-4 flex flex-col">
      <div className="flex-1 overflow-y-auto mb-3 space-y-2 max-h-[350px] scrollbar-thin">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg text-sm whitespace-pre-line ${
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

      
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => sendMessage(opt)}
              className="text-xs bg-primary text-white px-3 py-1 rounded-full hover:opacity-90 transition"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite aqui..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
        />
        <button
          className="rounded-md bg-primary px-4 py-2 text-white"
          onClick={() => sendMessage(input)}
          disabled={loading}
        >
          →
        </button>
      </div>
    </div>
  )
}
 */



"use client"

import { useState } from "react"

type Role = "user" | "assistant"
type Message = { role: Role; content: string }

export function ChatWidget({
  userId,
  barbershopId,
}: {
  userId?: string
  barbershopId?: string
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! 👋 Sou o assistente da Aln Barber.\n\nDeseja ver as barbearias disponíveis ou agendar um horário?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<string[]>([])

  async function sendMessage(content: string) {
    if (!content.trim()) return

    const newMessage: Message = { role: "user", content }
    const newMessages = [...messages, newMessage]
    setMessages(newMessages)
    setInput("")
    setLoading(true)
    setOptions([])

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, userId, barbershopId }),
    })

    const data = await res.json()
    const reply: Message = { role: "assistant", content: data.reply }
    setMessages([...newMessages, reply])

    if (data.options) setOptions(data.options)
    setLoading(false)
  }

  return (
    <>
      {/* Ícone flutuante do chat */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center text-2xl hover:scale-105 transition"
        >
          💬
        </button>
      )}

      {/* Janela do chat */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 rounded-xl border bg-background shadow-2xl p-4 flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-sm">ALN Barber Bot</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-800 transition"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mb-3 space-y-2 max-h-[350px] scrollbar-thin">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-sm whitespace-pre-line ${
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

          {/* Opções sugeridas */}
          {options.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(opt)}
                  className="text-xs bg-primary text-white px-3 py-1 rounded-full hover:opacity-90 transition"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2 text-sm text-black"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite aqui..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            />
            <button
              className="rounded-md bg-primary px-4 py-2 text-white"
              onClick={() => sendMessage(input)}
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
