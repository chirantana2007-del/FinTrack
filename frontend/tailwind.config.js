/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": { "inverse-surface": "#28313d", "surface-container-lowest": "#ffffff", "error": "#ba1a1a", "tertiary": "#0b0600", "surface-variant": "#dae3f4", "outline": "#75777e", "on-secondary": "#ffffff", "on-secondary-container": "#00714d", "surface-container-highest": "#dae3f4", "background": "#f8f9ff", "secondary": "#006c4a", "primary-fixed-dim": "#b5c7ea", "error-container": "#ffdad6", "primary": "#000615", "tertiary-fixed-dim": "#f6be39", "on-tertiary-container": "#ac8000", "secondary-fixed": "#86f8c3", "tertiary-container": "#2a1d00", "surface": "#f8f9ff", "on-primary-fixed": "#071c36", "primary-container": "#0b1f3a", "surface-container-low": "#eff4ff", "surface-dim": "#d1daeb", "on-primary-fixed-variant": "#364764", "on-background": "#131c28", "inverse-on-surface": "#eaf1ff", "on-surface-variant": "#44474d", "on-surface": "#131c28", "on-tertiary-fixed": "#261a00", "inverse-primary": "#b5c7ea", "tertiary-fixed": "#ffdfa0", "surface-bright": "#f8f9ff", "surface-container-high": "#e0e9f9", "outline-variant": "#c4c6ce", "on-primary": "#ffffff", "surface-container": "#e5eeff", "secondary-container": "#83f5c0", "on-error-container": "#93000a", "on-tertiary": "#ffffff", "primary-fixed": "#d6e3ff", "on-primary-container": "#7587a7", "on-secondary-fixed-variant": "#005237", "on-secondary-fixed": "#002114", "secondary-fixed-dim": "#69dba8", "on-error": "#ffffff", "surface-tint": "#4d5f7d", "on-tertiary-fixed-variant": "#5c4300" },
      "borderRadius": { "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem" },
      "spacing": { "space-lg": "1.5rem", "margin-desktop": "2rem", "margin": "1rem", "gutter": "1rem", "space-xs": "0.25rem", "gutter-desktop": "1.5rem", "space-sm": "0.5rem", "space-xl": "2.5rem", "space-md": "1rem" },
      "fontFamily": { "headline-sm": ["Newsreader"], "display-lg-mobile": ["Newsreader"], "body-md": ["Inter"], "headline-md": ["Newsreader"], "label-sm": ["Inter"], "body-lg": ["Inter"], "label-md": ["Inter"], "numeric-md": ["Inter"], "body-sm": ["Inter"], "display-lg": ["Newsreader"], "numeric-lg": ["Inter"], "numeric-sm": ["Inter"], "headline-lg": ["Newsreader"] },
      "fontSize": { "headline-sm": ["1.125rem", { "lineHeight": "1.625rem", "fontWeight": "500" }], "display-lg-mobile": ["1.75rem", { "lineHeight": "2.25rem", "letterSpacing": "-0.01em", "fontWeight": "600" }], "body-md": ["0.875rem", { "lineHeight": "1.375rem", "fontWeight": "400" }], "headline-md": ["1.375rem", { "lineHeight": "1.875rem", "letterSpacing": "-0.01em", "fontWeight": "500" }], "label-sm": ["0.6875rem", { "lineHeight": "0.875rem", "letterSpacing": "0.04em", "fontWeight": "600" }], "body-lg": ["1rem", { "lineHeight": "1.5rem", "fontWeight": "400" }], "label-md": ["0.8125rem", { "lineHeight": "1.125rem", "letterSpacing": "0.01em", "fontWeight": "500" }], "numeric-md": ["0.875rem", { "lineHeight": "1.25rem", "fontWeight": "500" }], "body-sm": ["0.75rem", { "lineHeight": "1.125rem", "fontWeight": "400" }], "display-lg": ["2.25rem", { "lineHeight": "2.75rem", "letterSpacing": "-0.02em", "fontWeight": "600" }], "numeric-lg": ["1.5rem", { "lineHeight": "2rem", "letterSpacing": "-0.02em", "fontWeight": "600" }], "numeric-sm": ["0.75rem", { "lineHeight": "1rem", "fontWeight": "500" }], "headline-lg": ["1.75rem", { "lineHeight": "2.25rem", "letterSpacing": "-0.015em", "fontWeight": "600" }] }
    },
  },
  plugins: [],
}
