import LoginForm from "./login-form";

export const metadata = { title: "Logg inn – Familien Bjørk" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Familien Bjørk</h1>
      <p className="mt-2 text-ink-soft">Matpakker og beskjeder for uka.</p>
      <LoginForm />
    </main>
  );
}
