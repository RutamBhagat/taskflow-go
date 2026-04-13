import { eq, schema } from "./index";
import { db } from "./index";

const seededUserEmail = "seed@example.com";
const seededUserPassword = "Password123!";
const seededUserId = "11111111-1111-1111-1111-111111111111";
const seededProjectId = "22222222-2222-2222-2222-222222222222";

const seededTasks = [
  {
    id: "33333333-3333-3333-3333-333333333333",
    title: "Seed task - todo",
    status: "todo" as const,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    title: "Seed task - in progress",
    status: "in_progress" as const,
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    title: "Seed task - done",
    status: "done" as const,
  },
];

export async function seedDatabase() {
  const [existingUser] = await db
    .select({
      id: schema.users.id,
    })
    .from(schema.users)
    .where(eq(schema.users.email, seededUserEmail))
    .limit(1);

  const userId = existingUser?.id ?? seededUserId;

  if (!existingUser) {
    const password = await Bun.password.hash(seededUserPassword, {
      algorithm: "bcrypt",
      cost: 12,
    });

    await db.insert(schema.users).values({
      id: seededUserId,
      name: "Seed User",
      email: seededUserEmail,
      password,
    });
  }

  const [existingProject] = await db
    .select({
      id: schema.projects.id,
    })
    .from(schema.projects)
    .where(eq(schema.projects.id, seededProjectId))
    .limit(1);

  if (!existingProject) {
    await db.insert(schema.projects).values({
      id: seededProjectId,
      name: "Seed Project",
      description: "Project created during bootstrap seeding",
      ownerId: userId,
    });
  }

  for (const seededTask of seededTasks) {
    const [existingTask] = await db
      .select({
        id: schema.tasks.id,
      })
      .from(schema.tasks)
      .where(eq(schema.tasks.id, seededTask.id))
      .limit(1);

    if (existingTask) {
      continue;
    }

    await db.insert(schema.tasks).values({
      id: seededTask.id,
      title: seededTask.title,
      description: `Seed data for ${seededTask.status}`,
      status: seededTask.status,
      priority: "medium",
      projectId: seededProjectId,
      creatorId: userId,
      assigneeId: userId,
      dueDate: null,
    });
  }
}

if (import.meta.main) {
  await seedDatabase();
}
