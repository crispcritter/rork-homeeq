import { createTRPCRouter } from "./create-context";
import { propertyRouter } from "./routes/property";

export const appRouter = createTRPCRouter({
  property: propertyRouter,
});

export type AppRouter = typeof appRouter;
