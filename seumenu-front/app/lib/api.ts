export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8089";
export const AUTH_TOKEN_COOKIE = "seumenu_access_token";
export const AUTH_USER_STORAGE = "seumenu_user";
export const SAAS_AUTH_TOKEN_COOKIE = "seumenu_saas_access_token";
export const SAAS_AUTH_USER_STORAGE = "seumenu_saas_user";
export const TENANT_CONTEXT_COOKIE = "seumenu_tenant_context";
export const AUTH_REMEMBERED_LOGIN_STORAGE = "seumenu_remembered_login";
export const SAAS_REMEMBERED_LOGIN_STORAGE = "seumenu_saas_remembered_login";
export const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AuthScope = "app" | "saas";
export type ApiAuthScope = AuthScope | "public";
export type RememberedLogin = {
  email: string;
  senha: string;
  rememberMe: boolean;
  expiresAt: number;
};

type ApiError = {
  message: string;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

function getClientToken(tokenCookie: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${tokenCookie}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

async function readResponseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

type ApiRequestOptions = RequestInit & {
  token?: string | null;
  authScope?: ApiAuthScope;
};

function getAuthConfig(scope: AuthScope) {
  if (scope === "saas") {
    return {
      tokenCookie: SAAS_AUTH_TOKEN_COOKIE,
      userStorage: SAAS_AUTH_USER_STORAGE,
      rememberedLoginStorage: SAAS_REMEMBERED_LOGIN_STORAGE,
      loginPath: "/smmanageapps/login",
    };
  }

  return {
    tokenCookie: AUTH_TOKEN_COOKIE,
    userStorage: AUTH_USER_STORAGE,
    rememberedLoginStorage: AUTH_REMEMBERED_LOGIN_STORAGE,
    loginPath: "/painel/login",
  };
}

export function setAuthCookie(
  scope: AuthScope,
  accessToken: string,
  persistent: boolean,
) {
  const authConfig = getAuthConfig(scope);
  const maxAge = persistent ? `; Max-Age=${REMEMBER_ME_MAX_AGE_SECONDS}` : "";
  document.cookie = `${authConfig.tokenCookie}=${accessToken}; Path=/${maxAge}; SameSite=Lax`;
}

export function clearAuthCookie(scope: AuthScope) {
  const authConfig = getAuthConfig(scope);
  document.cookie = `${authConfig.tokenCookie}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function loadRememberedLogin(scope: AuthScope): RememberedLogin | null {
  if (typeof window === "undefined") {
    return null;
  }

  const authConfig = getAuthConfig(scope);
  try {
    const raw = localStorage.getItem(authConfig.rememberedLoginStorage);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as RememberedLogin;
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(authConfig.rememberedLoginStorage);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(authConfig.rememberedLoginStorage);
    return null;
  }
}

export function saveRememberedLogin(
  scope: AuthScope,
  credentials: Omit<RememberedLogin, "expiresAt">,
) {
  if (typeof window === "undefined") {
    return;
  }

  const authConfig = getAuthConfig(scope);
  const expiresAt = Date.now() + REMEMBER_ME_MAX_AGE_SECONDS * 1000;
  localStorage.setItem(
    authConfig.rememberedLoginStorage,
    JSON.stringify({ ...credentials, expiresAt }),
  );
}

export function clearRememberedLogin(scope: AuthScope) {
  if (typeof window === "undefined") {
    return;
  }

  const authConfig = getAuthConfig(scope);
  localStorage.removeItem(authConfig.rememberedLoginStorage);
}

export async function apiRequest<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T> {
  const authScope = options?.authScope ?? "app";
  const authConfig = authScope === "public" ? null : getAuthConfig(authScope);
  let token: string | null = null;
  if (authScope !== "public" && authConfig) {
    token =
      options?.token === undefined
        ? getClientToken(authConfig.tokenCookie)
        : (options.token ?? null);
  }
  const headers = new Headers(options?.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const bodyExists = options?.body !== undefined && options?.body !== null;
  const isFormDataBody =
    typeof FormData !== "undefined" && options?.body instanceof FormData;
  if (bodyExists && !isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (authScope === "public" && !headers.has("x-tenant-context-mode")) {
    headers.set("x-tenant-context-mode", "public");
  }

  if (typeof window !== "undefined" && authScope === "app") {
    const host = window.location.host;
    if (host && !headers.has("x-tenant-host")) {
      headers.set("x-tenant-host", host);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers,
    credentials: options?.credentials ?? "include",
  });

  if (!response.ok) {
    const errorPayload = (await readResponseJson(response)) as ApiError | null;
    const message = errorPayload?.message || `Request failed: ${response.status}`;
    if (response.status === 401 && typeof window !== "undefined" && token && authConfig) {
      document.cookie = `${authConfig.tokenCookie}=; Path=/; Max-Age=0; SameSite=Lax`;
      localStorage.removeItem(authConfig.userStorage);
      sessionStorage.removeItem(authConfig.userStorage);
      window.location.assign(authConfig.loginPath);
    }
    throw new ApiRequestError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await readResponseJson(response)) as T;
}

export async function apiGet<T>(
  path: string,
  token?: string | null,
  authScope?: ApiAuthScope,
): Promise<T> {
  return apiRequest<T>(path, { method: "GET", token, authScope });
}

export async function apiPost<TResponse, TBody>(
  path: string,
  body: TBody,
  token?: string | null,
  authScope?: ApiAuthScope,
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "POST",
    token,
    authScope,
    body: JSON.stringify(body),
  });
}
