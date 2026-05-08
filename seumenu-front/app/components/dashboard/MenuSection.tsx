import Link from "next/link";
import { menuModules } from "./data";

type MenuSectionStats = {
  totalGruposProdutos?: number;
  totalProdutos?: number;
  totalAdicionais?: number;
};

type MenuSectionProps = {
  stats?: MenuSectionStats;
};

export function MenuSection({ stats }: MenuSectionProps) {
  const modules = menuModules.map((module) => {
    if (module.title === "Grupos de Produtos") {
      return {
        ...module,
        stats:
          stats?.totalGruposProdutos !== undefined
            ? `${stats.totalGruposProdutos} grupos`
            : module.stats,
      };
    }
    if (module.title === "Produtos") {
      return {
        ...module,
        stats:
          stats?.totalProdutos !== undefined
            ? `${stats.totalProdutos} itens`
            : module.stats,
      };
    }
    if (module.title === "Adicionais") {
      return {
        ...module,
        stats:
          stats?.totalAdicionais !== undefined
            ? `${stats.totalAdicionais} adicionais`
            : module.stats,
      };
    }
    return module;
  });

  return (
    <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-[color:var(--color-gray-800)]">
            Gestao de Cardapio
          </h3>
          <p className="text-xs font-bold text-[color:var(--color-gray-500)]">
            Crie grupos, produtos e adicionais com ordem de exibicao.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/painel/cardapio/produtos"
            className="rounded-full bg-[color:var(--color-status-success)] px-4 py-2 text-xs font-extrabold text-white"
          >
            Novo produto
          </Link>
          <Link
            href="/painel/cardapio/produtos"
            className="rounded-full border border-[color:var(--color-blue-800)]/20 px-4 py-2 text-xs font-extrabold text-[color:var(--color-blue-800)]"
          >
            Reordenar
          </Link>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {modules.map((module) => (
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
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="font-bold text-[color:var(--color-status-success)]">
                {module.stats}
              </span>
              <Link
                href="/painel/cardapio/produtos"
                className="rounded-full bg-[color:var(--color-white)] px-3 py-1 font-bold text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)]"
              >
                Gerenciar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
