"use client";

import { Sidebar } from "./Sidebar";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
  scope?: "app" | "saas";
};

export function MobileSidebar({ open, onClose, scope = "app" }: MobileSidebarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-[color:var(--color-white)] shadow-[var(--shadow-soft-lg)]">
        <div className="flex justify-end p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-gray-50)] text-[color:var(--color-gray-800)]"
            aria-label="Fechar menu"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <Sidebar variant="mobile" scope={scope} />
      </div>
    </div>
  );
}
