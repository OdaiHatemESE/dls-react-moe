import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { metricsTracker } from '@/lib/metrics-tracker';

interface SmsRequestBody {
  recipient?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/notifications/sms';
  
  const username = process.env.BASIC_SMS_USERNAME  ??  ""; 
  const password = process.env.BASIC_SMS_PASSWORD ?? "";
  const portalLink = process.env.NEXTAUTH_URL ?? "";
  const clientId = process.env.CLIENT_SMS ?? process.env.CLIENT_EMAIL ?? "";

  if (!username || !password || !clientId || !portalLink) {
    return NextResponse.json(
      { error: "Server SMS configuration incomplete" },
      { status: 500 },
    );
  }

  const smsToken = Buffer.from(`${username}:${password}`).toString("base64");

  let body: SmsRequestBody | null = null;
  try {
    body = await request.json();
  } catch (_error) {
    body = null;
  }

  const explicitRecipient =
    body && typeof body.recipient === "string" ? body.recipient.trim() : "";
  const explicitMessage =
    body && typeof body.message === "string" ? body.message.trim() : "";

  let mobilePhone = explicitRecipient;

  if (!mobilePhone) {
    const authToken = request.cookies.get("authToken")?.value || "";
    if (!authToken) {
      return NextResponse.json({ error: "Missing auth cookie" }, { status: 401 });
    }

    const issuer = process.env.EXTERNAL_ISSUER ?? "";
    const audience = process.env.EXTERNAL_AUDIENCE ?? "";
    const jwksUrl = process.env.EXTERNAL_JWKS_URL ?? "";

    if (!issuer || !audience || !jwksUrl) {
      return NextResponse.json(
        { error: "Server JWT config incomplete" },
        { status: 500 },
      );
    }

    try {
      const JWKS = createRemoteJWKSet(new URL(jwksUrl));
      const { payload } = await jwtVerify(authToken, JWKS, { issuer, audience });

      mobilePhone =
        (payload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone"
        ] as string) ||
        (payload.phone_number as string) ||
        (payload.mobile as string) ||
        "";
    } catch (_error) {
      return NextResponse.json(
        { error: "Invalid or expired auth token" },
        { status: 401 },
      );
    }

    if (!mobilePhone) {
      return NextResponse.json(
        { error: "Mobile phone claim missing" },
        { status: 400 },
      );
    }
  }

  if (!mobilePhone) {
    return NextResponse.json({ error: "Recipient missing" }, { status: 400 });
  }

  const message =
    explicitMessage.length > 0
      ? explicitMessage
      : 'عزيزي ولي الأمر، يسعدنا إعلامك بأنه قد تم توقيع "ميثاق الشراكة بين المدرسة وولي الأمر" بنجاح. يمكنك الحصول على نسخة من الميثاق عبر الرابط: ' +
        portalLink +
        ". نشكرك على دعمك المستمر.";

  const formData = JSON.stringify({
    recipient: mobilePhone,
    msg: message,
  });

  try {
    const response = await fetch("https://apps.moe.gov.ae/sms/api/SMS", {
      method: "POST",
      headers: {
        ClientId: clientId,
        Authorization: `Basic ${smsToken}`,
        "Content-Type": "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      return NextResponse.json(
        { error: "Failed to send SMS", details },
        { status: response.status || 500 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => "");

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({ ok: true, providerResponse: data }, { status: 200 });
  } catch (_error) {
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
