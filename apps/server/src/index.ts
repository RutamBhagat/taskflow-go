import "./router/auth/routes";
import "./router/projects/routes";
import "./router/tasks/routes";

import { app } from "./app";
import { logger } from "./shared/logger";

app.listen(4000, () => {
  logger.info(
    {
      event: "server_started",
      port: 4000,
      url: "http://localhost:4000",
    },
    "server started",
  );
});

async function shutdown(signal: string) {
  logger.info(
    {
      event: "server_shutdown_started",
      signal,
    },
    "server shutting down",
  );

  try {
    await app.server?.stop();

    logger.info(
      {
        event: "server_shutdown_completed",
        signal,
      },
      "server stopped",
    );
  } catch (error) {
    logger.error(
      {
        event: "server_shutdown_failed",
        signal,
        error,
      },
      "server shutdown failed",
    );

    process.exitCode = 1;
  }
}

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
