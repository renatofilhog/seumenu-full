import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL, AUTH_TOKEN_COOKIE } from "../../../lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const upstream = await fetch(`${API_BASE_URL}/pedido/events`, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
    cache: "no-store",
    signal: request.signal,
  });

  if (!upstream.ok || !upstream.body) {
    const body = await upstream.text().catch(() => "");
    return new NextResponse(body || "Falha ao conectar ao stream de pedidos.", {
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
