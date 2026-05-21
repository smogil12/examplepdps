import { NextResponse } from "next/server";

const PIXLEE_API_KEY = "tzO2V4pqcy4euiGWLxo7";
const ALBUM_ID = "63758810";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("per_page") ?? "30";

  const url = `https://distillery.pixlee.co/api/v2/albums/${ALBUM_ID}/photos?api_key=${PIXLEE_API_KEY}&page=${page}&per_page=${perPage}`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch UGC content" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
