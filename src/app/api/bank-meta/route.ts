import { NextRequest, NextResponse } from "next/server";

// Fetches a prospect's homepage and extracts brand metadata so we can render
// them dynamically in the institution picker. Cached for 1 hour.

export const revalidate = 3600;

function pickPrimary(colors: Map<string, number>) {
  // Filter out near-black, near-white and grays — keep saturated brand colors.
  const ranked = [...colors.entries()]
    .filter(([hex]) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const lightness = (max + min) / 2;
      return sat > 0.18 && lightness > 24 && lightness < 232;
    })
    .sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0];
}

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) {
    return NextResponse.json(
      { error: "Missing ?domain=" },
      { status: 400 }
    );
  }

  const url = `https://${domain}/`;
  let html = "";
  try {
    const r = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        accept: "text/html",
      },
      next: { revalidate: 3600 },
    });
    if (!r.ok) {
      return NextResponse.json(
        { error: `Upstream ${r.status}` },
        { status: 502 }
      );
    }
    html = await r.text();
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 502 }
    );
  }

  const decode = (s: string) =>
    s
      .replace(/&#0?39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

  // Title / OG name
  const og = (re: RegExp) => {
    const m = html.match(re)?.[1]?.trim();
    return m ? decode(m) : undefined;
  };
  const name =
    og(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)/i) ||
    og(/<title>([^<]+)<\/title>/i) ||
    domain;

  const description =
    og(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i) ||
    og(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i
    );

  // Logo: prefer "white" or "stacked" variants for our dark UI.
  const logoCandidates = [
    ...html.matchAll(
      /(https?:\/\/[^"' )]+\.(?:png|svg|webp|jpg))/gi
    ),
  ]
    .map((m) => m[1])
    .filter((u) => /logo|brand|wp-content\/uploads/i.test(u));

  const pickLogo = (preferred: RegExp) =>
    logoCandidates.find((u) => preferred.test(u));

  const logo =
    pickLogo(/white/i) ||
    pickLogo(/stacked/i) ||
    pickLogo(/logo/i) ||
    logoCandidates[0];

  // Brand color: count hex occurrences in inline styles + linked CSS isn't
  // followed (1 RTT). Inline coverage is enough for most CMS-built sites.
  const colorCounts = new Map<string, number>();
  for (const m of html.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
    const k = "#" + m[1].toLowerCase();
    colorCounts.set(k, (colorCounts.get(k) || 0) + 1);
  }
  const primary = pickPrimary(colorCounts) || null;

  // Keep taglines short — first sentence only.
  const shortTagline = description
    ? description.split(/(?<=[.!?])\s+/)[0].slice(0, 120)
    : null;

  return NextResponse.json(
    {
      domain,
      name,
      tagline: shortTagline,
      logo_url: logo || null,
      primary_color: primary,
      fetched_at: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "public, max-age=0, s-maxage=3600",
      },
    }
  );
}
