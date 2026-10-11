// Frontend 2 owns the look. Overwrite these values in hour 1.
export const colors = {
  bg: "#F7F5EC",
  text: "#14231C",
  muted: "#5E6B64",
  primary: "#1E4D36",
  primaryText: "#ffffff",
  error: "#a8201a",
  border: "#E6E3D3",
  card: "#FFFFFF",
  soft: "#F1EEE0",
  mint: "#D9EBA8",
  mintText: "#1E4D36",
  dark: "#1F2622",
  darkSoft: "#323A35",
  yellow: "#F2C94C",
  yellowSoft: "#FFF4CC",
  yellowBorder: "#F2D675",
  yellowText: "#4A3600",
};

// Colors per freshness.label from the contract
export const labelColors: Record<string, string> = {
  fresh: "#2f8f5b",
  use_soon: "#c98f0a",
  use_now: "#d4561f",
  compost: "#a8201a",
};

export const labelNames: Record<string, string> = {
  fresh: "Crisp fresh",
  use_soon: "Eat soon",
  use_now: "Rescue & cook",
  compost: "Compost",
};
