import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        paper: "#f6f7f4",
        line: "#dfe4de",
        accent: "#2f6f58",
        accentDark: "#245542"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23,33,27,.05), 0 8px 24px rgba(23,33,27,.04)"
      }
    }
  },
  plugins: []
};
export default config;
