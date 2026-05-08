"use client";

import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import Image from "next/image";
import { useState } from "react";

type PageShellProps = {
  children: React.ReactNode;
  title?: string;
  scope?: "app" | "saas";
};

export function PageShell({ children, title = "Painel", scope = "app" }: PageShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[color:var(--brand-sand)]/88">
      <Sidebar scope={scope} />
      <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} scope={scope} />

      <header className="flex items-center justify-between bg-[color:var(--panel-topbar-bg)] px-6 py-6 text-[color:var(--panel-topbar-fg)] shadow-[var(--shadow-soft-lg)] lg:hidden">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--panel-topbar-fg)]/20 text-[color:var(--panel-topbar-fg)]"
          aria-label="Abrir menu"
          onClick={() => setMenuOpen(true)}
        >
          <span aria-hidden="true">≡</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-green-500)]">
            <Image
              src="/brand/LogoSeuMenu.png"
              alt="Seu Menu"
              width={30}
              height={30}
            />
          </div>
          <span className="text-sm font-extrabold text-[color:var(--panel-topbar-fg)]">{title}</span>
        </div>
        <button
          type="button"
          aria-label="Notificacoes"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--panel-topbar-fg)]/20"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 4C9.24 4 7 6.24 7 9v3.25c0 .64-.26 1.25-.7 1.7L5 15.25h14l-1.3-1.3c-.45-.45-.7-1.06-.7-1.7V9c0-2.76-2.24-5-5-5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 18a2.5 2.5 0 0 0 5 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <div className="mx-auto w-full max-w-screen-2xl px-6 pb-10 pt-20 lg:px-6 lg:pl-[320px] lg:pt-10">
        <main className="flex w-full flex-col gap-10">{children}</main>
      </div>
    </div>
  );
}
