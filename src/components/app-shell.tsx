import { prisma } from "@/lib/prisma";
import { MemberProvider } from "./member-context";
import AppHeader, { LogoutButton } from "./app-header";

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const members = await prisma.member.findMany({
    select: { id: true, name: true, isChild: true },
    orderBy: [{ isChild: "asc" }, { name: "asc" }],
  });

  return (
    <MemberProvider members={members}>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 pb-24">{children}</main>
      <LogoutButton />
    </MemberProvider>
  );
}
