import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-fonts";

const size = { width: 1200, height: 630 };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  // Letters, spaces, hyphens, apostrophes only; keeps the card tidy and safe
  const name = (params.get("name") ?? "").replace(/[^\p{L}\s'-]/gu, "").trim().slice(0, 24);
  const solved = params.get("solved") === "1";
  const headline = name ? `${name} applied to` : "I applied to";

  const [serif, sans] = await Promise.all([
    loadGoogleFont("Instrument+Serif:ital@1", "Texas Venture Operators."),
    loadGoogleFont("Geist:wght@500", `${headline} Founding cohort 01 · UT Austin's external engineering syndicate Challenge solved TVO`),
  ]);

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0a0a09",
          backgroundImage: "radial-gradient(ellipse 55% 75% at 100% 0%, rgba(255,165,89,0.2), transparent 70%)",
          color: "#f5f3ee",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#ffa559" />
            <path d="M9 10h14" stroke="#1a0f05" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M11 15.5l5 6.5 5-6.5" fill="none" stroke="#1a0f05" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div
            style={{
              display: "flex",
              padding: "10px 22px",
              borderRadius: 999,
              border: "1px solid rgba(245,243,238,0.18)",
              fontSize: 22,
              color: "#a8a59e",
            }}
          >
            Founding cohort 01
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, letterSpacing: -2.5, color: "#a8a59e" }}>{headline}</div>
          <div
            style={{
              fontFamily: "Instrument Serif",
              fontStyle: "italic",
              fontSize: 116,
              lineHeight: 1,
              color: "#ffa559",
              marginTop: 8,
            }}
          >
            Texas Venture Operators.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 24, color: "#85827b" }}>
          <span>UT Austin&apos;s external engineering syndicate</span>
          {solved && (
            <span
              style={{
                display: "flex",
                padding: "8px 18px",
                borderRadius: 999,
                background: "#ffa559",
                color: "#1a0f05",
              }}
            >
              Challenge solved
            </span>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "italic", weight: 400 },
        { name: "Geist", data: sans, style: "normal", weight: 500 },
      ],
      headers: {
        "Cache-Control": "public, max-age=86400, immutable",
        ...(params.get("download") ? { "Content-Disposition": 'attachment; filename="tvo-cohort-01.png"' } : {}),
      },
    },
  );
  return image;
}
