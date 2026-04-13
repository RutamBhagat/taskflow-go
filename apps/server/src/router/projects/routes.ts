import { db, desc, eq, inArray, or, and, schema } from "@taskflow-elysia/db";
import { Elysia, t } from "elysia";
import { app } from "../../app";
import { createJwtPlugin, getCurrentUserId } from "../auth/auth-utils";

const projectRoutes = new Elysia({ prefix: "/projects" })
  .use(createJwtPlugin())
  .get("/", async ({ headers, jwt, set }) => {
    const currentUserId = await getCurrentUserId(jwt, headers.authorization);

    if (!currentUserId) {
      set.status = 401;

      return { error: "unauthorized" };
    }

    const assignedProjectIds = db
      .select({
        projectId: schema.tasks.projectId,
      })
      .from(schema.tasks)
      .where(eq(schema.tasks.assigneeId, currentUserId));

    const projects = await db
      .select({
        id: schema.projects.id,
        name: schema.projects.name,
        description: schema.projects.description,
        ownerId: schema.projects.ownerId,
        createdAt: schema.projects.createdAt,
        updatedAt: schema.projects.updatedAt,
      })
      .from(schema.projects)
      .where(
        or(
          eq(schema.projects.ownerId, currentUserId),
          inArray(schema.projects.id, assignedProjectIds),
        ),
      )
      .orderBy(desc(schema.projects.createdAt));

    return { projects };
  })
  .get(
    "/:id",
    async ({ headers, jwt, params, set }) => {
      const currentUserId = await getCurrentUserId(jwt, headers.authorization);

      if (!currentUserId) {
        set.status = 401;

        return { error: "unauthorized" };
      }

      const [project] = await db
        .select({
          id: schema.projects.id,
          name: schema.projects.name,
          description: schema.projects.description,
          ownerId: schema.projects.ownerId,
        })
        .from(schema.projects)
        .where(eq(schema.projects.id, params.id))
        .limit(1);

      if (!project) {
        set.status = 404;

        return { error: "not found" };
      }

      const [assignedTask] = await db
        .select({ id: schema.tasks.id })
        .from(schema.tasks)
        .where(and(eq(schema.tasks.projectId, params.id), eq(schema.tasks.assigneeId, currentUserId)))
        .limit(1);

      if (project.ownerId !== currentUserId && !assignedTask) {
        set.status = 403;

        return { error: "forbidden" };
      }

      const tasks = await db
        .select({
          id: schema.tasks.id,
          title: schema.tasks.title,
          status: schema.tasks.status,
          priority: schema.tasks.priority,
          assigneeId: schema.tasks.assigneeId,
          dueDate: schema.tasks.dueDate,
          createdAt: schema.tasks.createdAt,
          updatedAt: schema.tasks.updatedAt,
        })
        .from(schema.tasks)
        .where(eq(schema.tasks.projectId, params.id))
        .orderBy(desc(schema.tasks.createdAt));

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        owner_id: project.ownerId,
        tasks: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assignee_id: task.assigneeId,
          due_date: task.dueDate,
          created_at: task.createdAt,
          updated_at: task.updatedAt,
        })),
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .patch(
    "/:id",
    async ({ body, headers, jwt, params, set }) => {
      const currentUserId = await getCurrentUserId(jwt, headers.authorization);

      if (!currentUserId) {
        set.status = 401;

        return { error: "unauthorized" };
      }

      const [project] = await db
        .select({
          id: schema.projects.id,
          ownerId: schema.projects.ownerId,
        })
        .from(schema.projects)
        .where(eq(schema.projects.id, params.id))
        .limit(1);

      if (!project) {
        set.status = 404;

        return { error: "not found" };
      }

      if (project.ownerId !== currentUserId) {
        set.status = 403;

        return { error: "forbidden" };
      }

      if (body.name === undefined && body.description === undefined) {
        set.status = 400;

        return {
          error: "validation failed",
          fields: {
            body: "at least one field is required",
          },
        };
      }

      const updates: {
        name?: string;
        description?: string;
      } = {};

      if (body.name !== undefined) {
        updates.name = body.name;
      }

      if (body.description !== undefined) {
        updates.description = body.description;
      }

      const [updatedProject] = await db
        .update(schema.projects)
        .set(updates)
        .where(eq(schema.projects.id, params.id))
        .returning({
          id: schema.projects.id,
          name: schema.projects.name,
          description: schema.projects.description,
          ownerId: schema.projects.ownerId,
          createdAt: schema.projects.createdAt,
          updatedAt: schema.projects.updatedAt,
        });

      if (!updatedProject) {
        set.status = 500;

        return { error: "project not updated" };
      }

      return {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        owner_id: updatedProject.ownerId,
        created_at: updatedProject.createdAt,
        updated_at: updatedProject.updatedAt,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/",
    async ({ body, headers, jwt, set }) => {
      const currentUserId = await getCurrentUserId(jwt, headers.authorization);

      if (!currentUserId) {
        set.status = 401;

        return { error: "unauthorized" };
      }

      const [project] = await db
        .insert(schema.projects)
        .values({
          name: body.name,
          description: body.description,
          ownerId: currentUserId,
        })
        .returning({
          id: schema.projects.id,
          name: schema.projects.name,
          description: schema.projects.description,
          ownerId: schema.projects.ownerId,
          createdAt: schema.projects.createdAt,
          updatedAt: schema.projects.updatedAt,
        });

      if (!project) {
        set.status = 500;

        return { error: "project not created" };
      }

      set.status = 201;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        owner_id: project.ownerId,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      };
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
      }),
    },
  );

app.use(projectRoutes);
