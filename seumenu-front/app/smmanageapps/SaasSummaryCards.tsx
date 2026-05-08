"use client";

import { useEffect, useState } from "react";
import { fetchSaasSummary, type SaasSummary } from "./clientes/clientes-api";

export function SaasSummaryCards() {
  const [summary, setSummary] = useState<SaasSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchSaasSummary()
      .then((data) => {
        if (!mounted) return;
        setSummary(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar indicadores SaaS.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-[var(--radius-md)] border border-[color:var(--brand-navy)]/10 bg-[color:var(--color-white)] p-5 shadow-[var(--shadow-soft)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--brand-navy)]/60">
          Tenants ativos
        </p>
        <p className="mt-3 text-4xl font-extrabold text-[color:var(--brand-ink)]">
          {summary ? summary.activeTenants : "—"}
        </p>
      </article>

      <article className="rounded-[var(--radius-md)] border border-[color:var(--brand-navy)]/10 bg-[color:var(--color-white)] p-5 shadow-[var(--shadow-soft)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--brand-navy)]/60">
          Licencas vencendo este mes
        </p>
        <p className="mt-3 text-4xl font-extrabold text-[color:var(--brand-ink)]">
          {summary ? summary.licensesExpiringThisMonth : "—"}
        </p>
      </article>

      {error ? (
        <div className="md:col-span-2 rounded-[var(--radius-md)] border border-[color:var(--brand-red)]/40 bg-[color:var(--brand-red)]/10 p-4 text-sm text-[color:var(--brand-ink)]">
          {error}
        </div>
      ) : null}
    </section>
  );
}
