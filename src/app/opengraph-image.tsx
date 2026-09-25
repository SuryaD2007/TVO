import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-fonts";

export const alt = "Texas Venture Operators: High-Velocity Engineering for Austin Startups";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [serif, sans] = await Promise.all([
    loadGoogleFont("Instrument+Serif:ital@1", "Austin startups."),
    loadGoogleFont("Geist:wght@500", "High-velocity engineering for UT Austin's external engineering syndicate Texas Venture Operators Cohort 01 forming"),
  ]);

  return new ImageResponse(
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
          backgroundImage:
            "radial-gradient(ellipse 60% 70% at 90% -10%, rgba(255,165,89,0.16), transparent 70%)",
          color: "#f5f3ee",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="52" height="52" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="9" fill="#ffa559" />
              <path d="M9 10h14" stroke="#1a0f05" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M11 15.5l5 6.5 5-6.5" fill="none" stroke="#1a0f05" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 28, letterSpacing: -0.5 }}>Texas Venture Operators</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, color: "#a8a59e" }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "#ffa559" }} />
            Cohort 01 forming
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, letterSpacing: -5, lineHeight: 0.95 }}>High-velocity</div>
          <div style={{ fontSize: 96, letterSpacing: -5, lineHeight: 0.95 }}>engineering for</div>
          <div style={{ fontSize: 108, fontFamily: "Instrument Serif", fontStyle: "italic", color: "#ffa559", lineHeight: 1.05 }}>
            Austin startups.
          </div>
          <div style={{ marginTop: 24, fontSize: 26, color: "#a8a59e" }}>
            UT Austin&apos;s external engineering syndicate
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "italic", weight: 400 },
        { name: "Geist", data: sans, style: "normal", weight: 500 },
      ],
    },
  );
}

