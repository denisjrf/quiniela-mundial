import React, { useState } from 'react';
import { getMatchKickoff } from '../data/worldCupData';

export default function KnockoutStage({ 
  knockoutStage, 
  teams, 
  onKnockoutScoreChange, 
  onSelectWinner,
  groupWinnersReady,
  faseLocked = false
}) {
  const [showChampModal, setShowChampModal] = useState(false);
  const [lastChampion, setLastChampion] = useState(null);

  const isMatchLocked = (matchId) => {
    if (faseLocked) return true;
    if (!groupWinnersReady) return true;
    if (!matchId) return false;
    const kickoff = getMatchKickoff(matchId);
    return Date.now() > (new Date(kickoff).getTime() - 30 * 60 * 1000);
  };



  const getTeamName = (teamId, placeholder) => {
    if (!teamId) return <span className="bracket-empty-team">{placeholder}</span>;
    const team = teams[teamId];
    if (!team) return <span className="bracket-empty-team">{placeholder}</span>;
    return (
      <span className="bracket-team-info">
        <img 
          src={`https://flagcdn.com/w40/${team.flag}.png`} 
          alt={team.name} 
          className="team-flag-img" 
        />
        <span>{team.name}</span>
      </span>
    );
  };

  const handleScoreInput = (round, matchId, teamKey, val) => {
    if (isMatchLocked(matchId)) return; // Bloquear si el partido está cerrado
    if (val === '' || /^\d+$/.test(val)) {
      onKnockoutScoreChange(round, matchId, teamKey, val);
    }
  };

  // Cuando se elige al campeón de forma explícita al hacer clic en el final
  const handleWinnerClick = (round, match, teamId) => {
    if (!teamId) return; // No se puede seleccionar un equipo vacío
    if (isMatchLocked(match.id)) return; // Bloquear si el partido está cerrado
    onSelectWinner(round, match.id, teamId);

    // Si es la final y se corona al campeón, mostrar modal de celebración
    if (round === 'final') {
      setLastChampion(teamId);
      setShowChampModal(true);
    }
  };

  const finalMatch = knockoutStage.final?.[0];
  const championTeam = finalMatch?.winner ? teams[finalMatch.winner] : null;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="gradient-text" style={{ fontWeight: 800 }}>Fase de Eliminatorias</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Ingresa tus marcadores pronosticados para cada partido de la fase eliminatoria.
          </p>
        </div>
        {!groupWinnersReady && (
          <div style={{ background: 'rgba(255, 0, 85, 0.08)', border: '1px solid rgba(255, 0, 85, 0.2)', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
            ⚠️ Falta completar partidos de la Fase de Grupos
          </div>
        )}
      </div>

      {/* Contenedor del Bracket Scrollable */}
      <div className="bracket-wrapper">
        <div className="bracket-container">
          
          {/* 0. Dieciseisavos de Final (16vos) */}
          <div className="bracket-round">
            <div className="bracket-round-title">16vos de Final</div>
            <div className="bracket-matches-list">
              {(knockoutStage.roundOf32 || []).map(match => {
                const p1 = match.type.split('_')[0]; // ej '1A'
                const p2 = match.type.split('_')[1]; // ej '3C/D/E'
                const isWinner1 = match.winner === match.team1 && match.team1 !== null;
                const isWinner2 = match.winner === match.team2 && match.team2 !== null;
                const locked = isMatchLocked(match.id);

                return (
                  <div key={match.id} className={`bracket-match-card ${locked ? 'locked' : ''}`}>
                    <div className="bracket-match-header">
                      <span>{match.date} {locked && '🔒'}</span>

                    </div>
                    {/* Equipo 1 */}
                    <div 
                      className={`bracket-team-row ${isWinner1 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team1, p1)}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team1Score}
                        onChange={(e) => handleScoreInput('roundOf32', match.id, 'team1Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team1}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {/* Equipo 2 */}
                    <div 
                      className={`bracket-team-row ${isWinner2 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team2, p2)}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team2Score}
                        onChange={(e) => handleScoreInput('roundOf32', match.id, 'team2Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team2}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1. Octavos de Final */}
          <div className="bracket-round">
            <div className="bracket-round-title">Octavos de Final</div>
            <div className="bracket-matches-list">
              {(knockoutStage.roundOf16 || []).map(match => {
                const isWinner1 = match.winner === match.team1 && match.team1 !== null;
                const isWinner2 = match.winner === match.team2 && match.team2 !== null;
                const locked = isMatchLocked(match.id);

                return (
                  <div key={match.id} className={`bracket-match-card ${locked ? 'locked' : ''}`}>
                    <div className="bracket-match-header">
                      <span>{match.date} {locked && '🔒'}</span>

                    </div>
                    {/* Equipo 1 */}
                    <div 
                      className={`bracket-team-row ${isWinner1 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team1, 'Ganador 16vos')}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team1Score}
                        onChange={(e) => handleScoreInput('roundOf16', match.id, 'team1Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team1}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {/* Equipo 2 */}
                    <div 
                      className={`bracket-team-row ${isWinner2 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team2, 'Ganador 16vos')}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team2Score}
                        onChange={(e) => handleScoreInput('roundOf16', match.id, 'team2Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team2}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Cuartos de Final */}
          <div className="bracket-round">
            <div className="bracket-round-title">Cuartos de Final</div>
            <div className="bracket-matches-list">
              {knockoutStage.quarterfinals.map(match => {
                const isWinner1 = match.winner === match.team1 && match.team1 !== null;
                const isWinner2 = match.winner === match.team2 && match.team2 !== null;
                const locked = isMatchLocked(match.id);

                return (
                  <div key={match.id} className={`bracket-match-card ${locked ? 'locked' : ''}`}>
                    <div className="bracket-match-header">
                      <span>{match.date} {locked && '🔒'}</span>
                      {match.team1Score === match.team2Score && match.team1Score !== '' && !locked && (
                        <span style={{ color: 'var(--color-accent)' }}>Hacer clic en ganador</span>
                      )}
                    </div>
                    <div 
                      className={`bracket-team-row ${isWinner1 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team1, 'Ganador Octavos')}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team1Score}
                        onChange={(e) => handleScoreInput('quarterfinals', match.id, 'team1Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team1}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div 
                      className={`bracket-team-row ${isWinner2 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team2, 'Ganador Octavos')}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team2Score}
                        onChange={(e) => handleScoreInput('quarterfinals', match.id, 'team2Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team2}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Semifinales */}
          <div className="bracket-round">
            <div className="bracket-round-title">Semifinales</div>
            <div className="bracket-matches-list">
              {knockoutStage.semifinals.map(match => {
                const isWinner1 = match.winner === match.team1 && match.team1 !== null;
                const isWinner2 = match.winner === match.team2 && match.team2 !== null;
                const locked = isMatchLocked(match.id);

                return (
                  <div key={match.id} className={`bracket-match-card ${locked ? 'locked' : ''}`}>
                    <div className="bracket-match-header">
                      <span>{match.date} {locked && '🔒'}</span>
                      {match.team1Score === match.team2Score && match.team1Score !== '' && !locked && (
                        <span style={{ color: 'var(--color-accent)' }}>Hacer clic en ganador</span>
                      )}
                    </div>
                    <div 
                      className={`bracket-team-row ${isWinner1 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team1, 'Ganador Cuartos')}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team1Score}
                        onChange={(e) => handleScoreInput('semifinals', match.id, 'team1Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team1}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div 
                      className={`bracket-team-row ${isWinner2 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team2, 'Ganador Cuartos')}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team2Score}
                        onChange={(e) => handleScoreInput('semifinals', match.id, 'team2Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team2}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Final & Tercer Puesto */}
          <div className="bracket-round">
            {/* Tercer Puesto (Arriba) */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '48%', justifyContent: 'center' }}>
              <div className="bracket-round-title" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Tercer Puesto</div>
              {knockoutStage.thirdPlace.map(match => {
                const isWinner1 = match.winner === match.team1 && match.team1 !== null;
                const isWinner2 = match.winner === match.team2 && match.team2 !== null;
                const locked = isMatchLocked(match.id);

                return (
                  <div key={match.id} className={`bracket-match-card ${locked ? 'locked' : ''}`} style={{ boxShadow: 'none' }}>
                    <div className="bracket-match-header">
                      <span>{match.date} {locked && '🔒'}</span>
                    </div>
                    <div 
                      className={`bracket-team-row ${isWinner1 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team1, 'Perdedor Semis')}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team1Score}
                        onChange={(e) => handleScoreInput('thirdPlace', match.id, 'team1Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team1}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div 
                      className={`bracket-team-row ${isWinner2 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team2, 'Perdedor Semis')}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team2Score}
                        onChange={(e) => handleScoreInput('thirdPlace', match.id, 'team2Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team2}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gran Final (Abajo) */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '48%', justifyContent: 'center' }}>
              <div className="bracket-round-title" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Gran Final</div>
              {knockoutStage.final.map(match => {
                const isWinner1 = match.winner === match.team1 && match.team1 !== null;
                const isWinner2 = match.winner === match.team2 && match.team2 !== null;
                const locked = isMatchLocked(match.id);

                return (
                  <div key={match.id} className={`bracket-match-card ${locked ? 'locked' : ''}`} style={{ borderColor: 'var(--color-primary)' }}>
                    <div className="bracket-match-header">
                      <span>{match.date} {locked && '🔒'}</span>
                    </div>
                    <div 
                      className={`bracket-team-row ${isWinner1 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team1, 'Finalista')}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team1Score}
                        onChange={(e) => handleScoreInput('final', match.id, 'team1Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team1}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div 
                      className={`bracket-team-row ${isWinner2 ? 'predicted-winner' : ''} ${locked ? 'locked' : ''}`}
                    >
                      {getTeamName(match.team2, 'Finalista')}
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`bracket-score-input ${locked ? 'disabled' : ''}`}
                        value={match.team2Score}
                        onChange={(e) => handleScoreInput('final', match.id, 'team2Score', e.target.value)}
                        maxLength={2}
                        disabled={locked || !match.team2}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Tarjeta Campeón */}
          <div className="bracket-round" style={{ justifyContent: 'center' }}>
            <div className="bracket-round-title">Campeón</div>
            <div 
              className={`glass-card bracket-match-card ${championTeam ? 'active-champion' : ''}`}
              style={{ padding: '2rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}
            >
              {championTeam ? (
                <>
                  <div className="logo-icon" style={{ fontSize: '3rem' }}>🏆</div>
                  <img 
                    src={`https://flagcdn.com/w160/${championTeam.flag}.png`} 
                    alt={championTeam.name} 
                    style={{ width: '80px', height: '54px', borderRadius: '4px', objectFit: 'cover', display: 'block', margin: '0.5rem auto 0 auto', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} 
                  />
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent)' }}>{championTeam.name}</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>¡Felicidades! Has coronado a tu campeón.</p>
                </>
              ) : (
                <>
                  <div className="logo-icon" style={{ fontSize: '2.5rem', filter: 'grayscale(1)' }}>🏆</div>
                  <span style={{ fontSize: '2rem', display: 'block', color: 'var(--text-muted)' }}>❓</span>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Por determinar</h4>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pronostica la final para coronar al campeón.</p>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal de Revelación de Campeón con Celebración */}
      {showChampModal && championTeam && (
        <div className="champ-reveal-modal" onClick={() => setShowChampModal(false)}>
          <div className="champ-reveal-card" onClick={(e) => e.stopPropagation()}>
            <img 
              src={`https://flagcdn.com/w160/${championTeam.flag}.png`} 
              alt={championTeam.name} 
              style={{ width: '120px', height: '80px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', marginBottom: '1rem' }} 
            />
            <h2 className="gradient-text-purple" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              🏆 ¡TU CAMPEÓN! 🏆
            </h2>
            <h3 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-accent)', margin: '1rem 0' }}>
              {championTeam.name}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Has finalizado tu pronóstico para el Mundial. Tu campeón definitivo es <strong>{championTeam.name}</strong>. ¡Compártelo con tus amigos y mira si logras la puntuación perfecta!
            </p>
            <button className="primary-btn" onClick={() => setShowChampModal(false)}>
              Ver mi Quiniela
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
