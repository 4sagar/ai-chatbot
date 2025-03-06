import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json(
      { error: "Missing Notion token" },
      { status: 401 }
    );
  }

  const notion = new Client({ auth: token });

  try {
    const pages = await notion.search({
      filter: { value: "page", property: "object" },
    });

    return NextResponse.json(pages);
  } catch (error: any) {
    console.error("Notion API Error:", error); // Debugging
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
