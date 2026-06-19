/**
 * Utilidad compartida de horarios de inicio (kickoffs) del Mundial 2026.
 * Mantiene la misma lógica exacta que el frontend para garantizar consistencia.
 */

function getMatchKickoff(matchId) {
  const exactKickoffTimes = {
    "1":"2026-06-11T19:00:00.000Z","2":"2026-06-12T02:00:00.000Z","3":"2026-06-19T01:00:00.000Z","4":"2026-06-18T14:00:00.000Z","5":"2026-06-25T01:00:00.000Z","6":"2026-06-25T01:00:00.000Z",
    "7":"2026-06-12T19:00:00.000Z","8":"2026-06-13T19:00:00.000Z","9":"2026-06-19T01:00:00.000Z","10":"2026-06-18T22:00:00.000Z","11":"2026-06-24T19:00:00.000Z","12":"2026-06-24T19:00:00.000Z",
    "13":"2026-06-13T22:00:00.000Z","14":"2026-06-14T01:00:00.000Z","15":"2026-06-20T00:30:00.000Z","16":"2026-06-19T22:00:00.000Z","17":"2026-06-24T22:00:00.000Z","18":"2026-06-24T22:00:00.000Z",
    "19":"2026-06-13T01:00:00.000Z","20":"2026-06-14T04:00:00.000Z","21":"2026-06-19T19:00:00.000Z","22":"2026-06-20T03:00:00.000Z","23":"2026-06-26T02:00:00.000Z","24":"2026-06-26T02:00:00.000Z",
    "25":"2026-06-14T17:00:00.000Z","26":"2026-06-14T23:00:00.000Z","27":"2026-06-20T20:00:00.000Z","28":"2026-06-21T00:00:00.000Z","29":"2026-06-25T20:00:00.000Z","30":"2026-06-25T20:00:00.000Z",
    "31":"2026-06-14T20:00:00.000Z","32":"2026-06-15T02:00:00.000Z","33":"2026-06-20T17:00:00.000Z","34":"2026-06-21T04:00:00.000Z","35":"2026-06-25T23:00:00.000Z","36":"2026-06-25T23:00:00.000Z",
    "37":"2026-06-15T19:00:00.000Z","38":"2026-06-16T01:00:00.000Z","39":"2026-06-21T19:00:00.000Z","40":"2026-06-22T01:00:00.000Z","41":"2026-06-27T03:00:00.000Z","42":"2026-06-27T03:00:00.000Z",
    "43":"2026-06-15T16:00:00.000Z","44":"2026-06-15T22:00:00.000Z","45":"2026-06-21T16:00:00.000Z","46":"2026-06-21T22:00:00.000Z","47":"2026-06-27T00:00:00.000Z","48":"2026-06-27T00:00:00.000Z",
    "49":"2026-06-16T19:00:00.000Z","50":"2026-06-16T22:00:00.000Z","51":"2026-06-22T21:00:00.000Z","52":"2026-06-23T00:00:00.000Z","53":"2026-06-26T19:00:00.000Z","54":"2026-06-26T19:00:00.000Z",
    "55":"2026-06-17T01:00:00.000Z","56":"2026-06-17T04:00:00.000Z","57":"2026-06-22T17:00:00.000Z","58":"2026-06-23T03:00:00.000Z","59":"2026-06-28T02:00:00.000Z","60":"2026-06-28T02:00:00.000Z",
    "61":"2026-06-17T17:00:00.000Z","62":"2026-06-18T02:00:00.000Z","63":"2026-06-23T17:00:00.000Z","64":"2026-06-24T02:00:00.000Z","65":"2026-06-27T23:30:00.000Z","66":"2026-06-27T23:30:00.000Z",
    "67":"2026-06-17T20:00:00.000Z","68":"2026-06-17T23:00:00.000Z","69":"2026-06-23T20:00:00.000Z","70":"2026-06-23T23:00:00.000Z","71":"2026-06-27T21:00:00.000Z","72":"2026-06-27T21:00:00.000Z"
  };

  const numericId = parseInt(matchId, 10);
  if (!isNaN(numericId) && numericId >= 1 && numericId <= 72) {
    if (exactKickoffTimes[numericId]) {
      return exactKickoffTimes[numericId];
    }
    // Fallback por si acaso
    const groupMatchDates = {
      'A': ['2026-06-11', '2026-06-18', '2026-06-24'],
      'B': ['2026-06-12', '2026-06-18', '2026-06-24'],
      'C': ['2026-06-13', '2026-06-19', '2026-06-24'],
      'D': ['2026-06-13', '2026-06-19', '2026-06-25'],
      'E': ['2026-06-14', '2026-06-20', '2026-06-25'],
      'F': ['2026-06-14', '2026-06-20', '2026-06-25'],
      'G': ['2026-06-15', '2026-06-21', '2026-06-26'],
      'H': ['2026-06-15', '2026-06-21', '2026-06-26'],
      'I': ['2026-06-16', '2026-06-22', '2026-06-26'],
      'J': ['2026-06-16', '2026-06-22', '2026-06-27'],
      'K': ['2026-06-17', '2026-06-23', '2026-06-27'],
      'L': ['2026-06-17', '2026-06-23', '2026-06-27']
    };
    
    const groupIndex = Math.floor((numericId - 1) / 6);
    const groupLetter = String.fromCharCode(65 + groupIndex); // A, B, C...
    const matchIndexInGroup = (numericId - 1) % 6; // 0 a 5
    
    const matchdayIndex = Math.floor(matchIndexInGroup / 2);
    const dateStr = groupMatchDates[groupLetter][matchdayIndex];
    
    const localHour = 15 + ((numericId - 1) % 3) * 3;
    const hoursUTC = localHour + 4;
    
    const date = new Date(`${dateStr}T00:00:00Z`);
    date.setUTCHours(hoursUTC, 0, 0, 0);
    return date.toISOString();
  }

  // Eliminatorias
  const idStr = String(matchId);
  if (idStr.startsWith('R32-')) {
    const idx = parseInt(idStr.replace('R32-', ''), 10) - 1; // 0 a 15
    const dayIndex = Math.floor(idx / 4); // 4 partidos al día
    const matchIndexInDay = idx % 4;
    const hoursUTC = 14 + matchIndexInDay * 3; // 14:00, 17:00, 20:00, 23:00
    
    const date = new Date('2026-06-28T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + dayIndex);
    date.setUTCHours(hoursUTC, 0, 0, 0);
    return date.toISOString();
  }
  if (idStr.startsWith('R16-')) {
    const idx = parseInt(idStr.replace('R16-', ''), 10) - 1; // 0 a 7
    const dayIndex = Math.floor(idx / 2); // 2 partidos al día
    const matchIndexInDay = idx % 2;
    const hoursUTC = matchIndexInDay === 0 ? 16 : 20;
    
    const date = new Date('2026-07-04T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + dayIndex);
    date.setUTCHours(hoursUTC, 0, 0, 0);
    return date.toISOString();
  }
  if (idStr.startsWith('QF-')) {
    const idx = parseInt(idStr.replace('QF-', ''), 10) - 1; // 0 a 3
    const dayIndex = Math.floor(idx / 2); // 2 partidos al día
    const matchIndexInDay = idx % 2;
    const hoursUTC = matchIndexInDay === 0 ? 16 : 20;
    
    const date = new Date('2026-07-10T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + dayIndex);
    date.setUTCHours(hoursUTC, 0, 0, 0);
    return date.toISOString();
  }
  if (idStr.startsWith('SF-')) {
    const idx = parseInt(idStr.replace('SF-', ''), 10) - 1; // 0 a 1
    const date = new Date('2026-07-14T20:00:00Z'); // 20:00 UTC
    date.setUTCDate(date.getUTCDate() + idx);
    return date.toISOString();
  }
  if (idStr === 'TP-1') {
    return '2026-07-18T20:00:00Z';
  }
  if (idStr === 'F-1') {
    return '2026-07-19T20:00:00Z';
  }

  // Valor por defecto (futuro lejano por seguridad)
  return '2026-12-31T23:59:59Z';
}

module.exports = {
  getMatchKickoff
};
