import Link from "next/link";

type HeroSectionStats = {
  pedidosEmAndamentoHoje?: number;
  totalProdutos?: number;
  totalAdicionais?: number;
  totalGruposProdutos?: number;
};

type HeroSectionProps = {
  stats?: HeroSectionStats;
};

export function HeroSection({ stats }: HeroSectionProps) {
  const summaryCards = [
    {
      title: "Pedidos em andamento",
      value:
        stats?.pedidosEmAndamentoHoje !== undefined
          ? stats.pedidosEmAndamentoHoje.toString()
          : "—",
      hint: "Hoje",
    },
    {
      title: "Itens do cardapio",
      value:
        stats?.totalProdutos !== undefined
          ? stats.totalProdutos.toString()
          : "—",
      hint: "Produtos ativos",
    },
    {
      title: "Adicionais",
      value:
        stats?.totalAdicionais !== undefined
          ? stats.totalAdicionais.toString()
          : "—",
      hint: "Complementos",
    },
    {
      title: "Grupos",
      value:
        stats?.totalGruposProdutos !== undefined
          ? stats.totalGruposProdutos.toString()
          : "—",
      hint: "Categorias",
    },
  ];

  return (
    <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-gray-400)]">
            Frente do Estabelecimento
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-[color:var(--color-gray-800)] lg:text-3xl">
            Operacao
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/painel/pedido"
            className="rounded-full bg-[color:var(--color-blue-800)] px-5 py-2 text-sm font-bold text-white shadow-[var(--shadow-soft)]"
          >
            Novo pedido
          </Link>
          <Link
            href="/painel/cardapio/produtos"
            className="rounded-full border border-[color:var(--color-blue-800)]/20 bg-[color:var(--color-white)] px-5 py-2 text-sm font-bold text-[color:var(--color-blue-800)]"
          >
            Atualizar cardapio
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] p-4 shadow-[var(--shadow-soft)]"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-gray-400)]">
              {card.title}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[color:var(--color-gray-800)]">
              {card.value}
            </p>
            <p className="mt-1 text-xs font-bold text-[color:var(--color-gray-500)]">
              {card.hint}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
