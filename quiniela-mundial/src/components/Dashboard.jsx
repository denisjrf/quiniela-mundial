import React, { useState } from 'react';

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
  const [tempName, setTempName] = useState(currentUser.name);
  const [showChampModal, setShowChampModal] = useState(false);

  // Sincronizar tempName si cambia el usuario activo
  React.useEffect(() => {
    setTempName(currentUser.name);
  }, [currentUser]);

  const startEditing = () => {
    setTempName(currentUser.name);
    setIsEditing(true);
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
  const totalGroupMatches = groupMatches.length; // 48
  const predictedGroups = groupMatches.filter(
    m => m.team1Score !== '' && m.team2Score !== ''
  ).length;

  // Contar predicciones de eliminatorias
  let predictedKnockouts = 0;
  const rounds = ['roundOf16', 'quarterfinals', 'semifinals', 'thirdPlace', 'final'];
  rounds.forEach(round => {
    knockoutStage[round]?.forEach(m => {
      if (m.team1Score !== '' && m.team2Score !== '') predictedKnockouts++;
    });
  });
  
  const totalKnockoutMatches = 16; // 8 R16, 4 QF, 2 SF, 1 TP, 1 F
  const totalPredicted = predictedGroups + predictedKnockouts;
  const grandTotalMatches = totalGroupMatches + totalKnockoutMatches; // 64
  const progressPercent = Math.round((totalPredicted / grandTotalMatches) * 100);

  // Obtener Campeón Predicho
  const finalMatch = knockoutStage.final?.[0];
  let championTeam = null;
  if (finalMatch && finalMatch.winner) {
    championTeam = teams[finalMatch.winner];
  }

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
              <><span className="gradient-text" style={{ cursor: 'pointer', borderBottom: '1px dashed var(--color-primary)', position: 'relative' }} onClick={startEditing} title="Haz clic para cambiar tu nombre">{currentUser.name.trim()}!</span><span style={{ fontSize: '0.85rem', verticalAlign: 'middle', opacity: 0.7, marginLeft: '0.35rem', cursor: 'pointer' }} onClick={startEditing}>✏️</span></>
            )}{' '}Bienvenido a la Quiniela de Grupo Giraud
          </h2>
          <p>
            Pronostica todos los encuentros de la Copa del Mundo. Rellena los marcadores de la Fase de Grupos 
            y observa cómo la tabla de posiciones calcula automáticamente los clasificados a los Octavos de final. 
            ¡Completa el Bracket y corona a tu campeón!
          </p>
        </div>
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
        </ul>
      </div>
    </div>
  );
}
