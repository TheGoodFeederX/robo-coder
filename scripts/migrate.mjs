// Applies db/schema.sql to DATABASE_URL. Usage: pnpm db:migrate
import { readFile } from "node:fs/promises"
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL tiada. Salin .env.example ke .env.local dahulu.")
  process.exit(1)
}

const files = ["../db/schema.sql", "../db/auth-schema.sql"]
const sql = neon(url)
let total = 0

for (const file of files) {
  const schema = await readFile(new URL(file, import.meta.url), "utf8")
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await sql(statement)
    total += 1
  }
  console.log(`${file}: ${statements.length} statement ok`)
}

console.log(`Selesai. ${total} statement dilaksanakan.`)
