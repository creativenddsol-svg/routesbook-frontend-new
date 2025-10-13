// tailwind.config.js
const defaultTheme = require("tailwindcss/defaultTheme"); // Required for font fallbacks

module.exports = {
  darkMode: 'media', // 👈 Follow system (iOS/Android) dark mode automatically
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // ## TYPOGRAPHY UPGRADE ##
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans], // Set Inter as the primary sans-serif font
        heading: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans], // Use Plus Jakarta Sans for headings
      },
      // Define custom font sizes and line heights for a more compact, enterprise-grade design
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.8125rem", { lineHeight: "1.25rem" }], // 13px
        base: ["0.875rem", { lineHeight: "1.375rem" }], // 14px
        md: ["1rem", { lineHeight: "1.5rem" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.875rem" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
        "5xl": ["3rem", { lineHeight: "1" }], // 48px
      },
      lineHeight: {
        none: "1",
        tight: "1.25",   // For main headings
        snug: "1.375",   // For subheadings
        normal: "1.5",   // Default for body text
        relaxed: "1.625" // For longer paragraphs
      },
    },
  },
  plugins: [],
};
