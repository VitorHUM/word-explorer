import { AppShell } from "@/components/shared/app-shell";
import { getAuthToken } from "@/lib/auth-session";
import { BackendApiError, requestBackend } from "@/services/backend-api";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAuthToken();

  if (!token) {
    redirect("/login");
  }

  try {
    await requestBackend("/user/me");
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      redirect("/login?reason=session-expired");
    }

    throw error;
  }

  return <AppShell>{children}</AppShell>;
}
