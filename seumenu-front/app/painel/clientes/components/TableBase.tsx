import { ReactNode } from "react";

type TableBaseProps = {
  headers: string[];
  children: ReactNode;
};

export function TableBase({ headers, children }: TableBaseProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[color:var(--brand-navy)]/10">
      <table className="min-w-full text-sm">
        <thead className="bg-[color:var(--brand-navy)]/5 text-left text-[color:var(--brand-navy)]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--brand-navy)]/10">{children}</tbody>
      </table>
    </div>
  );
}
