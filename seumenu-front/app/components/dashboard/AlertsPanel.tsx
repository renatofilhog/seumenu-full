export function AlertsPanel() {
  return (
    <div className="rounded-[var(--radius-md)] bg-[color:var(--color-blue-800)] p-6 text-white shadow-[var(--shadow-soft-lg)] opacity-70">
      <p className="text-xs uppercase tracking-[0.3em] text-white/70">
        Alertas
      </p>
      <h3 className="mt-2 text-2xl font-extrabold">Alertas criticos</h3>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
        Desativado
      </p>
      <div className="mt-4 flex flex-col gap-3 text-sm">
        <div className="rounded-[var(--radius-md)] bg-white/10 p-4">
          <p className="font-extrabold">Mesa 12 aguardando resposta</p>
          <p className="text-xs font-bold text-white/70">
            Pedido #3098 em analise ha 6 minutos
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] bg-white/10 p-4">
          <p className="font-extrabold">Estoque baixo</p>
          <p className="text-xs font-bold text-white/70">
            Mucarela premium - 3 unidades
          </p>
        </div>
      </div>
      <button
        className="mt-5 w-full cursor-not-allowed rounded-full bg-white/70 py-2 text-sm font-extrabold text-[color:var(--color-blue-800)]"
        type="button"
        disabled
      >
        Ver painel completo
      </button>
    </div>
  );
}
