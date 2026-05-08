import Link from "next/link";
import { mesas as mesasFallback } from "./data";

type MesaBase = {
  numero: number | string;
  setor?: string | null;
  status?: string;
  ativo?: boolean;
};

type TablesSectionProps = {
  mesas?: MesaBase[];
};

export function TablesSection({ mesas }: TablesSectionProps) {
  const mesasData: MesaBase[] =
    mesas === undefined ? (mesasFallback as MesaBase[]) : mesas;

  return (
    <div className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-[color:var(--color-gray-800)]">
          Mesas
        </h3>
        <Link
          href="/painel/mesas"
          className="rounded-full border border-[color:var(--color-status-success)]/40 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-status-success)]"
        >
          Nova mesa
        </Link>
      </div>
      <div className="mt-5 space-y-3">
        {mesasData.length === 0 ? (
          <div className="rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] px-4 py-6 text-center text-xs font-bold text-[color:var(--color-gray-500)] shadow-[var(--shadow-soft)]">
            Nenhuma mesa cadastrada.
          </div>
        ) : (
          mesasData.map((mesa) => {
          const status =
            mesa.status ?? (mesa.ativo === false ? "Inativa" : "Ativa");
          const setor = mesa.setor ?? "Salao";
          return (
          <div
            key={`${mesa.numero}-${mesa.setor}`}
            className="flex items-center justify-between rounded-[var(--radius-md)] bg-[color:var(--color-gray-50)] px-4 py-3 text-sm shadow-[var(--shadow-soft)]"
          >
            <div>
              <p className="font-extrabold text-[color:var(--color-gray-800)]">
                Mesa {mesa.numero}
              </p>
              <p className="text-xs font-bold text-[color:var(--color-gray-500)]">
                Setor {setor}
              </p>
            </div>
            <span className="rounded-full bg-[color:var(--color-green-100)] px-3 py-1 text-xs font-bold text-[color:var(--color-gray-800)]">
              {status}
            </span>
          </div>
          );
        })
        )}
      </div>
    </div>
  );
}
