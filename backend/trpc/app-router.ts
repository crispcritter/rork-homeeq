import { createTRPCRouter } from "./create-context";
import { propertyRouter } from "./routes/property";
import { authRouter } from "./routes/auth";
import { syncRouter } from "./routes/sync";
import { householdRouter } from "./routes/household";

export const appRouter = createTRPCRouter({
  property: propertyRouter,
  auth: authRouter,
  sync: syncRouter,
  household: householdRouter,
});

export type AppRouter = typeof appRouter;
