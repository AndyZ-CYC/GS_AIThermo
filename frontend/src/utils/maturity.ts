export interface MaturityTier {
  level: number;
  label: string;
  color: string;
  cardBg: string;
  indicatorColor: string;
}

const tiers: MaturityTier[] = [
  { level: 1, label: "低", color: "#3b82f6", cardBg: "rgba(59,130,246,0.22)", indicatorColor: "#60a5fa" },
  { level: 2, label: "较低", color: "#06b6d4", cardBg: "rgba(6,182,212,0.22)", indicatorColor: "#22d3ee" },
  { level: 3, label: "中", color: "#eab308", cardBg: "rgba(234,179,8,0.18)", indicatorColor: "#facc15" },
  { level: 4, label: "较高", color: "#f97316", cardBg: "rgba(249,115,22,0.22)", indicatorColor: "#fb923c" },
  { level: 5, label: "高", color: "#ef4444", cardBg: "rgba(239,68,68,0.25)", indicatorColor: "#f87171" },
];

export const allTiers = tiers;

export function getMaturityTier(score: number): MaturityTier {
  if (score <= 20) return tiers[0];
  if (score <= 40) return tiers[1];
  if (score <= 60) return tiers[2];
  if (score <= 80) return tiers[3];
  return tiers[4];
}

export function getMaturityColor(score: number): string {
  return getMaturityTier(score).color;
}
