import * as z from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { registerUser, loginUser, revokeToken } from "@/backend/auth";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().min(1),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[AuthRoute] Register attempt:", input.email);
      const result = await registerUser(input.email, input.password);
      return result;
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[AuthRoute] Login attempt:", input.email);
      const result = await loginUser(input.email, input.password);
      return result;
    }),

  me: protectedProcedure.query(({ ctx }) => {
    console.log("[AuthRoute] Me query for user:", ctx.user.id);
    return ctx.user;
  }),

  logout: protectedProcedure.mutation(({ ctx }) => {
    const authHeader = ctx.req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      revokeToken(authHeader.slice(7));
    }
    console.log("[AuthRoute] User logged out:", ctx.user.id);
    return { success: true };
  }),
});
