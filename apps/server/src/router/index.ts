import { Elysia } from "elysia";
import { authRoutes } from "./auth/routes";
import { projectRoutes } from "./projects/routes";
import { taskRoutes } from "./tasks/routes";

export const routes = new Elysia()
  .use(authRoutes)
  .use(projectRoutes)
  .use(taskRoutes);
