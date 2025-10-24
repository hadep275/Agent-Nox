/**
 * 🎨 Aurora Theme Definitions
 * Enterprise-grade theme definitions for Nox VS Code extension
 * Features: 6 Aurora themes including Solar light mode, complete color palettes, enterprise metadata
 */

/**
 * 🌌 Classic Aurora - Default enterprise blue theme
 */
const CLASSIC_AURORA = {
  id: "classic",
  name: "🌌 Classic Aurora",
  description: "Default blue-purple aurora theme for professional development",
  category: "dark",
  colors: {
    primary: "#4c9aff", // Aurora Blue
    secondary: "#8b5cf6", // Aurora Purple
    accent: "#10b981", // Aurora Green
    tertiary: "#f472b6", // Aurora Pink
    quaternary: "#06b6d4", // Aurora Cyan
    warning: "#f59e0b", // Aurora Orange
    error: "#ef4444", // Aurora Red
    success: "#10b981", // Aurora Green
    info: "#4c9aff", // Aurora Blue
  },
  backgrounds: {
    primary: "#0a0a0f", // Deep navy
    secondary: "#1a1a2e", // Dark blue
    tertiary: "#16213e", // Medium blue
    surface: "#0f1419", // Chat background
    elevated: "#1e293b", // Elevated surfaces
  },
  text: {
    primary: "#ffffff", // White
    secondary: "#a0a9c0", // Light gray
    muted: "#6b7280", // Muted gray
    inverse: "#0a0a0f", // Dark (for light backgrounds)
  },
  gradients: {
    primary: "linear-gradient(135deg, #4c9aff, #8b5cf6, #10b981)",
    secondary: "linear-gradient(135deg, #1a1a2e, #16213e)",
    accent: "linear-gradient(135deg, #f472b6, #8b5cf6)",
  },
  enterprise: {
    compliance: true,
    accessibility: "WCAG-AA",
    auditRequired: true,
    version: "1.0.0",
  },
  metadata: {
    created: "2024-01-01",
    author: "Nox Enterprise",
    tags: ["default", "professional", "blue", "aurora"],
  },
};

/**
 * 🔥 Fire Aurora - High-energy development theme
 */
const FIRE_AURORA = {
  id: "fire",
  name: "🔥 Fire Aurora",
  description:
    "Warm orange-red aurora theme for high-energy development sessions",
  category: "dark",
  colors: {
    primary: "#ff713d", // Pure Bright Red (intense flame core)
    secondary: "#ffff00", // Pure Bright Yellow (flame tips)
    accent: "#ff0000", // Orange Red (flame body)
    tertiary: "#ffd700", // Gold (flame highlights)
    quaternary: "#8b0000", // Dark Red (ember base)
    warning: "#ffff66", // Bright Yellow (hot streaks)
    error: "#dc143c", // Crimson (flame edges)
    success: "#ff6600", // Bright Orange
    info: "#ff69b4", // Hot Pink (intense heat)
  },
  backgrounds: {
    primary: "#1a0a0a", // Dark red
    secondary: "#2e1a1a", // Deep orange
    tertiary: "#2d1b1b", // Medium red
    surface: "#1f0f0f", // Chat background
    elevated: "#3d1a1a", // Elevated surfaces
  },
  text: {
    primary: "#ffffff", // White
    secondary: "#fca5a5", // Light red
    muted: "#9ca3af", // Muted gray
    inverse: "#1a0a0a", // Dark
  },
  gradients: {
    primary:
      "linear-gradient(135deg, #ff0000, #ffff00, #ffffff, #ff4500, #ffd700, #8b0000, #ff4500)",
    secondary: "linear-gradient(135deg, #2e1a1a, #ffffff, #2d1b1b, #ffff00)",
    accent: "linear-gradient(135deg, #ffffff, #ffff66, #ff6600, #dc143c)",
  },
  enterprise: {
    compliance: true,
    accessibility: "WCAG-AA",
    auditRequired: true,
    version: "1.0.0",
  },
  metadata: {
    created: "2024-01-01",
    author: "Nox Enterprise",
    tags: ["energetic", "warm", "orange", "red", "aurora"],
  },
};

/**
 * 🌿 Forest Aurora - Focus and concentration theme
 */
const FOREST_AURORA = {
  id: "forest",
  name: "🌿 Forest Aurora",
  description: "Green-teal aurora theme for focus and concentration",
  category: "dark",
  colors: {
    primary: "#228b22", // Forest Green
    secondary: "#00fbff", // Dark Turquoise
    accent: "#32cd32", // Lime Green
    tertiary: "#008b8b", // Dark Cyan
    quaternary: "#006400", // Dark Green
    warning: "#9acd32", // Yellow Green
    error: "#dc143c", // Crimson
    success: "#00ff7f", // Spring Green
    info: "#40e0d0", // Turquoise
  },
  backgrounds: {
    primary: "#0a1a0f", // Dark green
    secondary: "#1a2e1a", // Deep forest
    tertiary: "#1b2d1b", // Medium green
    surface: "#0f1f0f", // Chat background
    elevated: "#1a3d1a", // Elevated surfaces
  },
  text: {
    primary: "#ffffff", // White
    secondary: "#a7f3d0", // Light green
    muted: "#9ca3af", // Muted gray
    inverse: "#0a1a0f", // Dark
  },
  gradients: {
    primary:
      "linear-gradient(135deg, #228b22, #00ced1, #32cd32, #008b8b, #006400, #ffffff)",
    secondary: "linear-gradient(135deg, #ffffff, #1a2e1a, #1b2d1b, #00fbff)",
    accent: "linear-gradient(135deg, #9acd32, #ffffff, #00ff7f, #40e0d0)",
  },
  enterprise: {
    compliance: true,
    accessibility: "WCAG-AA",
    auditRequired: true,
    version: "1.0.0",
  },
  metadata: {
    created: "2024-01-01",
    author: "Nox Enterprise",
    tags: ["focus", "nature", "green", "teal", "aurora"],
  },
};

/**
 * 🌸 Sakura Aurora - Creative and design work theme
 */
const SAKURA_AURORA = {
  id: "sakura",
  name: "🌸 Sakura Aurora",
  description: "Pink-purple cherry blossom theme for creative and design work",
  category: "dark",
  colors: {
    primary: "#ffb6c1", // Light Pink (cherry blossom)
    secondary: "#9370db", // Medium Orchid
    accent: "#ffffff", // Pure White (blossom petals)
    tertiary: "#dda0dd", // Plum
    quaternary: "#4b0082", // Indigo (deep night)
    warning: "#ffc0cb", // Pink
    error: "#dc143c", // Crimson
    success: "#98fb98", // Pale Green
    info: "#e6e6fa", // Lavender
  },
  backgrounds: {
    primary: "#1a0a1a", // Dark purple
    secondary: "#2e1a2e", // Deep pink
    tertiary: "#2d1b2d", // Medium purple
    surface: "#1f0f1f", // Chat background
    elevated: "#3d1a3d", // Elevated surfaces
  },
  text: {
    primary: "#ffffff", // White
    secondary: "#fbb6ce", // Light pink
    muted: "#9ca3af", // Muted gray
    inverse: "#1a0a1a", // Dark
  },
  gradients: {
    primary:
      "linear-gradient(135deg, #ffb6c1, #9370db, #dda0dd, #4b0082, #ffffff, #ffffff)",
    secondary: "linear-gradient(135deg, #2e1a2e, #2d1b2d, #ffffff)",
    accent: "linear-gradient(135deg, #ffc0cb, #e6e6fa, #98fb98, #ffffff)",
  },
  enterprise: {
    compliance: true,
    accessibility: "WCAG-AA",
    auditRequired: true,
    version: "1.0.0",
  },
  metadata: {
    created: "2024-01-01",
    author: "Nox Enterprise",
    tags: ["creative", "design", "pink", "purple", "aurora"],
  },
};

/**
 * 🌙 Midnight Aurora - Deep focus, minimal distraction theme
 */
const MIDNIGHT_AURORA = {
  id: "midnight",
  name: "🌙 Midnight Aurora",
  description:
    "Deep focus theme with minimal distractions for intense coding sessions",
  category: "dark",
  colors: {
    primary: "#191970", // Midnight Blue
    secondary: "#000080", // Navy Blue
    accent: "#ffffff", // Pure White (stars)
    tertiary: "#483d8b", // Dark Slate Blue
    quaternary: "#000000", // Pure Black (deep space)
    warning: "#c0c0c0", // Silver
    error: "#8b0000", // Dark Red
    success: "#00ff00", // Lime (northern lights)
    info: "#add8e6", // Light Blue
  },
  backgrounds: {
    primary: "#000000", // True black
    secondary: "#111111", // Dark gray
    tertiary: "#1a1a1a", // Medium gray
    surface: "#0a0a0a", // Chat background
    elevated: "#1f1f1f", // Elevated surfaces
  },
  text: {
    primary: "#ffffff", // White
    secondary: "#c7d2fe", // Light indigo
    muted: "#6b7280", // Muted gray
    inverse: "#000000", // Black
  },
  gradients: {
    primary:
      "linear-gradient(135deg, #ffffff, #191970, #000080, #483d8b, #000000, #ffffff)",
    secondary: "linear-gradient(135deg, #111111, #1a1a1a, #ffffff)",
    accent: "linear-gradient(135deg, #c0c0c0, #add8e6, #00ff00, #ffffff)",
  },
  enterprise: {
    compliance: true,
    accessibility: "WCAG-AA",
    auditRequired: true,
    version: "1.0.0",
  },
  metadata: {
    created: "2024-01-01",
    author: "Nox Enterprise",
    tags: ["focus", "minimal", "dark", "indigo", "aurora"],
  },
};

/**
 * ☀️ Solar Aurora - Bright, energetic daytime coding theme (LIGHT MODE)
 */
const SOLAR_AURORA = {
  id: "solar",
  name: "☀️ Solar Aurora",
  description: "Bright, energetic daytime coding theme with warm golden tones",
  category: "light",
  colors: {
    primary: "#f59e0b", // Golden
    secondary: "#d97706", // Amber
    accent: "#ea580c", // Orange
    tertiary: "#fb923c", // Bright Orange
    quaternary: "#dc2626", // Red accent
    warning: "#f59e0b", // Golden
    error: "#dc2626", // Red
    success: "#059669", // Green
    info: "#0ea5e9", // Sky Blue
  },
  backgrounds: {
    primary: "#fefce8", // Cream white
    secondary: "#fef3c7", // Warm white
    tertiary: "#fffbeb", // Light cream
    surface: "#fef0cd", // Light amber
    elevated: "#fde68a", // Elevated surfaces
  },
  text: {
    primary: "#92400e", // Dark amber
    secondary: "#451a03", // Deep brown
    muted: "#78716c", // Warm gray
    inverse: "#ffffff", // White (for dark backgrounds)
  },
  gradients: {
    primary: "linear-gradient(135deg, #f59e0b, #d97706, #ea580c)",
    secondary: "linear-gradient(135deg, #fef3c7, #fffbeb)",
    accent: "linear-gradient(135deg, #fb923c, #dc2626)",
  },
  enterprise: {
    compliance: true,
    accessibility: "WCAG-AA",
    auditRequired: true,
    version: "1.0.0",
  },
  metadata: {
    created: "2024-01-01",
    author: "Nox Enterprise",
    tags: ["light", "bright", "energetic", "golden", "daytime", "aurora"],
  },
};

/**
 * 🎨 Export all Aurora themes
 */
const AURORA_THEMES = [
  CLASSIC_AURORA,
  FIRE_AURORA,
  FOREST_AURORA,
  SAKURA_AURORA,
  MIDNIGHT_AURORA,
  SOLAR_AURORA,
];

/**
 * 🔍 Theme utilities
 */
const THEME_UTILITIES = {
  /**
   * Get theme by ID
   */
  getThemeById(id) {
    return AURORA_THEMES.find((theme) => theme.id === id);
  },

  /**
   * Get themes by category
   */
  getThemesByCategory(category) {
    return AURORA_THEMES.filter((theme) => theme.category === category);
  },

  /**
   * Get dark themes
   */
  getDarkThemes() {
    return this.getThemesByCategory("dark");
  },

  /**
   * Get light themes
   */
  getLightThemes() {
    return this.getThemesByCategory("light");
  },

  /**
   * Validate theme structure
   */
  validateTheme(theme) {
    const requiredFields = [
      "id",
      "name",
      "category",
      "colors",
      "backgrounds",
      "text",
    ];
    return requiredFields.every((field) => theme[field] !== undefined);
  },

  /**
   * Get theme preview data
   */
  getThemePreview(themeId) {
    const theme = this.getThemeById(themeId);
    if (!theme) return null;

    return {
      id: theme.id,
      name: theme.name,
      category: theme.category,
      colors: {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        accent: theme.colors.accent,
      },
      background: theme.backgrounds.primary,
    };
  },
};

module.exports = {
  AURORA_THEMES,
  THEME_UTILITIES,
  // Individual theme exports for direct access
  CLASSIC_AURORA,
  FIRE_AURORA,
  FOREST_AURORA,
  SAKURA_AURORA,
  MIDNIGHT_AURORA,
  SOLAR_AURORA,
};
