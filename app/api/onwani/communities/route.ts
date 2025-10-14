import { NextResponse } from "next/server";
import dns from "node:dns";
import https from "node:https";
import fs from "node:fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const municipality = searchParams.get("municipality");
  const district = searchParams.get("district") || searchParams.get("DISTRICT_NAME_EN");

  if (!municipality || !district) {
    return NextResponse.json(
      { error: "Missing required parameters: municipality and district" },
      { status: 400 }
    );
  }

  try {
    const upstream = new URL("https://onwani.abudhabi.ae/tamm/api/getcommunities");
    upstream.searchParams.set("municipality", municipality);
  upstream.searchParams.set("DISTRICT_NAME_EN", district);

    const useInsecure = ["1", "true", "yes"].includes((process.env.ONWANI_INSECURE_TLS || "").toLowerCase());
    let ca: string | Buffer | Array<string | Buffer> | undefined = undefined;
    const caInline = process.env.ONWANI_CA_CERT;
    const caFile = process.env.ONWANI_CA_FILE;
    try {
      if (caInline && caInline.trim()) {
        ca = caInline;
      } else if (caFile && caFile.trim()) {
        ca = fs.readFileSync(caFile);
      }
    } catch {}
    const agent = new https.Agent({ rejectUnauthorized: !useInsecure, ca });

    type UpstreamResult =
      | { ok: true; data: unknown }
      | { ok: false; status: number; statusText?: string; body: unknown };

    const result: UpstreamResult = await new Promise((resolve) => {
      const req = https.request(
        upstream,
        {
          method: "GET",
          agent,
          headers: {
            Accept: "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
            Referer: "https://onwani.abudhabi.ae/",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
          res.on("end", () => {
            const bodyStr = Buffer.concat(chunks).toString("utf8");
            const status = res.statusCode || 0;
            const statusText = res.statusMessage || undefined;
            if (status >= 400) {
              try {
                resolve({ ok: false, status, statusText, body: JSON.parse(bodyStr) });
              } catch {
                resolve({ ok: false, status, statusText, body: bodyStr });
              }
            } else {
              try {
                resolve({ ok: true, data: JSON.parse(bodyStr) });
              } catch {
                resolve({ ok: true, data: bodyStr });
              }
            }
          });
        }
      );
      req.on("error", (err) => {
        resolve({ ok: false, status: 502, statusText: "Bad Gateway", body: { error: (err as Error).message } });
      });
      req.end();
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.body, status: result.status, statusText: result.statusText, url: upstream.toString() },
        { status: result.status || 502 }
      );
    }

    return NextResponse.json<unknown>(result.data);
  } catch (e: unknown) {
    let message = "Server error";
    let code: string | null = null;
    if (e && typeof e === "object") {
      const maybeErr = e as { message?: string; code?: string; cause?: { code?: string } };
      message = maybeErr.message || message;
      code = maybeErr.code || maybeErr.cause?.code || null;
    }
    return NextResponse.json(
      { error: message, code, note: "Upstream fetch failed" },
      { status: 500 }
    );
  }
}
