export function commission(revenue, rate) { return { monthly: revenue * rate / 100, annual: revenue * rate / 100 * 12, retained: revenue * (1-rate/100) }; }
export function savings(revenue, ota, rate, direct) { const currentDirect = 100-ota; const shifted = Math.max(0,direct-currentDirect); return { currentDirect, shifted, annual: revenue * shifted / 100 * rate / 100 * 12 }; }
