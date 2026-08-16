"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 w-full rounded-2xl bg-accent px-6 py-4 text-lg font-medium text-white transition disabled:opacity-50"
    >
      {pending ? "Sjekker …" : "Logg inn"}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(login, {});

  return (
    <form action={formAction} className="mt-10">
      <label htmlFor="pin" className="block text-sm font-medium text-ink-soft">
        Familiekode
      </label>
      <input
        id="pin"
        name="pin"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        autoFocus
        required
        aria-describedby={state?.error ? "pin-feil" : undefined}
        className="mt-2 w-full rounded-2xl border border-line bg-card px-5 py-4 text-center text-2xl tracking-[0.4em] outline-none focus:border-accent"
      />

      {state?.error ? (
        <p id="pin-feil" role="alert" className="mt-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
