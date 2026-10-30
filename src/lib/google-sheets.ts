import { createSign } from "node:crypto";

type SheetLead = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  interest: string | null;
};

export async function appendLeadToGoogleSheet(
  lead: SheetLead,
): Promise<boolean> {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!email && !privateKey) return false;
  if (!email || !privateKey)
    throw new Error("Google Sheets credentials are incomplete");

  const spreadsheetId =
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
    "1Ax3UK62POpqoZ5Li7G5ZzpD2iT6P8kxMMr9_l2fE_B4";
  const range = process.env.GOOGLE_SHEETS_RANGE || "A:E";
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKey.replace(/\\n/g, "\n"), "base64url");
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!tokenResponse.ok) throw new Error("Google Sheets authentication failed");
  const token = await tokenResponse.json();
  if (typeof token.access_token !== "string" || !token.access_token)
    throw new Error("Google Sheets access token is missing");

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [
          [
            lead.full_name,
            lead.email,
            lead.phone,
            lead.country,
            lead.interest || "",
          ],
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error("Google Sheets append failed");
  const result = await response.json();
  if (result.updates?.updatedRows !== 1)
    throw new Error("Google Sheets row was not confirmed");
  return true;
}
