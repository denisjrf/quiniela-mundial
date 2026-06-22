import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { initialTeams, initialGroupMatches, initialKnockoutStage, getMatchKickoff } from '../data/worldCupData';

export default function Dashboard({
  currentUser,
  groupMatches,
  knockoutStage,
  points,
  rank,
  teams,
  onRenameProfile,
  realGroupMatches = [],
  realKnockoutStage = {},
  predictionStats = {}
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

  // --- JUEGOS DEL DÍA (CARTELERA Y MARCADORES REALES) ---
  const displayInfo = React.useMemo(() => {
    const all = [];
    const roundNames = {
      roundOf32: '16vos de Final',
      roundOf16: 'Octavos de Final',
      quarterfinals: 'Cuartos de Final',
      semifinals: 'Semifinal',
      thirdPlace: 'Tercer Puesto',
      final: 'Gran Final'
    };

    const groupSrc = (realGroupMatches && realGroupMatches.length > 0) ? realGroupMatches : initialGroupMatches;
    groupSrc.forEach(m => {
      all.push({
        id: m.id,
        team1: m.team1,
        team2: m.team2,
        team1Score: m.team1Score,
        team2Score: m.team2Score,
        kickoff: getMatchKickoff(m.id),
        label: `Grupo ${m.group}`
      });
    });

    const koSrc = (realKnockoutStage && Object.keys(realKnockoutStage).length > 0) ? realKnockoutStage : initialKnockoutStage;
    Object.keys(koSrc).forEach(roundKey => {
      koSrc[roundKey].forEach(m => {
        all.push({
          id: m.id,
          team1: m.team1,
          team2: m.team2,
          team1Score: m.team1Score,
          team2Score: m.team2Score,
          kickoff: getMatchKickoff(m.id),
          label: roundNames[roundKey] || roundKey
        });
      });
    });

    const isSameDay = (d1, d2) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    };

    const now = new Date();
    
    // 1. Intentar encontrar partidos para hoy
    const todayMatches = all.filter(m => {
      const kDate = new Date(m.kickoff);
      return isSameDay(kDate, now);
    });

    if (todayMatches.length > 0) {
      return { matches: todayMatches, isToday: true, dateLabel: 'Partidos de Hoy' };
    }

    // 2. Si no hay partidos hoy, buscar partidos del primer día futuro que sí tenga partidos
    const upcomingMatches = all
      .filter(m => new Date(m.kickoff) > now)
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    if (upcomingMatches.length === 0) {
      // Si no hay partidos futuros, buscar los partidos del último día jugado
      const pastMatchesSorted = all
        .filter(m => new Date(m.kickoff) <= now)
        .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));
        
      if (pastMatchesSorted.length > 0) {
        const lastMatchDate = new Date(pastMatchesSorted[0].kickoff);
        const lastDayMatches = all.filter(m => isSameDay(new Date(m.kickoff), lastMatchDate));
        
        const dateFormatted = lastMatchDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        return { 
          matches: lastDayMatches, 
          isToday: false, 
          isPast: true,
          dateLabel: `Últimos Resultados (${dateFormatted})` 
        };
      }

      return { matches: [], isToday: false, dateLabel: 'Partidos del Día' };
    }

    return { 
      matches: nextDayMatches, 
      isToday: false, 
      dateLabel: `Próximos Partidos (${dateFormatted})` 
    };
  }, [realGroupMatches, realKnockoutStage]);

  // --- ÚLTIMOS 5 RESULTADOS CON COMPARATIVA DE PRONÓSTICOS ---
  const recentResults = React.useMemo(() => {
    const completed = [];
    const roundNames = {
      roundOf32: '16vos de Final',
      roundOf16: 'Octavos de Final',
      quarterfinals: 'Cuartos de Final',
      semifinals: 'Semifinal',
      thirdPlace: 'Tercer Puesto',
      final: 'Gran Final'
    };

    // 1. Fase de Grupos
    const groupSrc = (realGroupMatches && realGroupMatches.length > 0) ? realGroupMatches : [];
    groupSrc.forEach(m => {
      const hasRealScore = m.team1Score !== '' && m.team2Score !== '' && m.team1Score !== null && m.team2Score !== null;
      if (hasRealScore) {
        const pred = groupMatches.find(p => p.id === m.id);
        completed.push({
          id: m.id,
          team1: m.team1,
          team2: m.team2,
          realScore1: m.team1Score,
          realScore2: m.team2Score,
          predScore1: pred ? pred.team1Score : '',
          predScore2: pred ? pred.team2Score : '',
          kickoff: getMatchKickoff(m.id),
          label: `Grupo ${m.group}`,
          isKnockout: false,
          realWinner: null,
          predWinner: null,
          wentToPenalties: false
        });
      }
    });

    // 2. Eliminatorias
    const koSrc = (realKnockoutStage && Object.keys(realKnockoutStage).length > 0) ? realKnockoutStage : {};
    Object.keys(koSrc).forEach(roundKey => {
      koSrc[roundKey].forEach(m => {
        const hasRealScore = m.team1Score !== '' && m.team2Score !== '' && m.team1Score !== null && m.team2Score !== null;
        if (hasRealScore) {
          const pred = knockoutStage[roundKey]?.find(p => p.id === m.id);
          completed.push({
            id: m.id,
            team1: m.team1,
            team2: m.team2,
            realScore1: m.team1Score,
            realScore2: m.team2Score,
            predScore1: pred ? pred.team1Score : '',
            predScore2: pred ? pred.team2Score : '',
            kickoff: getMatchKickoff(m.id),
            label: roundNames[roundKey] || roundKey,
            isKnockout: true,
            realWinner: m.winner,
            predWinner: pred ? pred.winner : null,
            wentToPenalties: m.went_to_penalties || false
          });
        }
      });
    });

    // Ordenar por fecha de inicio descendente (los más recientes primero)
    completed.sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));

    return completed.slice(0, 5);
  }, [realGroupMatches, realKnockoutStage, groupMatches, knockoutStage]);

  const calculateMatchPoints = React.useCallback((item) => {
    const { realScore1, realScore2, predScore1, predScore2, isKnockout, realWinner, predWinner, wentToPenalties } = item;

    if (realScore1 === '' || realScore2 === '' || realScore1 === null || realScore2 === null) {
      return null;
    }
    if (predScore1 === '' || predScore2 === '' || predScore1 === null || predScore2 === null) {
      return { points: 0, label: 'Sin pronóstico' };
    }

    const p1 = parseInt(predScore1, 10);
    const p2 = parseInt(predScore2, 10);
    const r1 = parseInt(realScore1, 10);
    const r2 = parseInt(realScore2, 10);

    if (isNaN(p1) || isNaN(p2) || isNaN(r1) || isNaN(r2)) {
      return { points: 0, label: 'Sin pronóstico' };
    }

    if (!isKnockout) {
      if (p1 === r1 && p2 === r2) {
        return { points: 3, label: 'Exacto' };
      } else {
        const predSign = Math.sign(p1 - p2);
        const realSign = Math.sign(r1 - r2);
        if (predSign === realSign) {
          return { points: 1, label: 'Acierto' };
        } else {
          return { points: 0, label: 'Incorrecto' };
        }
      }
    } else {
      if (!realWinner || !predWinner) {
        return { points: 0, label: 'Incorrecto' };
      }
      if (wentToPenalties) {
        if (predWinner === realWinner) {
          return { points: 1, label: 'Acierto (Penales)' };
        }
      } else if (predWinner === realWinner) {
        return { points: 3, label: 'Acierto' };
      }
      return { points: 0, label: 'Incorrecto' };
    }
  }, []);

  const formatTime = (kickoff) => {
    const date = new Date(kickoff);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  };

  const getMatchStatus = (kickoff, hasScore) => {
    if (hasScore) {
      return { text: '🟢 Finalizado', color: 'var(--color-primary)' };
    }
    const now = new Date();
    const kickoffTime = new Date(kickoff);
    const diffMs = now - kickoffTime;

    if (diffMs >= 0) {
      // Si ya empezó pero el administrador no ha subido el resultado oficial
      if (diffMs < 2.5 * 60 * 60 * 1000) {
        return { text: '⚡ En curso', color: 'var(--color-danger)' };
      } else {
        return { text: '⏳ Por reportar', color: 'var(--color-accent)' };
      }
    }

    return { text: `⏰ ${formatTime(kickoff)}`, color: 'var(--color-info)' };
  };

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

  // --- CONFETTI ANIMATION AL SUBIR PUNTOS ---
  useEffect(() => {
    if (!currentUser || typeof points === 'undefined') return;
    
    const storageKey = `quiniela_points_${currentUser.id}`;
    const previousPoints = parseInt(localStorage.getItem(storageKey) || '0', 10);

    if (points > previousPoints) {
      // Lanzar Confetti si los puntos subieron (acertó un marcador exacto o parcial)
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#00ff87', '#7000ff', '#ffd700']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#00ff87', '#7000ff', '#ffd700']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Actualizar el nuevo récord
      localStorage.setItem(storageKey, points.toString());
    } else if (points < previousPoints) {
      // Por si el admin corrige un resultado a la baja
      localStorage.setItem(storageKey, points.toString());
    }
  }, [points, currentUser]);

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

      {/* Cartelera de Partidos del Día */}
      {displayInfo.matches.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--color-info), var(--color-primary))' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }} className="gradient-text">
              ⚽ {displayInfo.dateLabel}
            </h3>
            {displayInfo.isToday && (
              <span className="profile-badge" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', animation: 'pulse 2s infinite alternate', background: 'rgba(0, 255, 135, 0.15)', border: '1px solid rgba(0, 255, 135, 0.3)', color: 'var(--color-primary)' }}>
                🔴 EN VIVO / HOY
              </span>
            )}
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {displayInfo.matches.map(m => {
              const team1Obj = teams[m.team1] || { id: m.team1, name: m.team1 || 'Por definir', flag: 'un' };
              const team2Obj = teams[m.team2] || { id: m.team2, name: m.team2 || 'Por definir', flag: 'un' };
              const hasScore = m.team1Score !== '' && m.team2Score !== '' && m.team1Score !== null && m.team2Score !== null;
              const status = getMatchStatus(m.kickoff, hasScore);
              
              return (
                <div key={m.id} style={{
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'var(--transition-smooth)'
                }} className="match-card-item">
                  {/* Meta: Hora y Fase */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 600 }}>{m.label}</span>
                    <span style={{ fontWeight: 700, color: status.color }}>
                      {status.text}
                    </span>
                  </div>
                  
                  {/* Contenido del partido */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    {/* Equipo 1 */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={team1Obj.name}>
                        {team1Obj.name}
                      </span>
                      {m.team1 ? (
                        <img
                          src={`https://flagcdn.com/w40/${team1Obj.flag}.png`}
                          alt={team1Obj.name}
                          style={{ width: '28px', height: '18px', borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.2rem' }}>🏳️</span>
                      )}
                    </div>
                    
                    {/* Marcador Real o VS */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '70px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      {hasScore ? (
                        <div style={{ display: 'flex', gap: '0.4rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--color-primary)' }}>{m.team1Score}</span>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>-</span>
                          <span style={{ color: 'var(--color-primary)' }}>{m.team2Score}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>VS</span>
                      )}
                    </div>
                    
                    {/* Equipo 2 */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start', minWidth: 0 }}>
                      {m.team2 ? (
                        <img
                          src={`https://flagcdn.com/w40/${team2Obj.flag}.png`}
                          alt={team2Obj.name}
                          style={{ width: '28px', height: '18px', borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.2rem' }}>🏳️</span>
                      )}
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={team2Obj.name}>
                        {team2Obj.name}
                      </span>
                    </div>
                  </div>

                  {/* Marcadores populares */}
                  {predictionStats && predictionStats[m.id] && predictionStats[m.id].length > 0 && (
                    <div style={{
                      marginTop: '0.25rem',
                      paddingTop: '0.6rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}>
                      <div style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span>🔥 Pronósticos Populares:</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '0.4rem',
                        flexWrap: 'wrap'
                      }}>
                        {predictionStats[m.id].map((stat, idx) => (
                          <div
                            key={idx}
                            style={{
                              flex: 1,
                              minWidth: '60px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.04)',
                              borderRadius: '6px',
                              padding: '0.2rem 0.4rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              transition: 'var(--transition-smooth)',
                            }}
                            className="popular-score-badge"
                            title={`${stat.count} votos`}
                          >
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{stat.score.replace('-', ' - ')}</span>
                            <span style={{
                              fontWeight: 700,
                              fontSize: '0.6rem',
                              color: idx === 0 ? 'var(--color-primary)' : idx === 1 ? 'var(--color-info)' : 'var(--text-secondary)',
                              marginTop: '0.05rem'
                            }}>{stat.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resultados Recientes (Últimos 5 partidos con comparativa de quiniela) */}
      {recentResults.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--color-secondary), var(--color-accent))' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }} className="gradient-text-purple">
              📊 Últimos Resultados y Tus Puntos
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Comparativa de tus pronósticos
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {recentResults.map(m => {
              const team1Obj = teams[m.team1] || { id: m.team1, name: m.team1 || 'Por definir', flag: 'un' };
              const team2Obj = teams[m.team2] || { id: m.team2, name: m.team2 || 'Por definir', flag: 'un' };
              
              const userStats = calculateMatchPoints(m);
              
              // Estilo del badge según los puntos obtenidos
              let badgeBg = 'rgba(100, 116, 139, 0.1)';
              let badgeBorder = '1px solid rgba(100, 116, 139, 0.2)';
              let badgeColor = 'var(--text-secondary)';
              let badgeText = '0 Pts (Incorrecto)';

              if (userStats) {
                if (userStats.points === 3) {
                  badgeBg = 'rgba(0, 255, 135, 0.12)';
                  badgeBorder = '1px solid rgba(0, 255, 135, 0.3)';
                  badgeColor = 'var(--color-primary)';
                  badgeText = `+3 Pts (${userStats.label})`;
                } else if (userStats.points === 1) {
                  badgeBg = 'rgba(0, 210, 255, 0.12)';
                  badgeBorder = '1px solid rgba(0, 210, 255, 0.3)';
                  badgeColor = 'var(--color-info)';
                  badgeText = `+1 Pt (${userStats.label})`;
                } else {
                  badgeBg = 'rgba(255, 0, 85, 0.12)';
                  badgeBorder = '1px solid rgba(255, 0, 85, 0.3)';
                  badgeColor = 'var(--color-danger)';
                  badgeText = `0 Pts (${userStats.label})`;
                }
              }

              const hasUserPrediction = m.predScore1 !== '' && m.predScore2 !== '' && m.predScore1 !== null && m.predScore2 !== null;

              return (
                <div key={m.id} style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative',
                  transition: 'var(--transition-smooth)'
                }} className="match-card-item">
                  
                  {/* Fila superior: Jornada / Fase y Puntos */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{m.label}</span>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: badgeBg,
                      border: badgeBorder,
                      color: badgeColor
                    }}>
                      {badgeText}
                    </span>
                  </div>

                  {/* Marcadores reales */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    {/* Equipo 1 */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={team1Obj.name}>
                        {team1Obj.name}
                      </span>
                      <img
                        src={`https://flagcdn.com/w40/${team1Obj.flag}.png`}
                        alt={team1Obj.name}
                        style={{ width: '28px', height: '18px', borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    </div>

                    {/* Marcador Real */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '70px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', gap: '0.4rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--color-primary)' }}>{m.realScore1}</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>-</span>
                        <span style={{ color: 'var(--color-primary)' }}>{m.realScore2}</span>
                      </div>
                    </div>

                    {/* Equipo 2 */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start', minWidth: 0 }}>
                      <img
                        src={`https://flagcdn.com/w40/${team2Obj.flag}.png`}
                        alt={team2Obj.name}
                        style={{ width: '28px', height: '18px', borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={team2Obj.name}>
                        {team2Obj.name}
                      </span>
                    </div>
                  </div>

                  {/* Comparativa con tu pronóstico */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.15)',
                    padding: '0.3rem 0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.02)'
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tu Quiniela:</span>
                    {hasUserPrediction ? (
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {m.predScore1} - {m.predScore2}
                        {m.isKnockout && m.predWinner && (
                          <span style={{ color: 'var(--color-info)', marginLeft: '0.3rem', fontSize: '0.7rem' }}>
                            ({teams[m.predWinner]?.name || m.predWinner})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Sin pronóstico</span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

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
