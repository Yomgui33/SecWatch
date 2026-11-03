import { NextRequest, NextResponse } from "next/server";
import { ensureApiAuthenticated, getPublicError } from "@/lib/auth";
import {
  addPeaksysTopic,
  getPeaksysTopics,
  removePeaksysTopic,
  topicIdFromName,
} from "@/lib/sources/peaksys/topics";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  const topics = await getPeaksysTopics();
  return NextResponse.json({ topics });
}

export async function POST(req: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Nom du sujet requis." }, { status: 400 });
    }

    const id = topicIdFromName(name);
    const rawAliases: unknown[] = Array.isArray(body.aliases) ? body.aliases : [];
    const aliases = [
      ...new Set(
        rawAliases
          .filter((a): a is string => typeof a === "string")
          .map((a) => a.trim())
          .filter((a) => a && topicIdFromName(a) !== id)
      ),
    ];

    await addPeaksysTopic({ id, name, aliases });
    const topics = await getPeaksysTopics();
    return NextResponse.json({ topics });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await ensureApiAuthenticated();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id manquant" }, { status: 400 });
    }
    await removePeaksysTopic(id);
    const topics = await getPeaksysTopics();
    return NextResponse.json({ topics });
  } catch (error) {
    const publicError = getPublicError(error);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}
