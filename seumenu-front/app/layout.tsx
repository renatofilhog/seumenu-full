import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seu Menu | Painel do Mantenedor",
  description: "Gestão de operações, cardápio e pedidos em tempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="antialiased">
      <body className="font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}
