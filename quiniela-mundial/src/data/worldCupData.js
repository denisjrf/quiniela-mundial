// Datos estáticos iniciales del Mundial de Fútbol (Fase de Grupos y Eliminatorias)

export const initialTeams = {
  // Grupo A
  'ARG': { id: 'ARG', name: 'Argentina', flag: 'ar', group: 'A' },
  'MEX': { id: 'MEX', name: 'México', flag: 'mx', group: 'A' },
  'POL': { id: 'POL', name: 'Polonia', flag: 'pl', group: 'A' },
  'KSA': { id: 'KSA', name: 'Arabia Saudita', flag: 'sa', group: 'A' },

  // Grupo B
  'FRA': { id: 'FRA', name: 'Francia', flag: 'fr', group: 'B' },
  'DEN': { id: 'DEN', name: 'Dinamarca', flag: 'dk', group: 'B' },
  'AUS': { id: 'AUS', name: 'Australia', flag: 'au', group: 'B' },
  'TUN': { id: 'TUN', name: 'Túnez', flag: 'tn', group: 'B' },

  // Grupo C
  'ESP': { id: 'ESP', name: 'España', flag: 'es', group: 'C' },
  'GER': { id: 'GER', name: 'Alemania', flag: 'de', group: 'C' },
  'JPN': { id: 'JPN', name: 'Japón', flag: 'jp', group: 'C' },
  'CRC': { id: 'CRC', name: 'Costa Rica', flag: 'cr', group: 'C' },

  // Grupo D
  'BRA': { id: 'BRA', name: 'Brasil', flag: 'br', group: 'D' },
  'SUI': { id: 'SUI', name: 'Suiza', flag: 'ch', group: 'D' },
  'SRB': { id: 'SRB', name: 'Serbia', flag: 'rs', group: 'D' },
  'CMR': { id: 'CMR', name: 'Camerún', flag: 'cm', group: 'D' },

  // Grupo E
  'ENG': { id: 'ENG', name: 'Inglaterra', flag: 'gb', group: 'E' }, // Usar 'gb' para Inglaterra si gb-eng no es estándar
  'USA': { id: 'USA', name: 'Estados Unidos', flag: 'us', group: 'E' },
  'WAL': { id: 'WAL', name: 'Gales', flag: 'gb', group: 'E' }, // Usar 'gb' para Gales
  'IRN': { id: 'IRN', name: 'Irán', flag: 'ir', group: 'E' },

  // Grupo F
  'BEL': { id: 'BEL', name: 'Bélgica', flag: 'be', group: 'F' },
  'CRO': { id: 'CRO', name: 'Croacia', flag: 'hr', group: 'F' },
  'MAR': { id: 'MAR', name: 'Marruecos', flag: 'ma', group: 'F' },
  'CAN': { id: 'CAN', name: 'Canadá', flag: 'ca', group: 'F' },

  // Grupo G
  'POR': { id: 'POR', name: 'Portugal', flag: 'pt', group: 'G' },
  'URU': { id: 'URU', name: 'Uruguay', flag: 'uy', group: 'G' },
  'KOR': { id: 'KOR', name: 'Corea del Sur', flag: 'kr', group: 'G' },
  'GHA': { id: 'GHA', name: 'Ghana', flag: 'gh', group: 'G' },

  // Grupo H
  'NED': { id: 'NED', name: 'Países Bajos', flag: 'nl', group: 'H' },
  'SEN': { id: 'SEN', name: 'Senegal', flag: 'sn', group: 'H' },
  'ECU': { id: 'ECU', name: 'Ecuador', flag: 'ec', group: 'H' },
  'QAT': { id: 'QAT', name: 'Catar', flag: 'qa', group: 'H' }
};

export const initialGroups = {
  A: ['ARG', 'MEX', 'POL', 'KSA'],
  B: ['FRA', 'DEN', 'AUS', 'TUN'],
  C: ['ESP', 'GER', 'JPN', 'CRC'],
  D: ['BRA', 'SUI', 'SRB', 'CMR'],
  E: ['ENG', 'USA', 'WAL', 'IRN'],
  F: ['BEL', 'CRO', 'MAR', 'CAN'],
  G: ['POR', 'URU', 'KOR', 'GHA'],
  H: ['NED', 'SEN', 'ECU', 'QAT']
};

export const initialGroupMatches = [
  // Grupo A
  { id: 1, group: 'A', team1: 'ARG', team2: 'KSA', team1Score: '', team2Score: '', date: 'Día 1' },
  { id: 2, group: 'A', team1: 'MEX', team2: 'POL', team1Score: '', team2Score: '', date: 'Día 1' },
  { id: 3, group: 'A', team1: 'ARG', team2: 'MEX', team1Score: '', team2Score: '', date: 'Día 5' },
  { id: 4, group: 'A', team1: 'POL', team2: 'KSA', team1Score: '', team2Score: '', date: 'Día 5' },
  { id: 5, group: 'A', team1: 'POL', team2: 'ARG', team1Score: '', team2Score: '', date: 'Día 9' },
  { id: 6, group: 'A', team1: 'KSA', team2: 'MEX', team1Score: '', team2Score: '', date: 'Día 9' },

  // Grupo B
  { id: 7, group: 'B', team1: 'FRA', team2: 'AUS', team1Score: '', team2Score: '', date: 'Día 2' },
  { id: 8, group: 'B', team1: 'DEN', team2: 'TUN', team1Score: '', team2Score: '', date: 'Día 2' },
  { id: 9, group: 'B', team1: 'FRA', team2: 'DEN', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 10, group: 'B', team1: 'TUN', team2: 'AUS', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 11, group: 'B', team1: 'TUN', team2: 'FRA', team1Score: '', team2Score: '', date: 'Día 10' },
  { id: 12, group: 'B', team1: 'AUS', team2: 'DEN', team1Score: '', team2Score: '', date: 'Día 10' },

  // Grupo C
  { id: 13, group: 'C', team1: 'ESP', team2: 'CRC', team1Score: '', team2Score: '', date: 'Día 2' },
  { id: 14, group: 'C', team1: 'GER', team2: 'JPN', team1Score: '', team2Score: '', date: 'Día 2' },
  { id: 15, group: 'C', team1: 'ESP', team2: 'GER', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 16, group: 'C', team1: 'JPN', team2: 'CRC', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 17, group: 'C', team1: 'JPN', team2: 'ESP', team1Score: '', team2Score: '', date: 'Día 10' },
  { id: 18, group: 'C', team1: 'CRC', team2: 'GER', team1Score: '', team2Score: '', date: 'Día 10' },

  // Grupo D
  { id: 19, group: 'D', team1: 'BRA', team2: 'SRB', team1Score: '', team2Score: '', date: 'Día 3' },
  { id: 20, group: 'D', team1: 'SUI', team2: 'CMR', team1Score: '', team2Score: '', date: 'Día 3' },
  { id: 21, group: 'D', team1: 'BRA', team2: 'SUI', team1Score: '', team2Score: '', date: 'Día 7' },
  { id: 22, group: 'D', team1: 'CMR', team2: 'SRB', team1Score: '', team2Score: '', date: 'Día 7' },
  { id: 23, group: 'D', team1: 'CMR', team2: 'BRA', team1Score: '', team2Score: '', date: 'Día 11' },
  { id: 24, group: 'D', team1: 'SRB', team2: 'SUI', team1Score: '', team2Score: '', date: 'Día 11' },

  // Grupo E
  { id: 25, group: 'E', team1: 'ENG', team2: 'IRN', team1Score: '', team2Score: '', date: 'Día 3' },
  { id: 26, group: 'E', team1: 'USA', team2: 'WAL', team1Score: '', team2Score: '', date: 'Día 3' },
  { id: 27, group: 'E', team1: 'ENG', team2: 'USA', team1Score: '', team2Score: '', date: 'Día 7' },
  { id: 28, group: 'E', team1: 'WAL', team2: 'IRN', team1Score: '', team2Score: '', date: 'Día 7' },
  { id: 29, group: 'E', team1: 'WAL', team2: 'ENG', team1Score: '', team2Score: '', date: 'Día 11' },
  { id: 30, group: 'E', team1: 'IRN', team2: 'USA', team1Score: '', team2Score: '', date: 'Día 11' },

  // Grupo F
  { id: 31, group: 'F', team1: 'BEL', team2: 'CAN', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 32, group: 'F', team1: 'CRO', team2: 'MAR', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 33, group: 'F', team1: 'BEL', team2: 'CRO', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 34, group: 'F', team1: 'MAR', team2: 'CAN', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 35, group: 'F', team1: 'MAR', team2: 'BEL', team1Score: '', team2Score: '', date: 'Día 12' },
  { id: 36, group: 'F', team1: 'CAN', team2: 'CRO', team1Score: '', team2Score: '', date: 'Día 12' },

  // Grupo G
  { id: 37, group: 'G', team1: 'POR', team2: 'GHA', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 38, group: 'G', team1: 'URU', team2: 'KOR', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 39, group: 'G', team1: 'POR', team2: 'URU', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 40, group: 'G', team1: 'KOR', team2: 'GHA', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 41, group: 'G', team1: 'KOR', team2: 'POR', team1Score: '', team2Score: '', date: 'Día 12' },
  { id: 42, group: 'G', team1: 'GHA', team2: 'URU', team1Score: '', team2Score: '', date: 'Día 12' },

  // Grupo H
  { id: 43, group: 'H', team1: 'NED', team2: 'SEN', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 44, group: 'H', team1: 'ECU', team2: 'QAT', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 45, group: 'H', team1: 'NED', team2: 'ECU', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 46, group: 'H', team1: 'QAT', team2: 'SEN', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 47, group: 'H', team1: 'QAT', team2: 'NED', team1Score: '', team2Score: '', date: 'Día 12' },
  { id: 48, group: 'H', team1: 'SEN', team2: 'ECU', team1Score: '', team2Score: '', date: 'Día 12' }
];

// Estructura de eliminatorias directas. 
// Para octavos, 'type' hace referencia a las llaves: e.g. '1A' es el primer lugar del Grupo A, '2B' el segundo del B.
export const initialKnockoutStage = {
  roundOf16: [
    { id: 'R16-1', type: '1A_2B', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 1' },
    { id: 'R16-2', type: '1C_2D', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 2' },
    { id: 'R16-3', type: '1E_2F', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 3' },
    { id: 'R16-4', type: '1G_2H', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 4' },
    { id: 'R16-5', type: '1B_2A', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 5' },
    { id: 'R16-6', type: '1D_2C', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 6' },
    { id: 'R16-7', type: '1F_2E', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 7' },
    { id: 'R16-8', type: '1H_2G', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 8' }
  ],
  quarterfinals: [
    { id: 'QF-1', source1: 'R16-1', source2: 'R16-2', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Cuartos 1' },
    { id: 'QF-2', source1: 'R16-3', source2: 'R16-4', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Cuartos 2' },
    { id: 'QF-3', source1: 'R16-5', source2: 'R16-6', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Cuartos 3' },
    { id: 'QF-4', source1: 'R16-7', source2: 'R16-8', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Cuartos 4' }
  ],
  semifinals: [
    { id: 'SF-1', source1: 'QF-1', source2: 'QF-2', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Semifinal 1' },
    { id: 'SF-2', source1: 'QF-3', source2: 'QF-4', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Semifinal 2' }
  ],
  thirdPlace: [
    { id: 'TP-1', source1: 'SF-1_loser', source2: 'SF-2_loser', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Tercer Puesto' }
  ],
  final: [
    { id: 'F-1', source1: 'SF-1', source2: 'SF-2', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Gran Final' }
  ]
};

// Función determinista para obtener el horario de inicio (kickoff) de cada partido de forma realista
export function getMatchKickoff(matchId) {
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

// Inyectar dinámicamente el campo kickoff en los objetos para que el resto del sistema lo tenga listo
initialGroupMatches.forEach(m => {
  m.kickoff = getMatchKickoff(m.id);
});

Object.keys(initialKnockoutStage).forEach(roundKey => {
  initialKnockoutStage[roundKey].forEach(m => {
    m.kickoff = getMatchKickoff(m.id);
  });
});

