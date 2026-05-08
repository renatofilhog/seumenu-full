"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_USER_STORAGE } from "../../lib/api";

type StoredAppUser = {
  id: number;
  nome: string;
  email: string;
  role: string;
  forcePasswordChange?: boolean;
};

const FIRST_ACCESS_PATH = "/painel/primeiro-acesso";
const LOGIN_PATH = "/painel/login";

function readStoredUser(): StoredAppUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAppUser;
  } catch {
    return null;
  }
}

export function PanelAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = readStoredUser();
    const forcePasswordChange = Boolean(user?.forcePasswordChange);
    const isLoginPath = pathname.startsWith(LOGIN_PATH);
    const isFirstAccessPath = pathname.startsWith(FIRST_ACCESS_PATH);

    if (forcePasswordChange && !isLoginPath && !isFirstAccessPath) {
      router.replace(FIRST_ACCESS_PATH);
      return;
    }

    if (!forcePasswordChange && isFirstAccessPath) {
      router.replace("/painel");
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
