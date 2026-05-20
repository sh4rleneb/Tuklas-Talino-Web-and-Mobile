export function levelForXp(xp = 0) {
  return Math.max(1, Math.floor(Number(xp || 0) / 100) + 1);
}

export function xpPercent(xp = 0) {
  return Number(xp || 0) % 100;
}
