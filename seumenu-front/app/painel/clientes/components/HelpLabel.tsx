"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";

type HelpLabelProps = {
  label: string;
  help: string;
  children: ReactNode;
};

export function HelpLabel({ label, help, children }: HelpLabelProps) {
  const [open, setOpen] = useState(false);
  const helpId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      const isOnTrigger = triggerRef.current?.contains(target);
      const isOnTooltip = tooltipRef.current?.contains(target);
      if (!isOnTrigger && !isOnTooltip) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="flex flex-col gap-1 text-sm text-[color:var(--brand-ink)]">
      <span className="relative inline-flex items-center gap-2 font-medium">
        {label}
        <button
          ref={triggerRef}
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--brand-navy)]/25 text-xs text-[color:var(--brand-navy)]"
          onClick={() => setOpen((current) => !current)}
          aria-label={`Ajuda: ${help}`}
          aria-expanded={open ? "true" : "false"}
          aria-controls={helpId}
        >
          ?
        </button>
        {open ? (
          <span
            ref={tooltipRef}
            id={helpId}
            role="tooltip"
            className="absolute left-0 top-full z-20 mt-2 w-72 max-w-[90vw] rounded-xl border border-[color:var(--brand-navy)]/20 bg-[color:var(--color-white)] p-3 text-xs font-normal leading-5 text-[color:var(--brand-ink)] shadow-[var(--shadow-soft)]"
          >
            {help}
          </span>
        ) : null}
      </span>
      {children}
    </div>
  );
}
