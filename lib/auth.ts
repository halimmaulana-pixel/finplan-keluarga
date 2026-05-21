import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"

const COOKIE_NAME = "finplan_session"
const SALT_ROUNDS = 12

export async function hashPin(pin: string) {
  return bcrypt.hash(pin, SALT_ROUNDS)
}

export async function verifyPin(pin: string, hash: string) {
  return bcrypt.compare(pin, hash)
}

export async function getSession() {
  const cookieStore = await cookies()
  const familyId = cookieStore.get(COOKIE_NAME)?.value
  if (!familyId) return null

  const family = await prisma.family.findUnique({
    where: { id: familyId },
    select: { id: true, name: true },
  })
  return family
}

export async function setSession(familyId: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, familyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 hari
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
