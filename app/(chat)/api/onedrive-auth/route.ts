import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.ONEDRIVE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_ONEDRIVE_REDIRECT_URI;

  const authUrl =
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=Files.ReadWrite offline_access&response_mode=query`.replace(
      /\n/g,
      ""
    );
  return NextResponse.json({ url: authUrl });
}
