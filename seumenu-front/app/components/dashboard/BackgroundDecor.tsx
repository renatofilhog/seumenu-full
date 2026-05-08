export function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute -left-32 top-10 h-64 w-64 rounded-full bg-[color:var(--brand-yellow)]/20 blur-3xl animate-[float-shift_16s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-8 top-32 h-72 w-72 rounded-full bg-[color:var(--brand-green)]/20 blur-3xl animate-[float-shift_20s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute bottom-10 right-1/3 h-80 w-80 rounded-full bg-[color:var(--brand-navy)]/15 blur-[90px]" />
    </>
  );
}
