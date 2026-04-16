"use client";

import { createContext, useContext } from "react";
import type { AuthUser } from "@/lib/auth";

const UserContext = createContext<AuthUser | null>(null);

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: AuthUser | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={initialUser}>{children}</UserContext.Provider>;
}

/** Read the server-resolved user in any client component without an /api/auth/me roundtrip. */
export function useUser(): AuthUser | null {
  return useContext(UserContext);
}
