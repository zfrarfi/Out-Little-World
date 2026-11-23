import type { ThemePreset } from "@/types/database";

export interface ThemePalette {
  id: ThemePreset;
  name: string;
  description: string;
  softPink: string;
  rose: string;
  roseDark: string;
  cream: string;
  softBrown: string;
  darkText: string;
  previewSwatches: [string, string, string];
}

export const THEME_PRESETS: Record<ThemePreset, ThemePalette> = {
  "soft-pink": {
    id: "soft-pink",
    name: "Soft Pink Romantic",
    description: "Palet khas Our Little World: Soft Pink, Rose, & Cream hangat",
    softPink: "#F8C8DC",
    rose: "#E8A0BF",
    roseDark: "#C9769A",
    cream: "#FFF8F0",
    softBrown: "#8D6E63",
    darkText: "#39343A",
    previewSwatches: ["#F8C8DC", "#E8A0BF", "#FFF8F0"],
  },
  "warm-rose": {
    id: "warm-rose",
    name: "Warm Rose Journal",
    description: "Sentuhan mawar hangat dengan kertas jurnal lembut",
    softPink: "#F9D1D1",
    rose: "#DF8A9C",
    roseDark: "#BE6478",
    cream: "#FFF6F2",
    softBrown: "#8B665D",
    darkText: "#39343A",
    previewSwatches: ["#F9D1D1", "#DF8A9C", "#FFF6F2"],
  },
  "lavender-blush": {
    id: "lavender-blush",
    name: "Lavender Blush",
    description: "Nuansa pink pastel berpadu lavender lembut yang menenangkan",
    softPink: "#F3D1EC",
    rose: "#D29AD1",
    roseDark: "#A96EB0",
    cream: "#FDF8FF",
    softBrown: "#7D6B7D",
    darkText: "#39343A",
    previewSwatches: ["#F3D1EC", "#D29AD1", "#FDF8FF"],
  },
  "peach-cream": {
    id: "peach-cream",
    name: "Peach & Cream",
    description: "Hangat seperti matahari sore dan kenangan manis",
    softPink: "#FCD8C4",
    rose: "#EAA08C",
    roseDark: "#CC7862",
    cream: "#FFF9F2",
    softBrown: "#8D6E63",
    darkText: "#39343A",
    previewSwatches: ["#FCD8C4", "#EAA08C", "#FFF9F2"],
  },
  "berry-silk": {
    id: "berry-silk",
    name: "Berry Silk",
    description: "Elegan dengan aksen rose-berry modern",
    softPink: "#F4C2D7",
    rose: "#D87EA5",
    roseDark: "#B45680",
    cream: "#FFF7FA",
    softBrown: "#7F5F68",
    darkText: "#39343A",
    previewSwatches: ["#F4C2D7", "#D87EA5", "#FFF7FA"],
  },
};

export function getThemeCssVars(
  preset: ThemePreset = "soft-pink",
  fontFamily: "poppins" | "nunito" = "poppins"
): Record<string, string> {
  const palette = THEME_PRESETS[preset] ?? THEME_PRESETS["soft-pink"];
  return {
    "--color-soft-pink": palette.softPink,
    "--color-rose": palette.rose,
    "--color-rose-dark": palette.roseDark,
    "--color-cream": palette.cream,
    "--color-soft-brown": palette.softBrown,
    "--color-dark-text": palette.darkText,
    "--active-font": fontFamily === "nunito" ? "var(--font-nunito)" : "var(--font-poppins)",
  };
}
