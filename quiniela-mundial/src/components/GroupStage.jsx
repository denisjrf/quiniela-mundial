import React, { useState } from 'react';
import { getMatchKickoff } from '../data/worldCupData';

export default function GroupStage({ 
  groupMatches, 
  teams, 
  onMatchScoreChange,
  faseLocked = false
}) {
  const isMatchLocked = (matchId) => {
    if (faseLocked) return true;
    const kickoff = getMatchKickoff(matchId);
    return Date.now() > (new Date(kickoff).getTime() - 30 * 60 * 1000);
  };


  // Estado local para controlar qué pestaña está activa en cada grupo ('matches' o 'standings')
  // Usamos un objeto { [groupName]: 'matches' | 'standings' }
  const [activeGroupTab, setActiveGroupTab] = useState({
    A: 'matches', B: 'matches', C: 'matches', D: 'matches',
    E: 'matches', F: 'matches', G: 'matches', H: 'matches',
    I: 'matches', J: 'matches', K: 'matches', L: 'matches'
  });

  const toggleGroupTab = (group, tab) => {
    setActiveGroupTab(prev => ({
      ...prev,
      [group]: tab
    }));
  };

  const groupKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Función para calcular la tabla de posiciones de un grupo específico
  const calculateStandings = (groupKey) => {
    // Obtener los IDs de los equipos en este grupo
    const groupTeams = Object.values(teams).filter(t => t.group === groupKey).map(t => t.id);
    
    // Inicializar estadísticas de cada equipo
    const stats = {};
    groupTeams.forEach(teamId => {
      stats[teamId] = { id: teamId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });

    // Filtrar partidos de este grupo
    const matches = groupMatches.filter(m => m.group === groupKey);

    // Recorrer los partidos y agregar las estadísticas
    matches.forEach(m => {
      const score1 = m.team1Score;
      const score2 = m.team2Score;

      // Solo calcular si ambos marcadores están ingresados
      if (score1 !== '' && score2 !== '' && score1 !== null && score2 !== null) {
        const s1 = parseInt(score1, 10);
        const s2 = parseInt(score2, 10);

        if (!isNaN(s1) && !isNaN(s2)) {
          if (stats[m.team1] && stats[m.team2]) {
            stats[m.team1].played += 1;
            stats[m.team2].played += 1;
            stats[m.team1].gf += s1;
            stats[m.team1].ga += s2;
            stats[m.team2].gf += s2;
            stats[m.team2].ga += s1;

            if (s1 > s2) {
              stats[m.team1].won += 1;
              stats[m.team1].pts += 3;
              stats[m.team2].lost += 1;
            } else if (s1 < s2) {
              stats[m.team2].won += 1;
              stats[m.team2].pts += 3;
              stats[m.team1].lost += 1;
            } else {
              stats[m.team1].drawn += 1;
              stats[m.team1].pts += 1;
              stats[m.team2].drawn += 1;
              stats[m.team2].pts += 1;
            }
          }
        }
      }
    });

    // Calcular Diferencia de Goles
    groupTeams.forEach(teamId => {
      stats[teamId].gd = stats[teamId].gf - stats[teamId].ga;
    });

    // Ordenar equipos por Puntos, luego Diferencia de Goles, luego Goles a Favor, luego Alfabético
    return Object.values(stats).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.id.localeCompare(b.id);
    });
  };

  const handleScoreInput = (matchId, teamKey, val) => {
    // Permitir solo números o cadena vacía
    if (val === '' || /^\d+$/.test(val)) {
      onMatchScoreChange(matchId, teamKey, val);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="gradient-text" style={{ fontWeight: 800 }}>Fase de Grupos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Rellena los resultados de cada partido. Las tablas se recalcularán automáticamente al instante.
          </p>
        </div>
      </div>

      <div className="groups-grid">
        {groupKeys.map(groupKey => {
          const standings = calculateStandings(groupKey);
          const groupMatchesList = groupMatches.filter(m => m.group === groupKey);
          const currentTab = activeGroupTab[groupKey];

          return (
            <div key={groupKey} className="glass-card group-card">
              <div className="group-header">
                <h3 className="gradient-text-purple">Grupo {groupKey}</h3>
                
                {/* Selector de Pestañas del Grupo */}
                <div className="group-tabs">
                  <button 
                    className={`group-tab-btn ${currentTab === 'matches' ? 'active' : ''}`}
                    onClick={() => toggleGroupTab(groupKey, 'matches')}
                  >
                    Partidos
                  </button>
                  <button 
                    className={`group-tab-btn ${currentTab === 'standings' ? 'active' : ''}`}
                    onClick={() => toggleGroupTab(groupKey, 'standings')}
                  >
                    Clasificación
                  </button>
                </div>
              </div>

              {currentTab === 'matches' ? (
                /* Lista de Partidos del Grupo */
                <div className="matches-list">
                  {groupMatchesList.map(match => {
                    const team1Obj = teams[match.team1] || { id: match.team1, name: match.team1 || 'TBD', flag: 'un' };
                    const team2Obj = teams[match.team2] || { id: match.team2, name: match.team2 || 'TBD', flag: 'un' };
                    const locked = isMatchLocked(match.id);

                    return (
                      <div key={match.id} className={`match-item ${locked ? 'locked' : ''}`}>
                        {/* Equipo 1 */}
                        <div className="match-team team1">
                          <span className="team-name-full" style={{ marginRight: '0.2rem' }}>{team1Obj.name}</span>
                          <img 
                            src={`https://flagcdn.com/w40/${team1Obj.flag}.png`} 
                            alt={team1Obj.name} 
                            className="team-flag-img" 
                            style={{ opacity: locked ? 0.6 : 1 }}
                          />
                          <span className="team-name-short">{match.team1}</span>
                        </div>

                        {/* Controles de Marcador */}
                        <div className={`match-score-inputs ${locked ? 'locked' : ''}`}>
                          <input
                            type="text"
                            inputMode="numeric"
                            className={`score-input ${locked ? 'disabled' : ''}`}
                            value={match.team1Score}
                            onChange={(e) => handleScoreInput(match.id, 'team1Score', e.target.value)}
                            maxLength={2}
                            disabled={locked}
                          />
                          <span className="match-vs" style={{ color: locked ? 'var(--color-danger)' : 'inherit', fontSize: locked ? '1.1rem' : 'inherit' }}>
                            {locked ? '🔒' : 'vs'}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            className={`score-input ${locked ? 'disabled' : ''}`}
                            value={match.team2Score}
                            onChange={(e) => handleScoreInput(match.id, 'team2Score', e.target.value)}
                            maxLength={2}
                            disabled={locked}
                          />
                        </div>

                        {/* Equipo 2 */}
                        <div className="match-team team2">
                          <span className="team-name-short">{match.team2}</span>
                          <img 
                            src={`https://flagcdn.com/w40/${team2Obj.flag}.png`} 
                            alt={team2Obj.name} 
                            className="team-flag-img" 
                            style={{ opacity: locked ? 0.6 : 1 }}
                          />
                          <span className="team-name-full" style={{ marginLeft: '0.2rem' }}>{team2Obj.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Tabla de Clasificación en Tiempo Real */
                <div className="fade-in standings-container">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Equipo</th>
                        <th>PJ</th>
                        <th>G</th>
                        <th>E</th>
                        <th>P</th>
                        <th>GF</th>
                        <th>GC</th>
                        <th>DG</th>
                        <th>PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row, index) => {
                        const isQualifying = index < 2; // Clasifican los 2 primeros
                        const teamObj = teams[row.id];

                        return (
                          <tr key={row.id} className={isQualifying ? 'qualifying-row' : ''}>
                            <td className={`standings-team-cell ${isQualifying ? 'qualify-spot' : ''}`}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '0.15rem' }}>
                                {index + 1}
                              </span>
                              <img 
                                src={`https://flagcdn.com/w40/${teamObj.flag}.png`} 
                                alt={teamObj.name} 
                                className="team-flag-img" 
                              />
                              <span className="standings-team-name-full">{teamObj.name}</span>
                              <span className="standings-team-name-short">{row.id}</span>
                            </td>
                            <td>{row.played}</td>
                            <td>{row.won}</td>
                            <td>{row.drawn}</td>
                            <td>{row.lost}</td>
                            <td>{row.gf}</td>
                            <td>{row.ga}</td>
                            <td style={{ color: row.gd > 0 ? 'var(--color-primary)' : row.gd < 0 ? 'var(--color-danger)' : 'inherit', fontWeight: '600' }}>
                              {row.gd > 0 ? `+${row.gd}` : row.gd}
                            </td>
                            <td className="points-cell" style={{ color: isQualifying ? 'var(--color-primary)' : 'inherit' }}>
                              {row.pts}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="instructions-tip" style={{ fontSize: '0.7rem', padding: '0.4rem 0.6rem', marginTop: '0.75rem', gap: '0.35rem' }}>
                    <span>💡</span>
                    <span>Los dos primeros equipos y los 8 mejores terceros avanzan a Dieciseisavos de Final.</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
