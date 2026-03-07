import { createTRPCRouter } from "./create-context";
import { propertyRouter } from "./routes/property";
import { authRouter } from "./routes/auth";
import { syncRouter } from "./routes/sync";

export const appRouter = createTRPCRouter({
  property: propertyRouter,
  auth: authRouter,
  sync: syncRouter,
});

export type AppRouter = typeof appRouter;
