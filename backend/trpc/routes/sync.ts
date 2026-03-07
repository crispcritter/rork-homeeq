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

function syncKey(userId: string): string {
  return `sync:${userId}`;
}

function syncMetaKey(userId: string): string {
  return `sync_meta:${userId}`;
}

export const syncRouter = createTRPCRouter({
  pull: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.user.id;
    const data = dbGet<SyncData>(syncKey(userId));
    const meta = dbGet<{ updatedAt: string }>(syncMetaKey(userId));

    console.log(
      "[Sync] Pull for user:",
      userId,
      "| has data:",
      !!data,
      "| updatedAt:",
      meta?.updatedAt ?? "never"
    );

    return {
      data: data ?? null,
      updatedAt: meta?.updatedAt ?? null,
    };
  }),

  push: protectedProcedure
    .input(syncDataSchema)
    .mutation(({ ctx, input }) => {
      const userId = ctx.user.id;
      const now = new Date().toISOString();

      dbSet(syncKey(userId), input);
      dbSet(syncMetaKey(userId), { updatedAt: now });

      console.log(
        "[Sync] Push for user:",
        userId,
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
    const meta = dbGet<{ updatedAt: string }>(syncMetaKey(userId));

    return {
      hasCloudData: !!dbGet(syncKey(userId)),
      lastSyncedAt: meta?.updatedAt ?? null,
    };
  }),
});
