import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth";
import { toPublicUser } from "@/lib/server/db";
import { SessionBoot } from "@/components/session";
import { UserShell } from "./_components/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  return (
    <SessionBoot initialUser={toPublicUser(user)}>
      <UserShell>{children}</UserShell>
    </SessionBoot>
  );
}
