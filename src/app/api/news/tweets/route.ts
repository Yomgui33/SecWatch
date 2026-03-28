import { NextResponse } from "next/server";
import { fetchHomeTimeline } from "@/lib/sources/twitter/api";
import { getXCredentials } from "@/lib/sources/twitter/credentials";

export const dynamic = "force-dynamic";

export async function GET() {
  const creds = await getXCredentials();

  if (!creds) {
    return NextResponse.json({
      error: "credentials_missing",
      message:
        "Les cookies Twitter/X ne sont pas configurés. Rendez-vous sur la page Admin pour les ajouter.",
      tweets: [],
      total: 0,
    });
  }

  try {
    const tweets = await fetchHomeTimeline(creds);
    return NextResponse.json({ tweets, total: tweets.length });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "cookies_expired"
        ? "Les cookies Twitter/X ont expiré. Renouvelez-les depuis la page Admin."
        : "Impossible de récupérer le fil Twitter/X.";

    const errorCode =
      error instanceof Error && error.message === "cookies_expired"
        ? "cookies_expired"
        : "fetch_failed";

    return NextResponse.json(
      { error: errorCode, message, tweets: [], total: 0 },
      { status: errorCode === "cookies_expired" ? 200 : 502 }
    );
  }
}
