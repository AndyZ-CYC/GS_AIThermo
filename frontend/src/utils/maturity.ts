export interface MaturityTier {
  level: number;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
}

const tiers: MaturityTier[] = [
  { level: 1, label: "低",   color: "#ef4444", bgClass: "bg-red-500",        textClass: "text-white" },
  { level: 2, label: "较低", color: "#f97316", bgClass: "bg-orange-500",     textClass: "text-white" },
  { level: 3, label: "中",   color: "#eab308", bgClass: "bg-yellow-500",     textClass: "text-black" },
  { level: 4, label: "较高", color: "#84cc16", bgClass: "bg-lime-500",       textClass: "text-black" },
  { level: 5, label: "高",   color: "#22c55e", bgClass: "bg-green-500",      textClass: "text-white" },
];

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
