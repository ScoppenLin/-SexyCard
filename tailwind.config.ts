import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        velvet: "#4b1024",
        wine: "#7a1f3d",
        plum: "#251326",
        gold: "#c8a15a",
        ink: "#08060a"
      },
      boxShadow: {
        card: "0 22px 70px rgba(0, 0, 0, 0.42)"
      }
    }
  },
  plugins: []
};

export default config;
