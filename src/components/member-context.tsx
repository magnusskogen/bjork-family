"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

export type MemberLite = { id: string; name: string; isChild: boolean };

const STORAGE_KEY = "bjork.member";

/**
 * Valget av person bor i localStorage, ikke i React. Vi leser det som en
 * ekstern kilde slik at server og klient starter likt, og slik at et bytte i
 * én fane slår gjennom i de andre.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStoredId(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function writeStoredId(id: string) {
  window.localStorage.setItem(STORAGE_KEY, id);
  for (const listener of listeners) listener();
}

type MemberContextValue = {
  members: MemberLite[];
  member: MemberLite | null;
  /** Har vi rukket å lese localStorage ennå? Feltene er låst inntil da. */
  ready: boolean;
  choose: (id: string) => void;
  openPicker: () => void;
};

const MemberContext = createContext<MemberContextValue | null>(null);

export function useMember(): MemberContextValue {
  const value = useContext(MemberContext);
  if (!value) throw new Error("useMember må brukes inne i MemberProvider.");
  return value;
}

export function MemberProvider({
  members,
  children,
}: {
  members: MemberLite[];
  children: React.ReactNode;
}) {
  const [picking, setPicking] = useState(false);

  const memberId = useSyncExternalStore(subscribe, readStoredId, () => null);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const choose = useCallback((id: string) => {
    writeStoredId(id);
    setPicking(false);
  }, []);

  const member = useMemo(
    () => members.find((m) => m.id === memberId) ?? null,
    [members, memberId],
  );

  const value = useMemo(
    () => ({
      members,
      member,
      ready,
      choose,
      openPicker: () => setPicking(true),
    }),
    [members, member, ready, choose],
  );

  const mustChoose = ready && !member;

  return (
    <MemberContext.Provider value={value}>
      {children}
      {(mustChoose || picking) && (
        <MemberPicker
          members={members}
          currentId={member?.id ?? null}
          onChoose={choose}
          onClose={mustChoose ? undefined : () => setPicking(false)}
        />
      )}
    </MemberContext.Provider>
  );
}

function MemberPicker({
  members,
  currentId,
  onChoose,
  onClose,
}: {
  members: MemberLite[];
  currentId: string | null;
  onChoose: (id: string) => void;
  onClose?: () => void;
}) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hvem-er-du"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-4 sm:items-center"
    >
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl">
        <h2 id="hvem-er-du" className="text-xl font-semibold">
          Hvem er du?
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Vi husker valget på denne telefonen.
        </p>

        <ul className="mt-5 space-y-2">
          {members.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onChoose(m.id)}
                aria-current={m.id === currentId ? "true" : undefined}
                className={`w-full rounded-2xl border px-5 py-4 text-left text-lg transition ${
                  m.id === currentId
                    ? "border-accent bg-accent-soft font-medium text-accent"
                    : "border-line bg-paper hover:border-accent"
                }`}
              >
                {m.name}
              </button>
            </li>
          ))}
        </ul>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-2xl px-5 py-3 text-ink-soft"
          >
            Avbryt
          </button>
        ) : null}
      </div>
    </div>
  );
}
