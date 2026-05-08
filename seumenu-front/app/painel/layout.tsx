import { PanelThemeProvider } from "../components/dashboard/PanelThemeProvider";
import { PanelAccessGate } from "../components/dashboard/PanelAccessGate";

export default function PainelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PanelThemeProvider>
      <PanelAccessGate>{children}</PanelAccessGate>
    </PanelThemeProvider>
  );
}
