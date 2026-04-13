import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

const rootEnvPath = Bun.resolveSync("../../.env", import.meta.dir);

dotenv.config({ path: rootEnvPath });

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
