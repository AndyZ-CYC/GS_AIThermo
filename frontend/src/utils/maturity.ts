export interface MaturityTier {
  level: number;
  label: string;
  color: string;
  cardBg: string;
  indicatorColor: string;
}

const tiers: MaturityTier[] = [
  { level: 1, label: "低",   color: "#c0392b", cardBg: "rgba(192,57,43,0.22)",   indicatorColor: "#e74c3c" },
  { level: 2, label: "较低", color: "#e67e22", cardBg: "rgba(230,126,34,0.22)",  indicatorColor: "#f39c12" },
  { level: 3, label: "中",   color: "#f1c40f", cardBg: "rgba(241,196,15,0.18)",  indicatorColor: "#f1c40f" },
  { level: 4, label: "较高", color: "#7fb347", cardBg: "rgba(127,179,71,0.22)",  indicatorColor: "#8bc34a" },
  { level: 5, label: "高",   color: "#27ae60", cardBg: "rgba(39,174,96,0.25)",   indicatorColor: "#2ecc71" },
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
