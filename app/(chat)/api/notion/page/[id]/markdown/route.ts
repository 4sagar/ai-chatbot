import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
const { NotionToMarkdown } = require("notion-to-md");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json(
      { error: "Missing Notion token" },
      { status: 401 }
    );
  }
  const { id } = await params;

  const notion = new Client({ auth: token });
  const n2m = new NotionToMarkdown({
    notionClient: notion,
    config: {
      parseChildPages: false,
    },
  });

  try {
    const mdBlocks = await n2m.pageToMarkdown(id);
    const mdString = n2m.toMarkdownString(mdBlocks);

    return new NextResponse(mdString.parent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="notion-page.md"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
