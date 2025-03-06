import { NextResponse } from "next/server";

export async function GET() {
  const authUrl = new URL("https://api.notion.com/v1/oauth/authorize");

  authUrl.searchParams.append(
    "client_id",
    process.env.NOTION_CLIENT_ID as string
  );
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("owner", "user"); // "user" or "workspace"
  authUrl.searchParams.append(
    "redirect_uri",
    process.env.NOTION_REDIRECT_URI as string
  );

  return NextResponse.json({ url: authUrl.toString() });
}
