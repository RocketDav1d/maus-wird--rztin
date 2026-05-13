import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "../lib/db/schema";

const url = process.env.DATABASE_URL;
const email = process.env.SEED_USER_EMAIL;
const password = process.env.SEED_USER_PASSWORD;

if (!url) throw new Error("DATABASE_URL not set");
if (!email) throw new Error("SEED_USER_EMAIL not set");
if (!password) throw new Error("SEED_USER_PASSWORD not set");

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client);

async function main() {
  const passwordHash = await bcrypt.hash(password!, 12);
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email!))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.email, email!));
    console.log(`Updated password for ${email}.`);
  } else {
    await db.insert(users).values({ email: email!, passwordHash });
    console.log(`Created user ${email}.`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
