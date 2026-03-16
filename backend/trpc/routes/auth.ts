import * as z from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { registerUser, loginUser, revokeToken, deleteUser } from "@/backend/auth";
import { dbGet, dbSet, dbDelete, dbKeys } from "@/backend/db";

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

  deleteAccount: protectedProcedure.mutation(({ ctx }) => {
    const userId = ctx.user.id;
    console.log("[AuthRoute] Delete account request for user:", userId);

    const householdId = dbGet<string>(`user_household:${userId}`);
    if (householdId) {
      const household = dbGet<{ ownerId: string }>(`household:${householdId}`);
      if (household?.ownerId === userId) {
        const members = dbGet<{ userId: string }[]>(`household_members:${householdId}`) ?? [];
        for (const member of members) {
          dbDelete(`user_household:${member.userId}`);
        }
        dbDelete(`household_members:${householdId}`);
        dbDelete(`household:${householdId}`);
        const inviteKeys = dbKeys("invite:");
        for (const key of inviteKeys) {
          const inv = dbGet<{ householdId: string }>(key);
          if (inv?.householdId === householdId) {
            dbDelete(key);
          }
        }
        console.log("[AuthRoute] Deleted owned household:", householdId);
      } else {
        const members = dbGet<{ userId: string }[]>(`household_members:${householdId}`) ?? [];
        dbSet(
          `household_members:${householdId}`,
          members.filter((m) => m.userId !== userId)
        );
        dbDelete(`user_household:${userId}`);
        console.log("[AuthRoute] Removed from household:", householdId);
      }
    }

    dbDelete(`sync:${userId}`);
    dbDelete(`sync_meta:${userId}`);

    deleteUser(userId);

    console.log("[AuthRoute] Account fully deleted:", userId);
    return { success: true };
  }),
});
