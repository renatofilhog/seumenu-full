import { PanelThemeProvider } from "../components/dashboard/PanelThemeProvider";

export default function SmManageAppsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PanelThemeProvider>{children}</PanelThemeProvider>;
}
