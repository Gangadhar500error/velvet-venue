/**
 * VelvetVenues Design System
 * Gold = primary brand. Burgundy = sparse premium accent only.
 */

export const VV = {
  primary: "#C89B3C",
  primaryHover: "#B8862B",
  primaryLight: "#F7E8C5",

  gold: "#C89B3C",
  goldHover: "#B8862B",
  goldLight: "#F7E8C5",

  burgundy: "#6A1830",
  burgundyHover: "#81213C",

  background: "#FCFAF8",
  backgroundAlt: "#FFFDF8",
  card: "#FFFFFF",
  border: "#ECE7E1",

  heading: "#222222",
  body: "#555555",
  muted: "#888888",

  success: "#16A34A",
  successLight: "#ECFDF3",
  warning: "#C89B3C",
  warningLight: "#F7E8C5",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  info: "#C89B3C",
  infoLight: "#F7E8C5",

  footer: "#1B2230",

  radius: "18px",
  radiusSm: "12px",
  shadow: "0 12px 35px rgba(200,155,60,0.15)",
  shadowHover: "0 10px 30px rgba(193,151,93,0.12)",
} as const;

export type VVTokens = typeof VV;
