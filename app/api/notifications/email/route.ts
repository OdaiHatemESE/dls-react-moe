import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

interface EmailRequestBody {
  pdf64: string;
  to?: string;
  subject?: string;
  body?: string;
}

export async function POST(request: NextRequest) {
  const username = process.env.BASIC_EMAIL_USERNAME as string | undefined;
  const password = process.env.BASIC_EMAIL_PASSWORD as string | undefined;
  const clientId = process.env.CLIENT_EMAIL as string | undefined;

  if (!username || !password || !clientId) {
    return NextResponse.json(
      { error: "Server email configuration incomplete" },
      { status: 500 },
    );
  }

  const emailToken = Buffer.from(`${username}:${password}`).toString("base64");

  let body: EmailRequestBody;
  try {
    body = await request.json();
  } catch (_error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body.pdf64 !== "string" || body.pdf64.trim().length === 0) {
    return NextResponse.json({ error: "Missing PDF attachment" }, { status: 400 });
  }

  const pdfPayload = body.pdf64.trim();
  const base64Regex = /^[A-Za-z0-9+/=\s]+$/;
  if (!base64Regex.test(pdfPayload)) {
    return NextResponse.json({ error: "Invalid PDF base64 encoding" }, { status: 400 });
  }

  const explicitTo = typeof body.to === "string" ? body.to.trim() : "";
  let emailAddress = explicitTo;

  if (!emailAddress) {
    const authToken = request.cookies.get("authToken")?.value || "";
    if (!authToken) {
      return NextResponse.json({ error: "Missing auth cookie" }, { status: 401 });
    }

    const issuer = process.env.EXTERNAL_ISSUER || "";
    const audience = process.env.EXTERNAL_AUDIENCE || "";
    const jwksUrl = process.env.EXTERNAL_JWKS_URL || "";

    if (!issuer || !audience || !jwksUrl) {
      return NextResponse.json(
        { error: "Server JWT config incomplete" },
        { status: 500 },
      );
    }

    try {
      const JWKS = createRemoteJWKSet(new URL(jwksUrl));
      const { payload } = await jwtVerify(authToken, JWKS, { issuer, audience });
      emailAddress =
        (payload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        ] as string) ||
        (payload.email as string) ||
        "";
    } catch (_error) {
      return NextResponse.json({ error: "Invalid or expired auth token" }, { status: 401 });
    }

    if (!emailAddress) {
      return NextResponse.json({ error: "Email claim missing" }, { status: 400 });
    }
  }

  const htmlBody =
    body.body?.trim().length
      ? body.body
      : `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; direction: rtl;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;"><tr><td align="center"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"><tr><td align="center" bgcolor="#ba9a3a" style="padding: 20px; color: #ffffff; font-size: 22px; font-weight: bold;">ميثاق الشراكة بين ولي الامر والمدرسة</td></tr><tr><td style="padding: 30px 20px; text-align: right; color: #333333;"><p style="font-size: 16px; line-height: 1.6; margin: 15px 0;">عزيزي ولي الأمر..</p><p style="font-size: 16px; line-height: 1.6; margin: 15px 0;">يسعدنا إعلامك بأنه قد تم توقيع "ميثاق الشراكة بين المدرسة وولي الأمر" بنجاح. يمكنكم الاطلاع على الميثاق المُوقَّع في المرفقات.</p><p style="font-size: 16px; line-height: 1.6; margin: 15px 0;">نثمن دوركم، ونتطلع إلى تعاونكم ودعمكم المستمر للارتقاء بمسيرة أبنائكم التعليمية.</p><div style="height: 1px; background-color: #dddddd; margin: 20px 0;"></div><p style="font-size: 16px; line-height: 1.6; margin: 15px 0;">نتمنى لكم ولأبنائكم عاماً دراسياً مليئاً بالنجاحات.</p></td></tr><tr><td style="background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 12px; color: #777777;">&copy; 2024 جميع الحقوق محفوظة</td></tr></table></td></tr></table></body></html>`;

  const formData = JSON.stringify({
    To: emailAddress,
    Subject:
      body.subject?.trim().length
        ? body.subject
        : "ميثاق الشراكة بين ولي الامر والمدرسة",
    Body: htmlBody,
    attachmentAsBase64: [
      {
        Name: "ميثاق الشراكة.pdf",
        Base64: pdfPayload,
        MediaType: "application/pdf",
      },
    ],
  });

  try {
    const response = await fetch("https://apps.moe.gov.ae/email/api/email", {
      method: "POST",
      headers: {
        ClientId: clientId,
        Authorization: `Basic ${emailToken}`,
        "Content-Type": "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Failed Send Email", details: text },
        { status: response.status || 500 },
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json({ ok: true, providerResponse: data }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
