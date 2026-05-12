import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#141312",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="120"
          height="130"
          viewBox="0 0 120 130"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shield */}
          <path
            d="M60 6 L108 24 V72 Q108 108 60 124 Q12 108 12 72 V24 Z"
            fill="#1c1a18"
            stroke="#d97706"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* Eye lids */}
          <path
            d="M28 72 Q60 42 92 72 Q60 102 28 72 Z"
            fill="none"
            stroke="#d97706"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Iris */}
          <circle cx="60" cy="72" r="16" fill="#d97706" />
          {/* Pupil */}
          <circle cx="60" cy="72" r="7" fill="#141312" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
