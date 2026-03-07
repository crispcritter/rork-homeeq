import * as z from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { dbGet, dbSet } from "@/backend/db";

const syncDataSchema = z.object({
  appliances: z.array(z.any()),
  tasks: z.array(z.any()),
  budgetItems: z.array(z.any()),
  monthlyBudget: z.number(),
  homeProfile: z.any(),
  recommendedGroups: z.array(z.any()),
  trustedPros: z.array(z.any()),
  sectionsDefaultOpen: z.boolean(),
});

export type SyncData = z.infer<typeof syncDataSchema>;

function syncKey(scopeId: string): string {
  return `sync:${scopeId}`;
}

function syncMetaKey(scopeId: string): string {
  return `sync_meta:${scopeId}`;
}

function userHouseholdKey(userId: string): string {
  return `user_household:${userId}`;
}

function getSyncScope(userId: string): string {
  const householdId = dbGet<string>(userHouseholdKey(userId));
  if (householdId) {
    console.log("[Sync] Using household scope:", householdId, "for user:", userId);
    return `household:${householdId}`;
  }
  return userId;
}

export const syncRouter = createTRPCRouter({
  pull: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.user.id;
    const scope = getSyncScope(userId);
    const data = dbGet<SyncData>(syncKey(scope));
    const meta = dbGet<{ updatedAt: string; updatedBy?: string }>(syncMetaKey(scope));

    console.log(
      "[Sync] Pull for user:",
      userId,
      "| scope:",
      scope,
      "| has data:",
      !!data,
      "| updatedAt:",
      meta?.updatedAt ?? "never"
    );

    return {
      data: data ?? null,
      updatedAt: meta?.updatedAt ?? null,
      updatedBy: meta?.updatedBy ?? null,
    };
  }),

  push: protectedProcedure
    .input(syncDataSchema)
    .mutation(({ ctx, input }) => {
      const userId = ctx.user.id;
      const scope = getSyncScope(userId);
      const now = new Date().toISOString();

      dbSet(syncKey(scope), input);
      dbSet(syncMetaKey(scope), { updatedAt: now, updatedBy: ctx.user.email });

      console.log(
        "[Sync] Push for user:",
        userId,
        "| scope:",
        scope,
        "| appliances:",
        input.appliances.length,
        "| tasks:",
        input.tasks.length,
        "| budgetItems:",
        input.budgetItems.length,
        "| trustedPros:",
        input.trustedPros.length
      );

      return { success: true, updatedAt: now };
    }),

  status: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.user.id;
    const scope = getSyncScope(userId);
    const meta = dbGet<{ updatedAt: string; updatedBy?: string }>(syncMetaKey(scope));

    return {
      hasCloudData: !!dbGet(syncKey(scope)),
      lastSyncedAt: meta?.updatedAt ?? null,
      scope,
    };
  }),
});
