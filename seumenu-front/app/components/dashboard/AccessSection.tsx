import Link from "next/link";
import { accessModules } from "./data";

export function AccessSection() {
  return (
    <div className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-[color:var(--color-gray-800)]">
          Gestao de Acesso
        </h3>
        <Link
          href="/painel/acessos"
          className="rounded-full border border-[color:var(--color-status-success)]/40 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-status-success)]"
        >
          Novo usuario
        </Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {accessModules.map((module) => (
          <div
            key={module.title}
            className="rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] p-4 shadow-[var(--shadow-soft)]"
          >
            <p className="text-sm font-extrabold text-[color:var(--color-gray-800)]">
              {module.title}
            </p>
            <p className="mt-1 text-xs font-bold text-[color:var(--color-gray-500)]">
              {module.description}
            </p>
            <p className="mt-4 text-xs font-bold text-[color:var(--color-status-success)]">
              {module.stats}
            </p>
            <div className="mt-4 flex gap-2 text-xs">
              <Link
                href="/painel/acessos"
                className="rounded-full bg-[color:var(--color-blue-50)] px-3 py-1 font-bold text-[color:var(--color-blue-800)]"
              >
                Editar
              </Link>
              <Link
                href="/painel/acessos"
                className="rounded-full bg-[color:var(--color-green-100)] px-3 py-1 font-bold text-[color:var(--color-gray-800)]"
              >
                Permissoes
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
