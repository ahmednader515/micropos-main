import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      phone?: string
      role?: string
    }
  }

  interface User {
    id: string
    phone: string
    name?: string | null
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    phone?: string
  }
}
