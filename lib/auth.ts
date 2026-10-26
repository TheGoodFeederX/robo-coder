import { betterAuth } from "better-auth"
import { APIError } from "better-auth/api"
import { Pool } from "pg"

import { canCreateTeacher } from "@/lib/auth-rules"

// better-auth stores users/sessions in the same Neon database as the game data.
// DATABASE_URL is required; without it the app keeps its offline/local mode.

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
})

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    // First run creates the teacher account; no email server is wired up yet.
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    database: { generateId: "uuid" },
  },
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          const { rows } = await pool.query<{ count: number }>('select count(*)::int as count from "user"')
          const rule = canCreateTeacher(rows[0]?.count ?? 0)
          if (!rule.allowed) {
            throw new APIError("FORBIDDEN", { message: rule.message })
          }
        },
      },
    },
  },
})

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>
