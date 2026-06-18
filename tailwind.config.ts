import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0e17",
        panel: "#111726",
        edge: "#1e2940",
        brand: "#6ea8fe",
        accent: "#7ef0c2",
        warn: "#ffd166",
        danger: "#ff6b8b",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
