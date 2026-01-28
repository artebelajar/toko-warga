import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema.js";

process.loadEnvFile();

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });

// export default db;