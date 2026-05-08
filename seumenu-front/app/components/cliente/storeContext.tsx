"use client";

import { createContext, useContext } from "react";

type StoreInfo = {
  id?: number;
  nome?: string;
  bannerUrl?: string;
  logoUrl?: string;
  corFundo?: string;
  horarioFuncionamento?: string;
};

const StoreContext = createContext<StoreInfo | null>(null);

export function StoreProvider({
  value,
  children,
}: {
  value: StoreInfo | null;
  children: React.ReactNode;
}) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStoreInfo() {
  return useContext(StoreContext);
}
