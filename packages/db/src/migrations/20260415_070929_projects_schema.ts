import { sql } from "drizzle-orm";
import type { MigrationArgs } from "@drepkovsky/drizzle-migrations";

export async function up({ db }: MigrationArgs<"postgresql">): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "projects" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "description" text,
      "owner_id" uuid NOT NULL,
      "created_at" timestamp (3) DEFAULT now() NOT NULL,
      "updated_at" timestamp (3) DEFAULT now() NOT NULL
    );

    CREATE INDEX "projects_owner_id_idx" ON "projects" USING btree ("owner_id");

    ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk"
      FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id")
      ON DELETE no action ON UPDATE no action;
  `);
}

export async function down({ db }: MigrationArgs<"postgresql">): Promise<void> {
  await db.execute(sql`
    DROP TABLE "projects" CASCADE;
  `);
}
