import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import * as SecureStore from "expo-secure-store";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

export const AUTH_TOKEN_KEY = "homeeq_auth_token";

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    console.warn("EXPO_PUBLIC_RORK_API_BASE_URL is not set, tRPC calls will fail");
    return "http://localhost:3000";
  }

  return url;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        try {
          const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
          if (token) {
            return { Authorization: `Bearer ${token}` };
          }
        } catch (e) {
          console.warn("[tRPC] Failed to read auth token:", e);
        }
        return {};
      },
    }),
  ],
});
