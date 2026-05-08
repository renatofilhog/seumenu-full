import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL, TENANT_CONTEXT_COOKIE } from "../../../lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const idOrNumero = url.searchParams.get("idOrNumero")?.trim();
  const tenantContext = (await cookies()).get(TENANT_CONTEXT_COOKIE)?.value;

  if (!idOrNumero) {
    return NextResponse.json({ message: "Pedido nao informado." }, { status: 400 });
  }

  if (!tenantContext) {
    return NextResponse.json({ message: "Contexto publico do tenant nao encontrado." }, { status: 401 });
  }

  const upstream = await fetch(
    `${API_BASE_URL}/pedido/status/events/${encodeURIComponent(idOrNumero)}`,
    {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "x-tenant-context-mode": "public",
        Cookie: `${TENANT_CONTEXT_COOKIE}=${tenantContext}`,
      },
      cache: "no-store",
      signal: request.signal,
    },
  );

  if (!upstream.ok || !upstream.body) {
    const body = await upstream.text().catch(() => "");
    return new NextResponse(body || "Falha ao conectar ao stream de status.", {
      status: upstream.status || 502,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));
    },
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      if (value) {
        controller.enqueue(value);
      }
    },
    async cancel() {
      await reader.cancel().catch(() => undefined);
    },
  });

  return new Response(stream, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
