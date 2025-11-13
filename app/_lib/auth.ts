import { PrismaAdapter } from "@auth/prisma-adapter"
import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { db } from "./prisma"
import { Adapter } from "next-auth/adapters"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      const barbershop = await db.barberShop.findFirst({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      })

      session.user = {
        ...session.user,
        id: user.id,
        role: user.role,
        barbershopId: barbershop?.id || null,
      }

      return session
    },
  },
  secret: process.env.NEXT_AUTH_SECRET,
}
