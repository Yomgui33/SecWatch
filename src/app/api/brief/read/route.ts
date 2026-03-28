import { NextRequest, NextResponse } from "next/server";
import { getBriefReadIds, markBriefRead, markBriefUnread, markManyBriefRead } from "@/lib/sources/brief/read";

export const dynamic = "force-dynamic";

export async function GET() {
  const [cveReadIds, tweetReadIds] = await Promise.all([
    getBriefReadIds("cves"),
    getBriefReadIds("tweets"),
  ]);
  return NextResponse.json({ cveReadIds, tweetReadIds });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source } = body as { source: "cves" | "tweets" };

  if (source !== "cves" && source !== "tweets") {
    return NextResponse.json({ error: "source invalide" }, { status: 400 });
  }

  // Marquer plusieurs éléments
  if (Array.isArray(body.ids)) {
    await markManyBriefRead(source, body.ids);
    return NextResponse.json({ ok: true });
  }

  // Marquer un seul élément
  const { id, read } = body as { id: string; read: boolean };
  if (!id) {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }

  if (read) {
    await markBriefRead(source, id);
  } else {
    await markBriefUnread(source, id);
  }

  return NextResponse.json({ ok: true });
}
