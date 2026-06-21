import { db } from "@/lib/db";
import { isAllowedEmail } from "@/lib/auth";

export function useIsAdmin() {
  const { isLoading, user } = db.useAuth();
  return {
    isLoading,
    isAdmin: !isLoading && isAllowedEmail(user?.email),
  };
}
