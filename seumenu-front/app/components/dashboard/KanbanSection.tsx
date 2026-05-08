import Link from "next/link";
import { kanban } from "./data";

type KanbanCard = {
  id: string;
  mesa: string;
  itens: string;
  total: string;
  rawId?: string | number;
  statusValue?: string;
};

type KanbanColumn = {
  status: string;
  cards: KanbanCard[];
};

type KanbanSectionProps = {
  columns?: KanbanColumn[];
  onMove?: (
    card: KanbanCard,
    fromStatus: string,
    toStatus: string,
  ) => void;
};

export function KanbanSection({ columns, onMove }: KanbanSectionProps) {
  const kanbanColumns =
    columns ??
    Object.entries(kanban).map(([status, cards]) => ({
      status,
      cards: cards.map((card) => ({
        ...card,
        rawId: undefined,
        statusValue: status,
      })),
    }));
  const labelMap: Record<string, string> = {
    em_analise: "Em analise",
    preparando: "Em preparo",
    feito: "Feito",
  };

  return (
    <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-[color:var(--color-gray-800)]">
            Painel Kanban - Status de Pedidos
          </h3>
          <p className="text-xs font-bold text-[color:var(--color-gray-500)]">
            Arraste ou atualize por acao rapida para manter o fluxo.
          </p>
        </div>
        <Link
          href="/painel/pedido"
          className="rounded-full bg-[color:var(--color-blue-800)] px-4 py-2 text-xs font-extrabold text-white"
        >
          Atualizar status
        </Link>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {kanbanColumns.map((column) => (
          <div
            key={column.status}
            className="rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] p-4 shadow-[var(--shadow-soft)]"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const payload = event.dataTransfer.getData("text/plain");
              if (!payload || !onMove) return;
              const [rawId, fromStatus] = payload.split(":");
              if (!rawId || !fromStatus) return;
              const card = kanbanColumns
                .flatMap((col) => col.cards)
                .find((item) => String(item.rawId ?? item.id) === rawId);
              if (!card) return;
              onMove(card, fromStatus, column.status);
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-gray-400)]">
                {labelMap[column.status] ?? column.status}
              </p>
              <span className="rounded-full bg-[color:var(--color-white)] px-3 py-1 text-xs font-bold text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)]">
                {column.cards.length}
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {column.cards.length === 0 ? (
                <div className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-4 text-xs font-bold text-[color:var(--color-gray-500)] shadow-[var(--shadow-soft)]">
                  Nenhum pedido nesta etapa.
                </div>
              ) : (
                column.cards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-4 text-sm shadow-[var(--shadow-soft)]"
                    draggable={Boolean(onMove)}
                    onDragStart={(event) => {
                      if (!onMove) return;
                      event.dataTransfer.setData(
                        "text/plain",
                        `${card.rawId ?? card.id}:${column.status}`,
                      );
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-[color:var(--color-gray-800)]">
                        {card.id}
                      </p>
                      <span className="text-xs font-bold text-[color:var(--color-gray-500)]">
                        {card.mesa}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-[color:var(--color-gray-500)]">
                      {card.itens}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[color:var(--color-gray-800)]">
                        {card.total}
                      </span>
                      <Link
                        href="/painel/pedido"
                        className="rounded-full bg-[color:var(--color-green-100)] px-3 py-1 font-bold text-[color:var(--color-gray-800)]"
                      >
                        Mover
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
