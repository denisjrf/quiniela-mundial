import React, { useState } from 'react';

export default function Leaderboard({ 
  profiles, 
  activeProfileId, 
  onSwitchProfile, 
  onAddProfile, 
  onDeleteProfile,
  calculateProfileStats 
}) {
  const [newProfileName, setNewProfileName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    onAddProfile(newProfileName.trim());
    setNewProfileName('');
  };

  // Calcular las estadísticas de todos los perfiles para ordenarlos en la clasificación
  const leaderboardData = profiles.map(profile => {
    const stats = calculateProfileStats(profile.id);
    return {
      id: profile.id,
      name: profile.name,
      predictionsCount: stats.predictionsCount,
      points: stats.points,
      exactHits: stats.exactHits,
      outcomeHits: stats.outcomeHits
    };
  });

  // Ordenar el Leaderboard: Puntos DESC, aciertos exactos DESC, aciertos simples DESC, alfabético ASC
  const sortedLeaderboard = [...leaderboardData].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
    if (b.outcomeHits !== a.outcomeHits) return b.outcomeHits - a.outcomeHits;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="fade-in leaderboard-container">
      {/* 1. Gestión de Perfiles Amigos (Izquierda) */}
      <div className="profiles-management">
        <div className="glass-card">
          <h3 className="gradient-text-purple" style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem' }}>
            👥 Participantes
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.4 }}>
            Crea perfiles locales para tus amigos o familiares. Cada perfil tiene su propia quiniela y puedes cambiar entre ellos para rellenar sus pronósticos.
          </p>

          {/* Lista de Perfiles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {profiles.map(profile => {
              const isActive = profile.id === activeProfileId;
              const isDefault = profile.id === 'default-user';

              return (
                <div 
                  key={profile.id} 
                  className={`profile-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSwitchProfile(profile.id)}
                >
                  <div className="profile-meta">
                    <div className="profile-avatar" style={{ 
                      background: isActive 
                        ? 'linear-gradient(135deg, var(--color-primary), var(--color-info))' 
                        : 'linear-gradient(135deg, var(--color-secondary), rgba(112, 0, 255, 0.4))'
                    }}>
                      {profile.name.charAt(0)}
                    </div>
                    <div>
                      <div className="profile-name">{profile.name}</div>
                      {isDefault && <span className="profile-badge">Tú</span>}
                    </div>
                  </div>

                  {!isDefault && (
                    <button 
                      className="delete-profile-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProfile(profile.id);
                      }}
                      title="Eliminar participante"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Formulario para Añadir Perfil */}
          <form onSubmit={handleSubmit} className="add-profile-form">
            <input
              type="text"
              className="profile-input"
              placeholder="Nombre del amigo..."
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              maxLength={20}
            />
            <button type="submit" className="primary-btn">
              Añadir
            </button>
          </form>
        </div>
      </div>

      {/* 2. Tabla de Clasificación General (Derecha) */}
      <div className="glass-card">
        <h3 className="gradient-text" style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem' }}>
          📊 Clasificación General
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
          Los puntajes se actualizan según los marcadores ingresados en el **Simulador**. En caso de empate en puntos, se prioriza a quien tenga más resultados exactos (3 pts).
        </p>

        <div className="leaderboard-list">
          {/* Encabezado */}
          <div className="leaderboard-row header">
            <div className="rank-cell">Pos</div>
            <div className="name-cell" style={{ paddingLeft: '0.5rem' }}>Participante</div>
            <div>Pronósticos</div>
            <div>Aciertos (Ex/Sm)</div>
            <div className="points-cell">Puntos</div>
          </div>

          {/* Registros */}
          {sortedLeaderboard.map((row, index) => {
            const isRank1 = index === 0;
            const isRank2 = index === 1;
            const isRank3 = index === 2;
            const isActive = row.id === activeProfileId;

            return (
              <div 
                key={row.id} 
                className={`leaderboard-row ${isActive ? 'highlight' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSwitchProfile(row.id)}
              >
                {/* Posición */}
                <div className={`rank-cell ${isRank1 ? 'top-1' : isRank2 ? 'top-2' : isRank3 ? 'top-3' : ''}`}>
                  {isRank1 ? '🥇' : isRank2 ? '🥈' : isRank3 ? '🥉' : `${index + 1}`}
                </div>

                {/* Nombre */}
                <div className="name-cell">
                  <div className="profile-avatar" style={{ 
                    width: '24px', 
                    height: '24px', 
                    fontSize: '0.75rem',
                    background: isActive 
                      ? 'linear-gradient(135deg, var(--color-primary), var(--color-info))' 
                      : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1))'
                  }}>
                    {row.name.charAt(0)}
                  </div>
                  <div>
                    <span style={{ fontWeight: isActive ? '800' : '600' }}>{row.name}</span>
                    {isActive && <span style={{ marginLeft: '0.4rem', fontSize: '0.6rem', color: 'var(--color-primary)', fontWeight: '700' }}>(Activo)</span>}
                  </div>
                </div>

                {/* Pronósticos completos */}
                <div>
                  {row.predictionsCount} / 104
                </div>

                {/* Aciertos (Exacto / Simple) */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{row.exactHits}</span> 
                  {' / '}
                  <span style={{ color: 'var(--color-info)', fontWeight: 600 }}>{row.outcomeHits}</span>
                </div>

                {/* Puntos */}
                <div className="points-cell">
                  {row.points}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
