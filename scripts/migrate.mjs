// Applies db/schema.sql to DATABASE_URL. Usage: pnpm db:migrate
import { readFile } from "node:fs/promises"
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL tiada. Salin .env.example ke .env.local dahulu.")
  process.exit(1)
}

const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8")
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean)

const sql = neon(url)
for (const statement of statements) {
  await sql(statement)
  console.log("ok:", statement.split("\n")[0].slice(0, 60))
}
console.log(`Selesai. ${statements.length} statement dilaksanakan.`)
