/**
 * Utilidad compartida de horarios de inicio (kickoffs) del Mundial 2026.
 * Mantiene la misma lógica exacta que el frontend para garantizar consistencia.
 */

function getMatchKickoff(matchId) {
  // Fase de grupos (IDs numéricos 1 a 48)
  const numericId = parseInt(matchId, 10);
  if (!isNaN(numericId) && numericId >= 1 && numericId <= 48) {
    const dayIndex = Math.floor((numericId - 1) / 3); // 3 partidos al día
    const matchIndexInDay = (numericId - 1) % 3;
    
    // Horas en UTC: 16:00, 19:00, 22:00 (Calzan perfecto con 12:00 PM, 3:00 PM y 6:00 PM HLV en Venezuela UTC-4)
    const hoursUTC = matchIndexInDay === 0 ? 16 : matchIndexInDay === 1 ? 19 : 22;
    
    const date = new Date('2026-06-10T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + dayIndex);
    date.setUTCHours(hoursUTC, 0, 0, 0);
    return date.toISOString();
  }

  // Eliminatorias
  const idStr = String(matchId);
  if (idStr.startsWith('R16-')) {
    const idx = parseInt(idStr.replace('R16-', ''), 10) - 1; // 0 a 7
    const dayIndex = Math.floor(idx / 2); // 2 partidos al día
    const matchIndexInDay = idx % 2;
    // Horas en UTC: 16:00 y 20:00 (Calzan con 12:00 PM y 4:00 PM en Venezuela UTC-4)
    const hoursUTC = matchIndexInDay === 0 ? 16 : 20;
    
    const date = new Date('2026-06-26T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + dayIndex);
    date.setUTCHours(hoursUTC, 0, 0, 0);
    return date.toISOString();
  }
  if (idStr.startsWith('QF-')) {
    const idx = parseInt(idStr.replace('QF-', ''), 10) - 1; // 0 a 3
    const dayIndex = Math.floor(idx / 2); // 2 partidos al día
    const matchIndexInDay = idx % 2;
    const hoursUTC = matchIndexInDay === 0 ? 16 : 20;
    
    const date = new Date('2026-07-03T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + dayIndex);
    date.setUTCHours(hoursUTC, 0, 0, 0);
    return date.toISOString();
  }
  if (idStr.startsWith('SF-')) {
    const idx = parseInt(idStr.replace('SF-', ''), 10) - 1; // 0 a 1
    const date = new Date('2026-07-07T20:00:00Z'); // 4:00 PM HLV en Venezuela (20:00 UTC)
    date.setUTCDate(date.getUTCDate() + idx);
    return date.toISOString();
  }
  if (idStr === 'TP-1') {
    return '2026-07-11T20:00:00Z'; // Sáb 11 de Jul, 4:00 PM HLV
  }
  if (idStr === 'F-1') {
    return '2026-07-12T20:00:00Z'; // Dom 12 de Jul, 4:00 PM HLV
  }

  // Valor por defecto (futuro lejano por seguridad)
  return '2026-12-31T23:59:59Z';
}

module.exports = {
  getMatchKickoff
};
