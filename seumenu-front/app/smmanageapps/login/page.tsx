"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  SAAS_AUTH_USER_STORAGE,
  apiPost,
  clearRememberedLogin,
  loadRememberedLogin,
  saveRememberedLogin,
  setAuthCookie,
} from "../../lib/api";

type LoginPayload = {
  email: string;
  senha: string;
};

type LoginResponse = {
  accessToken: string;
  tokenType: string;
  permissions: string[];
  user: {
    id: number;
    nome: string;
    email: string;
    role: string;
  };
};

export default function SmManageAppsLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => {
    const redirect = searchParams.get("redirect");
    if (!redirect || !redirect.startsWith("/smmanageapps")) {
      return "/smmanageapps";
    }
    return redirect;
  }, [searchParams]);
  const [formState, setFormState] = useState<LoginPayload>({
    email: "",
    senha: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const rememberedLogin = loadRememberedLogin("saas");
    if (rememberedLogin) {
      setFormState({
        email: rememberedLogin.email,
        senha: rememberedLogin.senha,
      });
      setRememberMe(Boolean(rememberedLogin.rememberMe));
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiPost<LoginResponse, LoginPayload>(
        "/auth/saas/login",
        formState,
      );
      setAuthCookie("saas", response.accessToken, rememberMe);
      if (rememberMe) {
        saveRememberedLogin("saas", {
          email: formState.email,
          senha: formState.senha,
          rememberMe: true,
        });
      } else {
        clearRememberedLogin("saas");
      }
      localStorage.setItem(SAAS_AUTH_USER_STORAGE, JSON.stringify(response.user));
      router.replace(redirectTo);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Nao foi possivel entrar. Tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-blue-950)] text-white">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute -left-20 top-12 h-56 w-56 rounded-full bg-[color:var(--color-green-500)]/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-20 h-64 w-64 rounded-full bg-[color:var(--color-blue-700)]/40 blur-3xl" />
        <main className="relative z-10 flex min-h-screen flex-col px-6 pb-10 pt-10 md:mx-auto md:max-w-2xl md:justify-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-green-500)] shadow-[var(--shadow-soft)]">
              <Image
                src="/brand/LogoSeuMenu.png"
                alt="Seu Menu"
                width={34}
                height={34}
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">
                Painel de Gestao SaaS
              </p>
              <h1 className="text-2xl font-extrabold text-white">
                Entre para gerenciar clientes e licencas
              </h1>
            </div>
          </div>

          <section className="mt-10 rounded-[var(--radius-md)] bg-white p-6 text-[color:var(--color-gray-800)] shadow-[var(--shadow-soft-lg)]">
            <h2 className="text-lg font-extrabold text-[color:var(--color-blue-800)]">
              Acesso ao painel SaaS
            </h2>
            <p className="mt-2 text-sm font-semibold text-[color:var(--color-gray-500)]">
              Use credenciais de gerenciamento SaaS para acessar este ambiente.
            </p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm font-bold text-[color:var(--color-gray-700)]">
                E-mail
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder="voce@empresa.com"
                  className="rounded-[var(--radius-md)] border border-[color:var(--color-gray-200)] bg-[color:var(--color-gray-50)] px-4 py-3 text-sm font-semibold text-[color:var(--color-gray-800)] shadow-[var(--shadow-soft)] outline-none transition focus:border-[color:var(--color-blue-500)] focus:bg-white"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-bold text-[color:var(--color-gray-700)]">
                Senha
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="senha"
                    autoComplete="current-password"
                    required
                    value={formState.senha}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        senha: event.target.value,
                      }))
                    }
                    placeholder="Sua senha"
                    className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-gray-200)] bg-[color:var(--color-gray-50)] px-4 py-3 pr-14 text-sm font-semibold text-[color:var(--color-gray-800)] shadow-[var(--shadow-soft)] outline-none transition focus:border-[color:var(--color-blue-500)] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute inset-y-0 right-3 my-auto text-xs font-bold text-[color:var(--color-blue-700)]"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-gray-700)]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Lembrar-me por 7 dias
              </label>

              {error ? (
                <div
                  role="alert"
                  className="rounded-[var(--radius-sm)] border border-[color:var(--color-status-danger)]/40 bg-[color:var(--color-status-danger)]/10 px-4 py-3 text-sm font-semibold text-[color:var(--color-status-danger)]"
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex items-center justify-center rounded-full bg-[color:var(--color-green-500)] px-6 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--color-green-600)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Entrando..." : "Entrar no painel SaaS"}
              </button>
            </form>
          </section>

          <p className="mt-6 text-xs font-semibold text-white/70">
            Precisa de ajuda? Fale com o suporte do Seu Menu.
          </p>
        </main>
      </div>
    </div>
  );
}
