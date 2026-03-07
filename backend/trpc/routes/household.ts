import * as z from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { dbGet, dbSet, dbDelete, dbKeys } from "@/backend/db";

export interface HouseholdData {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
}

export interface HouseholdMemberData {
  userId: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface HouseholdInvite {
  code: string;
  householdId: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
}

function householdKey(id: string): string {
  return `household:${id}`;
}

function householdMembersKey(householdId: string): string {
  return `household_members:${householdId}`;
}

function userHouseholdKey(userId: string): string {
  return `user_household:${userId}`;
}

function inviteKey(code: string): string {
  return `invite:${code}`;
}

function generateInviteCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .slice(0, 8);
}

export const householdRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(({ ctx, input }) => {
      const userId = ctx.user.id;
      const existing = dbGet<string>(userHouseholdKey(userId));
      if (existing) {
        const existingHousehold = dbGet<HouseholdData>(householdKey(existing));
        if (existingHousehold) {
          console.log("[Household] User already in household:", existing);
          return existingHousehold;
        }
      }

      const householdId = crypto.randomUUID();
      const now = new Date().toISOString();

      const household: HouseholdData = {
        id: householdId,
        name: input.name,
        ownerId: userId,
        ownerEmail: ctx.user.email,
        createdAt: now,
      };

      const ownerMember: HouseholdMemberData = {
        userId,
        email: ctx.user.email,
        role: "owner",
        joinedAt: now,
      };

      dbSet(householdKey(householdId), household);
      dbSet(householdMembersKey(householdId), [ownerMember]);
      dbSet(userHouseholdKey(userId), householdId);

      console.log("[Household] Created:", householdId, "by:", ctx.user.email, "name:", input.name);
      return household;
    }),

  get: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.user.id;
    const householdId = dbGet<string>(userHouseholdKey(userId));
    if (!householdId) return null;

    const household = dbGet<HouseholdData>(householdKey(householdId));
    if (!household) return null;

    const members = dbGet<HouseholdMemberData[]>(householdMembersKey(householdId)) ?? [];

    console.log("[Household] Get for user:", userId, "| household:", householdId, "| members:", members.length);
    return {
      ...household,
      members,
      isOwner: household.ownerId === userId,
    };
  }),

  generateInvite: protectedProcedure.mutation(({ ctx }) => {
    const userId = ctx.user.id;
    const householdId = dbGet<string>(userHouseholdKey(userId));
    if (!householdId) {
      throw new Error("You must be in a household to generate an invite.");
    }

    const household = dbGet<HouseholdData>(householdKey(householdId));
    if (!household) {
      throw new Error("Household not found.");
    }

    const code = generateInviteCode();
    const now = new Date().toISOString();
    const invite: HouseholdInvite = {
      code,
      householdId,
      createdBy: userId,
      createdAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    dbSet(inviteKey(code), invite);

    console.log("[Household] Invite generated:", code, "for household:", householdId);
    return { code, householdName: household.name };
  }),

  getInviteInfo: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(({ ctx, input }) => {
      const invite = dbGet<HouseholdInvite>(inviteKey(input.code));
      if (!invite) {
        return { valid: false as const, reason: "Invalid invite code." };
      }

      if (new Date(invite.expiresAt) < new Date()) {
        return { valid: false as const, reason: "This invite has expired." };
      }

      const household = dbGet<HouseholdData>(householdKey(invite.householdId));
      if (!household) {
        return { valid: false as const, reason: "Household no longer exists." };
      }

      const existingHouseholdId = dbGet<string>(userHouseholdKey(ctx.user.id));
      if (existingHouseholdId === invite.householdId) {
        return { valid: false as const, reason: "You are already a member of this household." };
      }

      console.log("[Household] Invite info for code:", input.code, "| household:", household.name);
      return {
        valid: true as const,
        householdName: household.name,
        ownerEmail: household.ownerEmail,
        memberCount: (dbGet<HouseholdMemberData[]>(householdMembersKey(invite.householdId)) ?? []).length,
      };
    }),

  join: protectedProcedure
    .input(z.object({ code: z.string().min(1), role: z.string().optional() }))
    .mutation(({ ctx, input }) => {
      const userId = ctx.user.id;
      const invite = dbGet<HouseholdInvite>(inviteKey(input.code));

      if (!invite) {
        throw new Error("Invalid invite code.");
      }
      if (new Date(invite.expiresAt) < new Date()) {
        throw new Error("This invite has expired.");
      }

      const household = dbGet<HouseholdData>(householdKey(invite.householdId));
      if (!household) {
        throw new Error("Household no longer exists.");
      }

      const existingHouseholdId = dbGet<string>(userHouseholdKey(userId));
      if (existingHouseholdId) {
        if (existingHouseholdId === invite.householdId) {
          throw new Error("You are already a member of this household.");
        }
        const existingHousehold = dbGet<HouseholdData>(householdKey(existingHouseholdId));
        if (existingHousehold && existingHousehold.ownerId === userId) {
          throw new Error("You own another household. Please transfer or delete it first.");
        }
        const existingMembers = dbGet<HouseholdMemberData[]>(householdMembersKey(existingHouseholdId)) ?? [];
        dbSet(
          householdMembersKey(existingHouseholdId),
          existingMembers.filter((m) => m.userId !== userId)
        );
      }

      const members = dbGet<HouseholdMemberData[]>(householdMembersKey(invite.householdId)) ?? [];
      if (members.some((m) => m.userId === userId)) {
        throw new Error("You are already a member of this household.");
      }

      const newMember: HouseholdMemberData = {
        userId,
        email: ctx.user.email,
        role: input.role ?? "family",
        joinedAt: new Date().toISOString(),
      };

      members.push(newMember);
      dbSet(householdMembersKey(invite.householdId), members);
      dbSet(userHouseholdKey(userId), invite.householdId);

      console.log("[Household] User joined:", ctx.user.email, "| household:", household.name);
      return { success: true, householdName: household.name };
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(({ ctx, input }) => {
      const userId = ctx.user.id;
      const householdId = dbGet<string>(userHouseholdKey(userId));
      if (!householdId) throw new Error("You are not in a household.");

      const household = dbGet<HouseholdData>(householdKey(householdId));
      if (!household) throw new Error("Household not found.");
      if (household.ownerId !== userId) throw new Error("Only the owner can remove members.");
      if (input.memberId === userId) throw new Error("You cannot remove yourself. Use leave instead.");

      const members = dbGet<HouseholdMemberData[]>(householdMembersKey(householdId)) ?? [];
      const updated = members.filter((m) => m.userId !== input.memberId);
      dbSet(householdMembersKey(householdId), updated);
      dbDelete(userHouseholdKey(input.memberId));

      console.log("[Household] Removed member:", input.memberId, "from household:", householdId);
      return { success: true };
    }),

  leave: protectedProcedure.mutation(({ ctx }) => {
    const userId = ctx.user.id;
    const householdId = dbGet<string>(userHouseholdKey(userId));
    if (!householdId) throw new Error("You are not in a household.");

    const household = dbGet<HouseholdData>(householdKey(householdId));
    if (!household) throw new Error("Household not found.");
    if (household.ownerId === userId) {
      throw new Error("Owners cannot leave their household. Transfer ownership or delete it first.");
    }

    const members = dbGet<HouseholdMemberData[]>(householdMembersKey(householdId)) ?? [];
    dbSet(
      householdMembersKey(householdId),
      members.filter((m) => m.userId !== userId)
    );
    dbDelete(userHouseholdKey(userId));

    console.log("[Household] User left:", ctx.user.email, "| household:", householdId);
    return { success: true };
  }),

  delete: protectedProcedure.mutation(({ ctx }) => {
    const userId = ctx.user.id;
    const householdId = dbGet<string>(userHouseholdKey(userId));
    if (!householdId) throw new Error("You are not in a household.");

    const household = dbGet<HouseholdData>(householdKey(householdId));
    if (!household) throw new Error("Household not found.");
    if (household.ownerId !== userId) throw new Error("Only the owner can delete the household.");

    const members = dbGet<HouseholdMemberData[]>(householdMembersKey(householdId)) ?? [];
    for (const member of members) {
      dbDelete(userHouseholdKey(member.userId));
    }
    dbDelete(householdMembersKey(householdId));
    dbDelete(householdKey(householdId));

    const inviteKeys = dbKeys("invite:");
    for (const key of inviteKeys) {
      const inv = dbGet<HouseholdInvite>(key);
      if (inv?.householdId === householdId) {
        dbDelete(key);
      }
    }

    console.log("[Household] Deleted household:", householdId);
    return { success: true };
  }),
});
