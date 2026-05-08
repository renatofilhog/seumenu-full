import Image from "next/image";
import { ClienteLayout } from "../../components/cliente/ClienteLayout";

export default function ClienteConfirmacaoPage() {
  return (
    <ClienteLayout title="Acompanhamento do pedido" active="carrinho">
      <div className="space-y-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:space-y-0">
        <div className="space-y-6">
          <section className="space-y-3">
            <p className="text-base font-semibold text-[color:var(--color-blue-800)]/75">
              Em preparo
            </p>
            <p className="text-sm text-[color:var(--color-blue-800)]/70">
              Tempo estimado: ate 40 min
            </p>
            <div className="flex items-center gap-2 pt-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <span
                  key={`step-${index}`}
                  className={`h-3 w-12 rounded-full ${
                    index < 4
                      ? "bg-[color:var(--color-status-success)]"
                      : "border border-[color:var(--color-status-success)]/50 bg-[color:var(--color-white)]"
                  }`}
                />
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-sm)] bg-[color:var(--color-white)] p-4 shadow-[var(--shadow-soft-lg)]">
            <div className="flex items-start gap-4">
              <div className="relative h-[134px] w-[194px] overflow-hidden rounded-[var(--radius-sm)]">
                <Image
                  src="/brand/pizza1.jpg"
                  alt="Produto"
                  width={194}
                  height={134}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-[color:var(--color-gray-500)]">
                  00/00/00 13:50
                </p>
                <p className="text-sm font-bold text-[color:var(--color-blue-800)]">
                  1 Pizza Grande
                </p>
                <p className="text-xs text-[color:var(--color-blue-800)]/70">
                  1/2 Portuguesa
                  <br />
                  1/2 Calabresa
                  <br />
                  Obs.: Remover a cebola
                </p>
                <p className="text-base font-extrabold text-[color:var(--color-blue-800)]">
                  R$00,00
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-lg font-extrabold text-[color:var(--color-blue-800)]">
                Pedido #0000
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-green-100)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12l4 4 10-10"
                    stroke="var(--color-status-success)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-center text-sm font-semibold text-[color:var(--color-status-success)]">
              Pagamento aprovado
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <button
            type="button"
            className="w-full rounded-[var(--radius-sm)] bg-[color:var(--color-white)] px-6 py-3 text-base font-bold text-[color:var(--color-blue-800)] shadow-[var(--shadow-soft)]"
          >
            Reporta pedido
          </button>

          <section className="space-y-2">
            <h3 className="text-lg font-extrabold text-[color:var(--color-blue-800)]">
              Endereco de entrega
            </h3>
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-1 h-8 w-8 rounded-full bg-[color:var(--color-blue-800)]" />
              <div>
                <p className="font-bold text-[color:var(--color-blue-800)]">
                  A. Duque de Caxia, 2000
                </p>
                <p className="text-[color:var(--color-gray-300)]">
                  Aldeota - Torre 10 Apto 1105
                </p>
                <p className="text-[color:var(--color-gray-300)]">
                  Contato: (00)90000-0000
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ClienteLayout>
  );
}
