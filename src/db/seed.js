import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { usersECommerce, categories } from "./schema.js";
import bcrypt from "bcryptjs";

process.loadEnvFile();

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function seed() {
  console.log("Seeding database...");

  const hash = await bcrypt.hash("password123", 10);

  await db
    .insert(usersECommerce)
    .values({
      username: "admin",
      password: hash,
      role: "admin",
    })
    .onConflictDoNothing();

  await db
    .insert(categories)
    .values([{ name: "Makanan" }, { name: "Minuman" }, { name: "Pakaian" }]);

  console.log("Seeding finished. Tekan Ctrl + C untuk keluar.");
  process.exit(0);
}

seed();


