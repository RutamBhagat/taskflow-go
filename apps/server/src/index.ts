import { cors } from "@elysiajs/cors";
import { db } from "@taskflow-elysia/db";
import { env } from "@taskflow-elysia/env/server";
import { Elysia } from "elysia";

const app = new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
    }),
  )
  .get("/", () => "OK")
  .get("/health/db", async ({ set }) => {
    try {
      await db.execute("select 1");

      return { ok: true };
    } catch {
      set.status = 503;

      return { ok: false };
    }
  })
  .listen(4000, () => {
    console.log("Server is running on http://localhost:4000");
  });
