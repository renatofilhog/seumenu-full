import { NextResponse } from "next/server";
import { API_BASE_URL, TENANT_CONTEXT_COOKIE } from "../../lib/api";

type TenantContextResponse = {
  token: string;
  tenant: {
    id: number;
    slug: string;
    nome: string;
  };
};

function normalizeHost(host: string): string {
  return host.split(":")[0]?.trim().toLowerCase() ?? "";
}

function isLocalHost(host: string): boolean {
  return !host || host === "localhost" || /^[0-9.]+$/.test(host);
}

function resolveApiHost(): string | null {
  try {
    return normalizeHost(new URL(API_BASE_URL).host);
  } catch {
    return null;
  }
}

function findCommonDomainSuffix(appHost: string, apiHost: string): string | undefined {
  if (!appHost || !apiHost || appHost === apiHost) {
    return undefined;
  }

  const appLabels = appHost.split(".").filter(Boolean);
  const apiLabels = apiHost.split(".").filter(Boolean);
  const common: string[] = [];

  let appIndex = appLabels.length - 1;
  let apiIndex = apiLabels.length - 1;

  while (appIndex >= 0 && apiIndex >= 0 && appLabels[appIndex] === apiLabels[apiIndex]) {
    common.unshift(appLabels[appIndex]);
    appIndex -= 1;
    apiIndex -= 1;
  }

  if (common.length < 2) {
    return undefined;
  }

  return `.${common.join(".")}`;
}

function resolveCookieDomain(host: string): string | undefined {
  const normalizedHost = normalizeHost(host);
  if (isLocalHost(normalizedHost)) {
    return undefined;
  }

  const explicitDomain = process.env.TENANT_CONTEXT_COOKIE_DOMAIN?.trim();
  if (explicitDomain) {
    return explicitDomain;
  }

  const apiHost = resolveApiHost();
  if (!apiHost || isLocalHost(apiHost)) {
    return undefined;
  }

  return findCommonDomainSuffix(normalizedHost, apiHost);
}

function getFirstHeaderValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.split(",")[0]?.trim();
  return normalizedValue || null;
}

function resolveRequestOrigin(request: Request): URL {
  const requestUrl = new URL(request.url);
  const forwardedHost = getFirstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || getFirstHeaderValue(request.headers.get("host")) || requestUrl.host;
  const forwardedProto = getFirstHeaderValue(request.headers.get("x-forwarded-proto"));
  const proto = forwardedProto || requestUrl.protocol.replace(":", "");

  return new URL(`${proto}://${host}`);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const normalizedSlug = slug.trim().toLowerCase();
  const requestOrigin = resolveRequestOrigin(request);
  const cookieDomain = resolveCookieDomain(requestOrigin.host);
  const redirectUrl = new URL("/", requestOrigin);
  const response = NextResponse.redirect(redirectUrl);

  if (!normalizedSlug || !/^[a-z0-9-]+$/.test(normalizedSlug)) {
    response.cookies.set(TENANT_CONTEXT_COOKIE, "", {
      sameSite: "lax",
      path: "/",
      secure: requestOrigin.protocol === "https:",
      domain: cookieDomain,
      maxAge: 0,
    });
    return response;
  }

  try {
    const apiResponse = await fetch(
      `${API_BASE_URL}/tenant/context/${encodeURIComponent(normalizedSlug)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!apiResponse.ok) {
      response.cookies.set(TENANT_CONTEXT_COOKIE, "", {
        sameSite: "lax",
        path: "/",
        secure: requestOrigin.protocol === "https:",
        domain: cookieDomain,
        maxAge: 0,
      });
      return response;
    }

    const payload = (await apiResponse.json()) as TenantContextResponse;
    response.cookies.set(TENANT_CONTEXT_COOKIE, payload.token, {
      sameSite: "lax",
      path: "/",
      secure: requestOrigin.protocol === "https:",
      domain: cookieDomain,
    });
    return response;
  } catch {
    response.cookies.set(TENANT_CONTEXT_COOKIE, "", {
      sameSite: "lax",
      path: "/",
      secure: requestOrigin.protocol === "https:",
      domain: cookieDomain,
      maxAge: 0,
    });
    return response;
  }
}
