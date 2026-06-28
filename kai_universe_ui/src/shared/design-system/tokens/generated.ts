// GENERATED — do not edit by hand. Regenerate: npm run tokens:build
// Source: src/shared/design-system/tokens/source/**/Mode 1.tokens.json
//
// This module is the bridge between the Infinity DTCG export and our Tailwind
// config / any other code that needs token values at compile time.
// `npm run tokens:verify` enforces that every value here matches the DTCG source.

/* eslint-disable */

// Color primitives — raw color ramps (Blue, Neutral, Error, Warning, Success, etc.)
export const primitives = {
  Blue: {
    "50": "#022554",
    "100": "#02377E",
    "200": "#034093",
    "300": "#0453BD",
    "400": "#045CD2",
    "500": "#1D6CD7",
    "600": "#4F8DE0",
    "700": "#9BBEED",
    "800": "#B4CEF2",
    "900": "#CDDEF6",
    "950": "#E6EFFB"
  },
  Peach: {
    "50": "#4A2518",
    "100": "#7C3E28",
    "200": "#954A2F",
    "300": "#C6633F",
    "400": "#DF7047",
    "500": "#F98961",
    "600": "#FAA384",
    "700": "#FCBEA7",
    "800": "#FDD8CA",
    "900": "#FEE5DC",
    "950": "#FEF2ED"
  },
  Pink: {
    "50": "#441E48",
    "100": "#723279",
    "200": "#893B91",
    "300": "#B64FC1",
    "400": "#CD59D9",
    "500": "#E773F2",
    "600": "#EC92F5",
    "700": "#F2B1F8",
    "800": "#FF77DD",
    "900": "#FFAAEE",
    "950": "#FCEFFE"
  },
  Error: {
    "50": "#450A0A",
    "100": "#7F1D1D",
    "200": "#991B1B",
    "300": "#B91C1C",
    "400": "#DC2626",
    "500": "#EF4444",
    "600": "#F87171",
    "700": "#FCA5A5",
    "800": "#FECACA",
    "900": "#FEE2E2",
    "950": "#FEF2F2"
  },
  Warning: {
    "50": "#4B3107",
    "100": "#7D510B",
    "200": "#95610D",
    "300": "#AE710F",
    "400": "#E09214",
    "500": "#F9A216",
    "600": "#FAB545",
    "700": "#FBC773",
    "800": "#FDE3B9",
    "900": "#FFEEEE",
    "950": "#FEF6E8"
  },
  Success: {
    "50": "#022C22",
    "100": "#064E3B",
    "200": "#065F46",
    "300": "#047857",
    "400": "#059669",
    "500": "#10B981",
    "600": "#34D399",
    "700": "#6EE7B7",
    "800": "#A7F3D0",
    "900": "#D1FAE5",
    "950": "#ECFDF5"
  },
  Neutral: {
    "0": "#0A0A0A",
    "50": "#171717",
    "100": "#262626",
    "200": "#404040",
    "300": "#525252",
    "400": "#737373",
    "500": "#A3A3A3",
    "600": "#D4D4D4",
    "700": "#E5E5E5",
    "800": "#F5F5F5",
    "900": "#FAFAFA",
    "950": "#FFFFFF"
  },
  "Alpha Neutral": {
    "0": "rgba(4, 6, 13, 0.5)",
    "50": "rgba(10, 15, 25, 0.54)",
    "100": "rgba(18, 24, 33, 0.58)",
    "200": "rgba(25, 31, 43, 0.62)",
    "300": "rgba(36, 43, 54, 0.66)",
    "400": "rgba(59, 66, 81, 0.7)",
    "500": "rgba(122, 131, 145, 0.74)",
    "600": "rgba(180, 187, 198, 0.78)",
    "700": "rgba(209, 213, 221, 0.82)",
    "800": "rgba(228, 231, 235, 0.86)",
    "900": "rgba(247, 249, 251, 0.9)",
    "950": "rgba(255, 255, 255, 0.94)"
  },
  "Base Colours": {
    Background: "#0D0D0D",
    "Background Contrast": "#FFFFFF",
    Alpha: "rgba(13, 13, 13, 0)",
    "Alpha contrast": "rgba(255, 255, 255, 0)"
  }
} as const;

// Color semantics — role-based mapping (Primary/Surface/High = brand action color, etc.)
export const semantics = {
  primary: {
    surface: {
      lowest: "#022554",
      low: "#02377E",
      medium: "#034093",
      high: "#1D6CD7",
      highest: "#4F8DE0",
      disabled: "#022554",
      contrast: "#E6EFFB",
      staticBlack: "#0D0D0D"
    },
    textIcon: {
      heading: "#B4CEF2",
      body: "#9BBEED",
      caption: "#4F8DE0",
      disabled: "#045CD2",
      contrast: "#022554",
      staticBlack: "#0D0D0D"
    },
    outline: {
      lowest: "#022554",
      low: "#02377E",
      medium: "#034093",
      high: "#4F8DE0",
      highest: "#B4CEF2"
    }
  },
  secondary: {
    surface: {
      lowest: "#4A2518",
      low: "#7C3E28",
      medium: "#954A2F",
      high: "#F98961",
      highest: "#FAA384",
      disabled: "#7C3E28",
      contrast: "#FEF2ED",
      staticBlack: "#0D0D0D"
    },
    textIcon: {
      heading: "#FDD8CA",
      body: "#FCBEA7",
      caption: "#FAA384",
      disabled: "#DF7047",
      contrast: "#4A2518",
      staticBlack: "#0D0D0D"
    },
    outline: {
      lowest: "#4A2518",
      low: "#7C3E28",
      medium: "#954A2F",
      high: "#FAA384",
      highest: "#FDD8CA"
    }
  },
  accent: {
    surface: {
      lowest: "#441E48",
      low: "#723279",
      medium: "#893B91",
      high: "#E773F2",
      highest: "#EC92F5",
      disabled: "#723279",
      contrast: "#FCEFFE",
      staticBlack: "#0D0D0D"
    },
    textIcon: {
      heading: "#FF77DD",
      body: "#F2B1F8",
      caption: "#EC92F5",
      disabled: "#CD59D9",
      contrast: "#441E48",
      staticBlack: "#0D0D0D"
    },
    outline: {
      lowest: "#441E48",
      low: "#723279",
      medium: "#893B91",
      high: "#EC92F5",
      highest: "#FF77DD"
    }
  },
  neutral: {
    surface: {
      lowest: "#0A0A0A",
      low: "#171717",
      medium: "#262626",
      medium2: "#404040",
      medium3: "#525252",
      high: "#A3A3A3",
      highest: "#D4D4D4",
      disabled: "#262626",
      contrast: "#FFFFFF",
      staticBlack: "#0D0D0D"
    },
    textIcon: {
      heading: "#FFFFFF",
      body: "#E5E5E5",
      caption: "#D4D4D4",
      caption2: "#A3A3A3",
      disabled: "#737373",
      contrast: "#171717",
      staticBlack: "#0D0D0D"
    },
    outline: {
      lowest: "#171717",
      low: "#262626",
      medium: "#404040",
      high: "#737373",
      highest: "#A3A3A3"
    }
  },
  error: {
    surface: {
      lowest: "#450A0A",
      low: "#7F1D1D",
      medium: "#991B1B",
      high: "#EF4444",
      highest: "#F87171",
      disabled: "#7F1D1D",
      contrast: "#FEF2F2",
      staticBlack: "#0D0D0D"
    },
    textIcon: {
      heading: "#FECACA",
      body: "#FCA5A5",
      caption: "#F87171",
      disabled: "#DC2626",
      contrast: "#450A0A",
      staticBlack: "#0D0D0D"
    },
    outline: {
      lowest: "#450A0A",
      low: "#7F1D1D",
      medium: "#991B1B",
      high: "#F87171",
      highest: "#FECACA"
    }
  },
  warning: {
    surface: {
      lowest: "#4B3107",
      low: "#7D510B",
      medium: "#95610D",
      high: "#F9A216",
      highest: "#FAB545",
      disabled: "#7D510B",
      contrast: "#FEF6E8",
      staticBlack: "#0D0D0D"
    },
    textIcon: {
      heading: "#FDE3B9",
      body: "#FBC773",
      caption: "#FAB545",
      disabled: "#E09214",
      contrast: "#4B3107",
      staticBlack: "#0D0D0D"
    },
    outline: {
      lowest: "#4B3107",
      low: "#7D510B",
      medium: "#AE710F",
      high: "#FAB545",
      highest: "#FDE3B9"
    }
  },
  success: {
    surface: {
      lowest: "#022C22",
      low: "#064E3B",
      medium: "#065F46",
      high: "#10B981",
      highest: "#34D399",
      disabled: "#064E3B",
      contrast: "#ECFDF5",
      staticBlack: "#0D0D0D"
    },
    textIcon: {
      heading: "#6EE7B7",
      body: "#10B981",
      caption: "#059669",
      disabled: "#6EE7B7",
      contrast: "#022C22",
      staticBlack: "#0D0D0D"
    },
    outline: {
      lowest: "#022C22",
      low: "#064E3B",
      medium: "#047857",
      high: "#34D399",
      highest: "#A7F3D0"
    }
  }
} as const;

// Spacing scale (Infinity t-shirt sizes; values in pixels)
export const spacing = {
  xxs: 0,
  xs: 2,
  s: 4,
  m: 8,
  l: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  "4xl": 28,
  "5xl": 32,
  "6xl": 36,
  "7xl": 40,
  rounded: 1000
} as const;

// Corner radius scale (px)
export const radius = {
  "3xs": 0,
  "2xs": 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  "5xl": 36,
  "6xl": 40,
  rounded: 1000
} as const;

// Icon size scale (px)
export const iconSize = {
  xs: 16,
  s: 20,
  m: 24,
  l: 28
} as const;

// Typography primitives (font families, weight names, font sizes)
export const typography = {
  family: {
    title: "Geist",
    body: "Urbanist"
  },
  weight: {
    regular: "Regular",
    medium: "Medium",
    semiBold: "SemiBold",
    bold: "Bold"
  },
  size: {
    "1": 10,
    "2": 12,
    "3": 14,
    "4": 16,
    "5": 18,
    "6": 20,
    "7": 24,
    "8": 28,
    "9": 32,
    "10": 38,
    "11": 42
  }
} as const;

// Typography composites — named text styles like Body 03/Bold = 16px Bold Urbanist.
// Composite key format: <kind><NN><Weight> where NN is 01 (largest) to 06 (smallest)
// for body, 01 (largest) to 05 (smallest) for title. Weight is Regular|Medium|SemiBold|Bold.
export const typographyComposites = {
  heading01Regular: {
    family: "Geist",
    size: 42,
    weight: 400,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading01Medium: {
    family: "Geist",
    size: 42,
    weight: 500,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading01SemiBold: {
    family: "Geist",
    size: 42,
    weight: 600,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading01Bold: {
    family: "Geist",
    size: 42,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading02Regular: {
    family: "Geist",
    size: 38,
    weight: 400,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading02Medium: {
    family: "Geist",
    size: 38,
    weight: 500,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading02SemiBold: {
    family: "Geist",
    size: 38,
    weight: 600,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading02Bold: {
    family: "Geist",
    size: 38,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading03Regular: {
    family: "Geist",
    size: 32,
    weight: 400,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading03Medium: {
    family: "Geist",
    size: 32,
    weight: 500,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading03SemiBold: {
    family: "Geist",
    size: 32,
    weight: 600,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading03Bold: {
    family: "Geist",
    size: 32,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading04Regular: {
    family: "Geist",
    size: 28,
    weight: 400,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading04Medium: {
    family: "Geist",
    size: 28,
    weight: 500,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading04SemiBold: {
    family: "Geist",
    size: 28,
    weight: 600,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading04Bold: {
    family: "Geist",
    size: 28,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading05Regular: {
    family: "Geist",
    size: 24,
    weight: 400,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading05Medium: {
    family: "Geist",
    size: 24,
    weight: 500,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading05SemiBold: {
    family: "Geist",
    size: 24,
    weight: 600,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading05Bold: {
    family: "Geist",
    size: 24,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading06Regular: {
    family: "Geist",
    size: 20,
    weight: 400,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading06Medium: {
    family: "Geist",
    size: 20,
    weight: 500,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading06SemiBold: {
    family: "Geist",
    size: 20,
    weight: 600,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading06Bold: {
    family: "Geist",
    size: 20,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading07Regular: {
    family: "Geist",
    size: 18,
    weight: 400,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading07Medium: {
    family: "Geist",
    size: 18,
    weight: 500,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading07SemiBold: {
    family: "Geist",
    size: 18,
    weight: 600,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading07Bold: {
    family: "Geist",
    size: 18,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading08Regular: {
    family: "Geist",
    size: 16,
    weight: 400,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading08Medium: {
    family: "Geist",
    size: 16,
    weight: 500,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading08SemiBold: {
    family: "Geist",
    size: 16,
    weight: 600,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  heading08Bold: {
    family: "Geist",
    size: 16,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: 0
  },
  body01Regular: {
    family: "Urbanist",
    size: 20,
    weight: 400,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body01Medium: {
    family: "Urbanist",
    size: 20,
    weight: 500,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body01SemiBold: {
    family: "Urbanist",
    size: 20,
    weight: 600,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body01Bold: {
    family: "Urbanist",
    size: 20,
    weight: 700,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body02Regular: {
    family: "Urbanist",
    size: 18,
    weight: 400,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body02Medium: {
    family: "Urbanist",
    size: 18,
    weight: 500,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body02SemiBold: {
    family: "Urbanist",
    size: 18,
    weight: 600,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body02Bold: {
    family: "Urbanist",
    size: 18,
    weight: 700,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body03Regular: {
    family: "Urbanist",
    size: 16,
    weight: 400,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body03Medium: {
    family: "Urbanist",
    size: 16,
    weight: 500,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body03SemiBold: {
    family: "Urbanist",
    size: 16,
    weight: 600,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body03Bold: {
    family: "Urbanist",
    size: 16,
    weight: 700,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body04Regular: {
    family: "Urbanist",
    size: 14,
    weight: 400,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body04Medium: {
    family: "Urbanist",
    size: 14,
    weight: 500,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body04SemiBold: {
    family: "Urbanist",
    size: 14,
    weight: 600,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body04Bold: {
    family: "Urbanist",
    size: 14,
    weight: 700,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body05Regular: {
    family: "Urbanist",
    size: 12,
    weight: 400,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body05Medium: {
    family: "Urbanist",
    size: 12,
    weight: 500,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body05SemiBold: {
    family: "Urbanist",
    size: 12,
    weight: 600,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  body05Bold: {
    family: "Urbanist",
    size: 12,
    weight: 700,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  captionRegular: {
    family: "Urbanist",
    size: 10,
    weight: 400,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  captionMedium: {
    family: "Urbanist",
    size: 10,
    weight: 500,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  captionSemiBold: {
    family: "Urbanist",
    size: 10,
    weight: 600,
    lineHeight: 1.4,
    letterSpacing: 0
  },
  captionBold: {
    family: "Urbanist",
    size: 10,
    weight: 700,
    lineHeight: 1.4,
    letterSpacing: 0
  }
} as const;
