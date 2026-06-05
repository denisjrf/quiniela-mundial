import React, { useState, useEffect } from 'react';
import { initialTeams, initialGroupMatches, initialKnockoutStage, getMatchKickoff } from '../data/worldCupData';

export default function Dashboard({
  currentUser,
  groupMatches,
  knockoutStage,
  points,
  rank,
  teams,
  onRenameProfile
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(currentUser?.name || '');
  const [showChampModal, setShowChampModal] = useState(false);

  // Sincronizar tempName si cambia el usuario activo
  React.useEffect(() => {
    if (currentUser?.name) {
      setTempName(currentUser.name);
    }
  }, [currentUser]);

  const startEditing = () => {
    if (currentUser?.name) {
      setTempName(currentUser.name);
      setIsEditing(true);
    }
  };

  const saveRename = () => {
    if (tempName.trim() && onRenameProfile) {
      onRenameProfile(currentUser.id, tempName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') saveRename();
    if (e.key === 'Escape') setIsEditing(false);
  };

  // Calcular progreso de predicciones
  const totalGroupMatches = groupMatches.length; // 72
  const predictedGroups = groupMatches.filter(
    m => m.team1Score !== '' && m.team2Score !== ''
  ).length;

  // Contar predicciones de eliminatorias
  let predictedKnockouts = 0;
  const rounds = ['roundOf32', 'roundOf16', 'quarterfinals', 'semifinals', 'thirdPlace', 'final'];
  rounds.forEach(round => {
    knockoutStage[round]?.forEach(m => {
      if (m.team1Score !== '' && m.team2Score !== '') predictedKnockouts++;
    });
  });

  const totalKnockoutMatches = 32; // 16 R32, 8 R16, 4 QF, 2 SF, 1 TP, 1 F
  const totalPredicted = predictedGroups + predictedKnockouts;
  const grandTotalMatches = totalGroupMatches + totalKnockoutMatches; // 104
  const progressPercent = Math.round((totalPredicted / grandTotalMatches) * 100);

  // Obtener Campeón Predicho
  const finalMatch = knockoutStage.final?.[0];
  let championTeam = null;
  if (finalMatch && finalMatch.winner) {
    championTeam = teams[finalMatch.winner];
  }

  // --- CUENTA REGRESIVA AL PRÓXIMO PARTIDO ---
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nextMatch, setNextMatch] = useState(null);

  useEffect(() => {
    // Recopilar todos los partidos con sus kickoffs
    const allMatches = [];

    initialGroupMatches.forEach(m => {
      const kickoff = getMatchKickoff(m.id);
      allMatches.push({
        id: m.id,
        team1: m.team1,
        team2: m.team2,
        kickoff,
        label: `Grupo ${m.group} — Jornada ${m.date}`
      });
    });

    const roundNames = {
      roundOf32: '16vos de Final',
      roundOf16: 'Octavos de Final',
      quarterfinals: 'Cuartos de Final',
      semifinals: 'Semifinal',
      thirdPlace: 'Tercer Puesto',
      final: 'Gran Final'
    };

    Object.keys(initialKnockoutStage).forEach(roundKey => {
      initialKnockoutStage[roundKey].forEach(m => {
        const kickoff = getMatchKickoff(m.id);
        allMatches.push({
          id: m.id,
          team1: m.team1,
          team2: m.team2,
          kickoff,
          label: roundNames[roundKey] || roundKey
        });
      });
    });

    // Ordenar por kickoff
    allMatches.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    const updateCountdown = () => {
      const now = new Date();
      const upcoming = allMatches.find(m => new Date(m.kickoff) > now);

      if (!upcoming) {
        setNextMatch(null);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setNextMatch(upcoming);
      const diff = new Date(upcoming.kickoff) - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="fade-in dashboard-main">
      {/* Banner de Bienvenida */}
      <div className="glass-card hero-banner">
        <div className="hero-content">
          <h2>
            🏆 ¡Hola,{' '}
            {isEditing ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="text"
                  className="profile-input"
                  style={{
                    fontSize: '1.2rem',
                    padding: '0.15rem 0.4rem',
                    display: 'inline-block',
                    width: '180px',
                    fontWeight: 700,
                    border: '1px solid var(--color-primary)',
                    boxShadow: '0 0 8px rgba(0, 255, 135, 0.25)',
                    borderRadius: '8px',
                    fontFamily: 'inherit'
                  }}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  maxLength={20}
                />
                <button
                  onClick={saveRename}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                  title="Guardar nombre"
                >
                  ✔️
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                  title="Cancelar"
                >
                  ❌
                </button>
              </span>
            ) : (
              <><span className="gradient-text" style={{ cursor: 'pointer', borderBottom: '1px dashed var(--color-primary)', position: 'relative' }} onClick={startEditing} title="Haz clic para cambiar tu nombre">{(currentUser?.name || '').trim()}!</span><span style={{ fontSize: '0.85rem', verticalAlign: 'middle', opacity: 0.7, marginLeft: '0.35rem', cursor: 'pointer' }} onClick={startEditing}>✏️</span></>
            )}{' '}Bienvenido a la Quiniela de Grupo Giraud
          </h2>
          <p>
            Pronostica todos los encuentros de la Copa del Mundo. Rellena los marcadores de la Fase de Grupos
            y observa cómo la tabla de posiciones calcula automáticamente los clasificados a los Octavos de final.
            ¡Completa el Bracket y corona a tu campeón!
          </p>
        </div>
      </div>

      {/* Cuenta Regresiva al Próximo Partido */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--color-primary), var(--color-info), var(--color-accent))' }} />
        {nextMatch ? (
          <>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.5rem' }}>
              ⏳ Próximo Partido — {nextMatch.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {nextMatch.team1 && teams[nextMatch.team1] ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img
                    src={`https://flagcdn.com/w40/${teams[nextMatch.team1].flag}.png`}
                    alt={teams[nextMatch.team1].name}
                    style={{ width: '32px', height: '22px', borderRadius: '3px', objectFit: 'cover' }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{teams[nextMatch.team1].name}</span>
                </div>
              ) : (
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)' }}>Por definir</span>
              )}
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-accent)' }}>VS</span>
              {nextMatch.team2 && teams[nextMatch.team2] ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img
                    src={`https://flagcdn.com/w40/${teams[nextMatch.team2].flag}.png`}
                    alt={teams[nextMatch.team2].name}
                    style={{ width: '32px', height: '22px', borderRadius: '3px', objectFit: 'cover' }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{teams[nextMatch.team2].name}</span>
                </div>
              ) : (
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)' }}>Por definir</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { value: countdown.days, label: 'Días' },
                { value: countdown.hours, label: 'Horas' },
                { value: countdown.minutes, label: 'Min' },
                { value: countdown.seconds, label: 'Seg' }
              ].map((unit, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    background: 'rgba(0, 255, 135, 0.08)',
                    border: '1px solid rgba(0, 255, 135, 0.2)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.9rem',
                    minWidth: '60px',
                    fontFamily: 'monospace',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                    letterSpacing: '2px'
                  }}>
                    {pad(unit.value)}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>🏆</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
              ¡El torneo ha finalizado!
            </span>
          </div>
        )}
      </div>

      {showChampModal && championTeam && (
        <div className="champ-reveal-modal" onClick={() => setShowChampModal(false)}>
          <div className="champ-reveal-card" onClick={(e) => e.stopPropagation()}>
            <img
              src={`https://flagcdn.com/w160/${championTeam.flag}.png`}
              alt={championTeam.name}
              style={{ width: '120px', height: '80px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', marginBottom: '1rem' }}
            />
          </div>
        </div>
      )}

      {/* Tarjetas de Estadísticas */}
      <div className="stats-row">
        <div className="glass-card stat-card">
          <div className="stat-label">Progreso Quiniela</div>
          <div className="stat-val">{totalPredicted} / {grandTotalMatches}</div>
          <div style={{ marginTop: '0.5rem', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-info))', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{progressPercent}% completado</div>
        </div>

        <div className="glass-card stat-card" onClick={() => championTeam && setShowChampModal(true)} style={{ cursor: championTeam ? 'pointer' : 'default' }}>
          <div className="stat-label">Tu Campeón</div>
          <div className="stat-val secondary" style={{ fontSize: championTeam ? '1.5rem' : '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: championTeam ? '0.75rem' : '0.5rem' }}>
            {championTeam ? (
              <>
                <img
                  src={`https://flagcdn.com/w40/${championTeam.flag}.png`}
                  alt={championTeam.name}
                  className="team-flag-img"
                />
                <span style={{ fontWeight: 800 }}>{championTeam.name}</span>
              </>
            ) : (
              'Pendiente ⏳'
            )}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            {championTeam ? '¡Excelente elección!' : 'Completa la final en el Bracket'}
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-label">Puntos Obtenidos</div>
          <div className="stat-val accent">{points} pts</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Basado en resultados reales
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-label">Ranking General</div>
          <div className="stat-val" style={{ color: 'var(--color-info)', textShadow: '0 0 10px rgba(0, 210, 255, 0.2)' }}>
            #{rank}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Entre todos tus amigos locales
          </div>
        </div>
      </div>

      {/* Reglas de la Quiniela */}
      <div className="glass-card rules-card">
        <h3 className="gradient-text-purple" style={{ fontWeight: 800, fontSize: '1.25rem' }}>⚽ Sistema de Puntuación de la Quiniela</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
          La tabla de clasificación general compara tus predicciones con los marcadores reales ingresados en la pestaña "Simulador". Los puntos se distribuyen así:
        </p>
        <ul className="rules-list">
          <li>
            <span className="rule-number">3</span>
            <div>
              <strong>Resultado Exacto (+3 Puntos):</strong> Acertaste exactamente la cantidad de goles de ambos equipos.
              <span style={{ color: 'var(--color-primary)', display: 'block', fontSize: '0.8rem', marginTop: '0.15rem' }}>Ejemplo: Tu Predicción: 2 - 1 | Resultado Real: 2 - 1.</span>
            </div>
          </li>
          <li>
            <span className="rule-number">1</span>
            <div>
              <strong>Resultado Simple (+1 Punto):</strong> Acertaste el ganador o el empate del partido, pero no los goles exactos.
              <span style={{ color: 'var(--color-info)', display: 'block', fontSize: '0.8rem', marginTop: '0.15rem' }}>Ejemplo: Tu Predicción: 2 - 0 | Resultado Real: 1 - 0. (Acertaste que gana local).</span>
            </div>
          </li>
          <li>
            <span className="rule-number">0</span>
            <div>
              <strong>Resultado Incorrecto (0 Puntos):</strong> No acertaste el ganador ni el empate del partido.
              <span style={{ color: 'var(--color-danger)', display: 'block', fontSize: '0.8rem', marginTop: '0.15rem' }}>Ejemplo: Tu Predicción: 1 - 1 | Resultado Real: 0 - 3.</span>
            </div>
          </li>
          <li>
            <span className="rule-number" style={{ background: 'rgba(255, 215, 0, 0.15)', color: 'var(--color-accent)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>1</span>
            <div>
              <strong>Eliminatorias — Ganador en Penales (+1 Punto):</strong> El partido llegó a penales y acertaste el equipo que ganó la tanda.
              <span style={{ color: 'var(--color-accent)', display: 'block', fontSize: '0.8rem', marginTop: '0.15rem' }}>Ejemplo: El partido fue empate 1-1 y lo decidieron los penales. Si predijiste el ganador → 1 pto.</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
