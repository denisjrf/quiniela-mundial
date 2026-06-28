// Datos estáticos oficiales del Mundial de Fútbol 2026 (48 Equipos y Bracket de 16vos)

export const initialTeams = {
  // Grupo A
  'MEX': { id: 'MEX', name: 'México', flag: 'mx', group: 'A' },
  'RSA': { id: 'RSA', name: 'Sudáfrica', flag: 'za', group: 'A' },
  'KOR': { id: 'KOR', name: 'Corea del Sur', flag: 'kr', group: 'A' },
  'CZE': { id: 'CZE', name: 'Czechia', flag: 'cz', group: 'A' },

  // Grupo B
  'CAN': { id: 'CAN', name: 'Canadá', flag: 'ca', group: 'B' },
  'BIH': { id: 'BIH', name: 'Bosnia y Herz.', flag: 'ba', group: 'B' },
  'QAT': { id: 'QAT', name: 'Catar', flag: 'qa', group: 'B' },
  'SUI': { id: 'SUI', name: 'Suiza', flag: 'ch', group: 'B' },

  // Grupo C
  'BRA': { id: 'BRA', name: 'Brasil', flag: 'br', group: 'C' },
  'MAR': { id: 'MAR', name: 'Marruecos', flag: 'ma', group: 'C' },
  'HAI': { id: 'HAI', name: 'Haití', flag: 'ht', group: 'C' },
  'SCO': { id: 'SCO', name: 'Escocia', flag: 'gb', group: 'C' },

  // Grupo D
  'USA': { id: 'USA', name: 'Estados Unidos', flag: 'us', group: 'D' },
  'PAR': { id: 'PAR', name: 'Paraguay', flag: 'py', group: 'D' },
  'AUS': { id: 'AUS', name: 'Australia', flag: 'au', group: 'D' },
  'TUR': { id: 'TUR', name: 'Turquía', flag: 'tr', group: 'D' },

  // Grupo E
  'GER': { id: 'GER', name: 'Alemania', flag: 'de', group: 'E' },
  'CUW': { id: 'CUW', name: 'Curaçao', flag: 'cw', group: 'E' },
  'CIV': { id: 'CIV', name: 'Costa de Marfil', flag: 'ci', group: 'E' },
  'ECU': { id: 'ECU', name: 'Ecuador', flag: 'ec', group: 'E' },

  // Grupo F
  'NED': { id: 'NED', name: 'Países Bajos', flag: 'nl', group: 'F' },
  'JPN': { id: 'JPN', name: 'Japón', flag: 'jp', group: 'F' },
  'SWE': { id: 'SWE', name: 'Suecia', flag: 'se', group: 'F' },
  'TUN': { id: 'TUN', name: 'Túnez', flag: 'tn', group: 'F' },

  // Grupo G
  'BEL': { id: 'BEL', name: 'Bélgica', flag: 'be', group: 'G' },
  'EGY': { id: 'EGY', name: 'Egipto', flag: 'eg', group: 'G' },
  'IRN': { id: 'IRN', name: 'Irán', flag: 'ir', group: 'G' },
  'NZL': { id: 'NZL', name: 'Nueva Zelanda', flag: 'nz', group: 'G' },

  // Grupo H
  'ESP': { id: 'ESP', name: 'España', flag: 'es', group: 'H' },
  'CPV': { id: 'CPV', name: 'Cabo Verde', flag: 'cv', group: 'H' },
  'KSA': { id: 'KSA', name: 'Arabia Saudita', flag: 'sa', group: 'H' },
  'URU': { id: 'URU', name: 'Uruguay', flag: 'uy', group: 'H' },

  // Grupo I
  'FRA': { id: 'FRA', name: 'Francia', flag: 'fr', group: 'I' },
  'SEN': { id: 'SEN', name: 'Senegal', flag: 'sn', group: 'I' },
  'IRQ': { id: 'IRQ', name: 'Irak', flag: 'iq', group: 'I' },
  'NOR': { id: 'NOR', name: 'Noruega', flag: 'no', group: 'I' },

  // Grupo J
  'ARG': { id: 'ARG', name: 'Argentina', flag: 'ar', group: 'J' },
  'ALG': { id: 'ALG', name: 'Argelia', flag: 'dz', group: 'J' },
  'AUT': { id: 'AUT', name: 'Austria', flag: 'at', group: 'J' },
  'JOR': { id: 'JOR', name: 'Jordania', flag: 'jo', group: 'J' },

  // Grupo K
  'POR': { id: 'POR', name: 'Portugal', flag: 'pt', group: 'K' },
  'COD': { id: 'COD', name: 'R.D. Congo', flag: 'cd', group: 'K' },
  'UZB': { id: 'UZB', name: 'Uzbekistán', flag: 'uz', group: 'K' },
  'COL': { id: 'COL', name: 'Colombia', flag: 'co', group: 'K' },

  // Grupo L
  'ENG': { id: 'ENG', name: 'Inglaterra', flag: 'gb', group: 'L' },
  'CRO': { id: 'CRO', name: 'Croacia', flag: 'hr', group: 'L' },
  'GHA': { id: 'GHA', name: 'Ghana', flag: 'gh', group: 'L' },
  'PAN': { id: 'PAN', name: 'Panamá', flag: 'pa', group: 'L' }
};

export const initialGroups = {
  A: ['MEX', 'RSA', 'KOR', 'CZE'],
  B: ['CAN', 'BIH', 'QAT', 'SUI'],
  C: ['BRA', 'MAR', 'HAI', 'SCO'],
  D: ['USA', 'PAR', 'AUS', 'TUR'],
  E: ['GER', 'CUW', 'CIV', 'ECU'],
  F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['ESP', 'CPV', 'KSA', 'URU'],
  I: ['FRA', 'SEN', 'IRQ', 'NOR'],
  J: ['ARG', 'ALG', 'AUT', 'JOR'],
  K: ['POR', 'COD', 'UZB', 'COL'],
  L: ['ENG', 'CRO', 'GHA', 'PAN']
};

export const initialGroupMatches = [
  // Grupo A
  { id: 1, group: 'A', team1: 'MEX', team2: 'RSA', team1Score: '', team2Score: '', date: 'Día 1' },
  { id: 2, group: 'A', team1: 'KOR', team2: 'CZE', team1Score: '', team2Score: '', date: 'Día 1' },
  { id: 3, group: 'A', team1: 'MEX', team2: 'KOR', team1Score: '', team2Score: '', date: 'Día 5' },
  { id: 4, group: 'A', team1: 'CZE', team2: 'RSA', team1Score: '', team2Score: '', date: 'Día 5' },
  { id: 5, group: 'A', team1: 'CZE', team2: 'MEX', team1Score: '', team2Score: '', date: 'Día 9' },
  { id: 6, group: 'A', team1: 'RSA', team2: 'KOR', team1Score: '', team2Score: '', date: 'Día 9' },

  // Grupo B
  { id: 7, group: 'B', team1: 'CAN', team2: 'BIH', team1Score: '', team2Score: '', date: 'Día 2' },
  { id: 8, group: 'B', team1: 'QAT', team2: 'SUI', team1Score: '', team2Score: '', date: 'Día 2' },
  { id: 9, group: 'B', team1: 'CAN', team2: 'QAT', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 10, group: 'B', team1: 'SUI', team2: 'BIH', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 11, group: 'B', team1: 'SUI', team2: 'CAN', team1Score: '', team2Score: '', date: 'Día 10' },
  { id: 12, group: 'B', team1: 'BIH', team2: 'QAT', team1Score: '', team2Score: '', date: 'Día 10' },

  // Grupo C
  { id: 13, group: 'C', team1: 'BRA', team2: 'MAR', team1Score: '', team2Score: '', date: 'Día 2' },
  { id: 14, group: 'C', team1: 'HAI', team2: 'SCO', team1Score: '', team2Score: '', date: 'Día 2' },
  { id: 15, group: 'C', team1: 'BRA', team2: 'HAI', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 16, group: 'C', team1: 'SCO', team2: 'MAR', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 17, group: 'C', team1: 'SCO', team2: 'BRA', team1Score: '', team2Score: '', date: 'Día 10' },
  { id: 18, group: 'C', team1: 'MAR', team2: 'HAI', team1Score: '', team2Score: '', date: 'Día 10' },

  // Grupo D
  { id: 19, group: 'D', team1: 'USA', team2: 'PAR', team1Score: '', team2Score: '', date: 'Día 3' },
  { id: 20, group: 'D', team1: 'AUS', team2: 'TUR', team1Score: '', team2Score: '', date: 'Día 3' },
  { id: 21, group: 'D', team1: 'USA', team2: 'AUS', team1Score: '', team2Score: '', date: 'Día 7' },
  { id: 22, group: 'D', team1: 'TUR', team2: 'PAR', team1Score: '', team2Score: '', date: 'Día 7' },
  { id: 23, group: 'D', team1: 'TUR', team2: 'USA', team1Score: '', team2Score: '', date: 'Día 11' },
  { id: 24, group: 'D', team1: 'PAR', team2: 'AUS', team1Score: '', team2Score: '', date: 'Día 11' },

  // Grupo E
  { id: 25, group: 'E', team1: 'GER', team2: 'CUW', team1Score: '', team2Score: '', date: 'Día 3' },
  { id: 26, group: 'E', team1: 'CIV', team2: 'ECU', team1Score: '', team2Score: '', date: 'Día 3' },
  { id: 27, group: 'E', team1: 'GER', team2: 'CIV', team1Score: '', team2Score: '', date: 'Día 7' },
  { id: 28, group: 'E', team1: 'ECU', team2: 'CUW', team1Score: '', team2Score: '', date: 'Día 7' },
  { id: 29, group: 'E', team1: 'ECU', team2: 'GER', team1Score: '', team2Score: '', date: 'Día 11' },
  { id: 30, group: 'E', team1: 'CUW', team2: 'CIV', team1Score: '', team2Score: '', date: 'Día 11' },

  // Grupo F
  { id: 31, group: 'F', team1: 'NED', team2: 'JPN', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 32, group: 'F', team1: 'SWE', team2: 'TUN', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 33, group: 'F', team1: 'NED', team2: 'SWE', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 34, group: 'F', team1: 'TUN', team2: 'JPN', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 35, group: 'F', team1: 'TUN', team2: 'NED', team1Score: '', team2Score: '', date: 'Día 12' },
  { id: 36, group: 'F', team1: 'JPN', team2: 'SWE', team1Score: '', team2Score: '', date: 'Día 12' },

  // Grupo G
  { id: 37, group: 'G', team1: 'BEL', team2: 'EGY', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 38, group: 'G', team1: 'IRN', team2: 'NZL', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 39, group: 'G', team1: 'BEL', team2: 'IRN', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 40, group: 'G', team1: 'NZL', team2: 'EGY', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 41, group: 'G', team1: 'NZL', team2: 'BEL', team1Score: '', team2Score: '', date: 'Día 12' },
  { id: 42, group: 'G', team1: 'EGY', team2: 'IRN', team1Score: '', team2Score: '', date: 'Día 12' },

  // Grupo H
  { id: 43, group: 'H', team1: 'ESP', team2: 'CPV', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 44, group: 'H', team1: 'KSA', team2: 'URU', team1Score: '', team2Score: '', date: 'Día 4' },
  { id: 45, group: 'H', team1: 'ESP', team2: 'KSA', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 46, group: 'H', team1: 'URU', team2: 'CPV', team1Score: '', team2Score: '', date: 'Día 8' },
  { id: 47, group: 'H', team1: 'URU', team2: 'ESP', team1Score: '', team2Score: '', date: 'Día 12' },
  { id: 48, group: 'H', team1: 'CPV', team2: 'KSA', team1Score: '', team2Score: '', date: 'Día 12' },

  // Grupo I
  { id: 49, group: 'I', team1: 'FRA', team2: 'SEN', team1Score: '', team2Score: '', date: 'Día 5' },
  { id: 50, group: 'I', team1: 'IRQ', team2: 'NOR', team1Score: '', team2Score: '', date: 'Día 5' },
  { id: 51, group: 'I', team1: 'FRA', team2: 'IRQ', team1Score: '', team2Score: '', date: 'Día 9' },
  { id: 52, group: 'I', team1: 'NOR', team2: 'SEN', team1Score: '', team2Score: '', date: 'Día 9' },
  { id: 53, group: 'I', team1: 'NOR', team2: 'FRA', team1Score: '', team2Score: '', date: 'Día 13' },
  { id: 54, group: 'I', team1: 'SEN', team2: 'IRQ', team1Score: '', team2Score: '', date: 'Día 13' },

  // Grupo J
  { id: 55, group: 'J', team1: 'ARG', team2: 'ALG', team1Score: '', team2Score: '', date: 'Día 5' },
  { id: 56, group: 'J', team1: 'AUT', team2: 'JOR', team1Score: '', team2Score: '', date: 'Día 5' },
  { id: 57, group: 'J', team1: 'ARG', team2: 'AUT', team1Score: '', team2Score: '', date: 'Día 9' },
  { id: 58, group: 'J', team1: 'JOR', team2: 'ALG', team1Score: '', team2Score: '', date: 'Día 9' },
  { id: 59, group: 'J', team1: 'JOR', team2: 'ARG', team1Score: '', team2Score: '', date: 'Día 13' },
  { id: 60, group: 'J', team1: 'ALG', team2: 'AUT', team1Score: '', team2Score: '', date: 'Día 13' },

  // Grupo K
  { id: 61, group: 'K', team1: 'POR', team2: 'COD', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 62, group: 'K', team1: 'UZB', team2: 'COL', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 63, group: 'K', team1: 'POR', team2: 'UZB', team1Score: '', team2Score: '', date: 'Día 10' },
  { id: 64, group: 'K', team1: 'COL', team2: 'COD', team1Score: '', team2Score: '', date: 'Día 10' },
  { id: 65, group: 'K', team1: 'COL', team2: 'POR', team1Score: '', team2Score: '', date: 'Día 14' },
  { id: 66, group: 'K', team1: 'COD', team2: 'UZB', team1Score: '', team2Score: '', date: 'Día 14' },

  // Grupo L
  { id: 67, group: 'L', team1: 'ENG', team2: 'CRO', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 68, group: 'L', team1: 'GHA', team2: 'PAN', team1Score: '', team2Score: '', date: 'Día 6' },
  { id: 69, group: 'L', team1: 'ENG', team2: 'GHA', team1Score: '', team2Score: '', date: 'Día 10' },
  { id: 70, group: 'L', team1: 'PAN', team2: 'CRO', team1Score: '', team2Score: '', date: 'Día 10' },
  { id: 71, group: 'L', team1: 'PAN', team2: 'ENG', team1Score: '', team2Score: '', date: 'Día 14' },
  { id: 72, group: 'L', team1: 'CRO', team2: 'GHA', team1Score: '', team2Score: '', date: 'Día 14' }
];

// Estructura de eliminatorias directas del Mundial 2026. 
// Comienza en Dieciseisavos (Round of 32 / 16vos) con 16 partidos.
export const initialKnockoutStage = {
  roundOf32: [
    { id: 'R32-1', type: '1A_3C/D/E', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 1' },
    { id: 'R32-2', type: '2B_2F', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 2' },
    { id: 'R32-3', type: '1C_3A/B/F', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 3' },
    { id: 'R32-4', type: '2D_2H', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 4' },
    { id: 'R32-5', type: '1E_3B/C/D', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 5' },
    { id: 'R32-6', type: '2A_2C', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 6' },
    { id: 'R32-7', type: '1G_3C/E/F', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 7' },
    { id: 'R32-8', type: '2E_2G', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 8' },
    { id: 'R32-9', type: '1B_3A/D/E', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 9' },
    { id: 'R32-10', type: '2C_2G', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 10' },
    { id: 'R32-11', type: '1D_3B/E/F', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 11' },
    { id: 'R32-12', type: '2F_2H', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 12' },
    { id: 'R32-13', type: '1F_3A/C/D', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 13' },
    { id: 'R32-14', type: '2E_2H', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 14' },
    { id: 'R32-15', type: '1H_3A/B/C', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 15' },
    { id: 'R32-16', type: '2G_2I', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: '16vos 16' }
  ],
  roundOf16: [
    { id: 'R16-1', source1: 'R32-1', source2: 'R32-2', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 1' },
    { id: 'R16-2', source1: 'R32-3', source2: 'R32-4', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 2' },
    { id: 'R16-3', source1: 'R32-5', source2: 'R32-6', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 3' },
    { id: 'R16-4', source1: 'R32-7', source2: 'R32-8', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 4' },
    { id: 'R16-5', source1: 'R32-9', source2: 'R32-10', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 5' },
    { id: 'R16-6', source1: 'R32-11', source2: 'R32-12', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 6' },
    { id: 'R16-7', source1: 'R32-13', source2: 'R32-14', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 7' },
    { id: 'R16-8', source1: 'R32-15', source2: 'R32-16', team1: null, team2: null, team1Score: '', team2Score: '', winner: null, date: 'Octavos 8' }
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

export function getMatchKickoff(matchId) {
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
    const groupIndex = Math.floor((numericId - 1) / 6);
    const groupLetter = String.fromCharCode(65 + groupIndex); // A, B, C...
    const matchIndexInGroup = (numericId - 1) % 6; // 0 a 5
    
    // Jornada 1: index 0, 1 | Jornada 2: index 2, 3 | Jornada 3: index 4, 5
    const matchdayIndex = Math.floor(matchIndexInGroup / 2);
    const dateStr = groupMatchDates[groupLetter][matchdayIndex];
    
    const localHour = 15 + ((numericId - 1) % 3) * 3;
    const hoursUTC = localHour + 4;
    
    const date = new Date(`${dateStr}T00:00:00Z`);
    date.setUTCHours(hoursUTC, 0, 0, 0);
    return date.toISOString();
  }

  const idStr = String(matchId);
  if (idStr.startsWith('R32-')) {
    const r32Kickoffs = {
      'R32-1': '2026-06-28T19:00:00.000Z', // June 28, 3:00 PM local (UTC-4)
      'R32-2': '2026-06-30T01:00:00.000Z', // June 29, 9:00 PM local
      'R32-3': '2026-06-29T20:30:00.000Z', // June 29, 4:30 PM local
      'R32-4': '2026-06-30T21:00:00.000Z', // June 30, 5:00 PM local
      'R32-5': '2026-07-01T20:00:00.000Z', // July 1, 4:00 PM local
      'R32-6': '2026-07-02T00:00:00.000Z', // July 1, 8:00 PM local
      'R32-7': '2026-07-02T19:00:00.000Z', // July 2, 3:00 PM local
      'R32-8': '2026-07-02T23:00:00.000Z', // July 2, 7:00 PM local
      'R32-9': '2026-06-29T17:00:00.000Z', // June 29, 1:00 PM local
      'R32-10': '2026-06-30T17:00:00.000Z', // June 30, 1:00 PM local
      'R32-11': '2026-07-01T01:00:00.000Z', // June 30, 9:00 PM local
      'R32-12': '2026-07-01T16:00:00.000Z', // July 1, 12:00 PM local
      'R32-13': '2026-07-03T03:00:00.000Z', // July 2, 11:00 PM local
      'R32-14': '2026-07-04T01:30:00.000Z', // July 3, 9:30 PM local
      'R32-15': '2026-07-03T18:00:00.000Z', // July 3, 2:00 PM local
      'R32-16': '2026-07-03T22:00:00.000Z'  // July 3, 6:00 PM local
    };
    if (r32Kickoffs[idStr]) {
      return r32Kickoffs[idStr];
    }
  }
  if (idStr.startsWith('R16-')) {
    const r16Kickoffs = {
      'R16-1': '2026-07-04T17:00:00.000Z', // Sáb 4/7, 1:00 PM local (UTC-4)
      'R16-2': '2026-07-04T21:00:00.000Z', // Sáb 4/7, 5:00 PM local
      'R16-3': '2026-07-05T20:00:00.000Z', // Dom 5/7, 4:00 PM local
      'R16-4': '2026-07-06T00:00:00.000Z', // Dom 5/7, 8:00 PM local
      'R16-5': '2026-07-07T00:00:00.000Z', // Lun 6/7, 8:00 PM local
      'R16-6': '2026-07-06T19:00:00.000Z', // Lun 6/7, 3:00 PM local
      'R16-7': '2026-07-07T20:00:00.000Z', // Mar 7/7, 4:00 PM local
      'R16-8': '2026-07-07T16:00:00.000Z'  // Mar 7/7, 12:00 PM local
    };
    if (r16Kickoffs[idStr]) {
      return r16Kickoffs[idStr];
    }
  }
  if (idStr.startsWith('QF-')) {
    const qfKickoffs = {
      'QF-1': '2026-07-09T20:00:00.000Z', // Jue 9/7, 4:00 PM local (UTC-4)
      'QF-2': '2026-07-10T19:00:00.000Z', // Vie 10/7, 3:00 PM local
      'QF-3': '2026-07-11T21:00:00.000Z', // Sáb 11/7, 5:00 PM local
      'QF-4': '2026-07-12T01:00:00.000Z'  // Sáb 11/7, 9:00 PM local
    };
    if (qfKickoffs[idStr]) {
      return qfKickoffs[idStr];
    }
  }
  if (idStr.startsWith('SF-')) {
    const sfKickoffs = {
      'SF-1': '2026-07-14T19:00:00.000Z', // 14/7, 3:00 PM local (UTC-4)
      'SF-2': '2026-07-15T19:00:00.000Z'  // 15/7, 3:00 PM local
    };
    if (sfKickoffs[idStr]) {
      return sfKickoffs[idStr];
    }
  }
  if (idStr === 'TP-1') {
    return '2026-07-18T19:00:00.000Z'; // Sáb 18/7, 3:00 PM local (Hora por defecto)
  }
  if (idStr === 'F-1') {
    return '2026-07-19T19:00:00.000Z'; // Dom 19/7, 3:00 PM local
  }

  return '2026-12-31T23:59:59Z';
}

// Inyectar dinámicamente kickoff y formatear la fecha
initialGroupMatches.forEach(m => {
  m.kickoff = getMatchKickoff(m.id);
  // Reemplazar el genérico "Día X" por la fecha real ("11 de Jun")
  const dateStr = m.kickoff.split('T')[0];
  const [, month, day] = dateStr.split('-');
  const monthNames = { '06': 'Jun', '07': 'Jul' };
  m.date = `${parseInt(day, 10)} de ${monthNames[month]}`;
});

Object.keys(initialKnockoutStage).forEach(roundKey => {
  initialKnockoutStage[roundKey].forEach(m => {
    m.kickoff = getMatchKickoff(m.id);
  });
});
