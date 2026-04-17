import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserProvider } from "@/app/providers";
import DashboardShell from "./_components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.status !== "approved") {
    redirect("/pending-approval");
  }

  return (
    <UserProvider initialUser={user}>
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <DashboardShell user={user} isAdmin={user.role === "admin"}>
          <div className="p-4 md:p-6 lg:p-8 flex-1">
            {children}
          </div>
        </DashboardShell>
      </div>
    </UserProvider>
  );
}
