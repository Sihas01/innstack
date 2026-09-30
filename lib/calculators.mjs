export function commission(revenue, rate) { return { monthly: revenue * rate / 100, annual: revenue * rate / 100 * 12, retained: revenue * (1-rate/100) }; }
export function savings(revenue, ota, rate, direct) { const currentDirect = 100-ota; const shifted = Math.max(0,direct-currentDirect); return { currentDirect, shifted, annual: revenue * shifted / 100 * rate / 100 * 12 }; }
export function revparFromRevenue(revenue, rooms, days) { const availableRoomNights = rooms * days; return { availableRoomNights, revpar: availableRoomNights > 0 ? revenue / availableRoomNights : null }; }
export function revparFromAdr(adr, occupancy) { return adr * occupancy / 100; }
