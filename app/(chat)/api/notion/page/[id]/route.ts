import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  try {
    const pageBlocks = await notion.blocks.children.list({ block_id: id });

    // Extract file URLs from image/pdf blocks
    const files = pageBlocks.results
      .filter((block: any) => block.type === "image")
      .map(
        (block: any) =>
          block[block.type].file?.url ?? block[block.type].external.url
      );

    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
