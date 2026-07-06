import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth";
import { toPublicUser } from "@/lib/server/db";
import { SessionBoot } from "@/components/session";
import { AdminShell } from "./_components/shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <SessionBoot initialUser={toPublicUser(user)}>
      <AdminShell>{children}</AdminShell>
    </SessionBoot>
  );
}
