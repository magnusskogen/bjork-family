"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMember } from "./member-context";
import { logout } from "@/app/actions";

export default function AppHeader() {
  const { member, openPicker } = useMember();
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Matpakker" },
    { href: "/beskjeder", label: "Beskjeder" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
        <nav aria-label="Hovedmeny" className="flex gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-[15px] transition ${
                  active
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={openPicker}
          className="shrink-0 rounded-full border border-line px-4 py-2 text-[15px] text-ink-soft"
        >
          {member ? member.name : "Velg deg"}
        </button>
      </div>
    </header>
  );
}

export function LogoutButton() {
  return (
    <form action={logout} className="mt-12 text-center">
      <button type="submit" className="px-4 py-3 text-sm text-ink-faint underline">
        Logg ut
      </button>
    </form>
  );
}
