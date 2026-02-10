import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Kobonz.site original brand colors
        'brand-primary': '#bf0000',
        'brand-secondary': '#9c88ff',
        'brand-accent': '#ff9f73',
        'brand-success': '#5fb3d3',
        'brand-warning': '#ffbe73',
        'brand-danger': '#ff8a80',
        'brand-dark': '#2d3436',
        'brand-light': '#fdfdfd',
        'brand-purple': '#a8a8ff',
        'brand-pink': '#ff9eb5',
        'brand-muted': '#8e9aaf',
        'brand-calm': '#e8f4fd',
        'brand-soft': '#f7f9fc',
        
        // Keep shadcn/ui variables but map to kobonz colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "var(--brand-primary)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--brand-secondary)",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "var(--brand-danger)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "var(--brand-muted)",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "var(--brand-accent)",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
