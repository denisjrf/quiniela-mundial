import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function AdminPanel({ 
  realGroupMatches, 
  realKnockoutStage, 
  teams, 
  onRealMatchScoreChange, 
  onRealKnockoutScoreChange,
  onAutoSimulateRealResults,
  onResetRealResults,
  token,
  currentUser,
  showToast,
  config = {},
  onReloadConfig,
  onRealKnockoutTeamChange,
  onRealKnockoutPenaltiesChange
}) {
  const [activeTab, setActiveTab] = useState('A'); // Pestañas 'A'..'L', 'knockout', 'users' o 'phases'
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingUserId, setTogglingUserId] = useState(null);

  const groupKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  const handleToggleConfig = async (key, val) => {
    try {
      const res = await fetch(`${API_BASE_URL}/config/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: { [key]: val }
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message, 'success');
        if (onReloadConfig) await onReloadConfig();
      } else {
        if (showToast) showToast(data.error || 'Error al actualizar configuración', 'error');
      }
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Error de conexión al guardar configuración', 'error');
    }
  };

  // Determinar si el usuario logueado es el Super Administrador Raíz (Denis)
  const isSuperAdmin = currentUser && (
    currentUser.email === 'denis@logistica.com' || 
    currentUser.email.toLowerCase().includes('denis')
  );

  // Cargar usuarios cuando se activa la pestaña correspondiente
  useEffect(() => {
    if (activeTab === 'users' && token) {
      fetchUsers();
    }
  }, [activeTab, token]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      } else {
        const err = await res.json();
        if (showToast) showToast(err.error || 'Error cargando usuarios', 'error');
      }
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Error de conexión con el servidor', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleAdmin = async (userId, userName) => {
    setTogglingUserId(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-admin`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message, 'success');
        // Actualizar la lista localmente
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, is_admin: data.user.is_admin } : u));
      } else {
        if (showToast) showToast(data.error || 'Error al actualizar rol', 'error');
      }
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Error de conexión con el servidor', 'error');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleExportExcel = () => {
    if (usersList.length === 0) return;
    
    // Usamos punto y coma (;) para compatibilidad nativa con Excel en español
    const headers = ['Nombre', 'Correo Electrónico', 'Tipo de Usuario', 'Rol', 'Fecha de Registro'];
    const rows = usersList.map(u => [
      u.name,
      u.email,
      u.id_tipo_usuario === 1 ? 'Cliente' : 'Empleado',
      u.is_admin ? 'Administrador' : 'Participante',
      new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');
    
    // Agregar BOM de UTF-8 para soporte correcto de caracteres especiales en Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_quiniela_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (showToast) showToast('📊 Excel de usuarios exportado con éxito', 'success');
  };

  const handleScoreInput = (matchId, teamKey, val) => {
    if (val === '' || /^\d+$/.test(val)) {
      onRealMatchScoreChange(matchId, teamKey, val);
    }
  };

  const handleKnockoutScoreInput = (round, matchId, teamKey, val) => {
    if (val === '' || /^\d+$/.test(val)) {
      onRealKnockoutScoreChange(round, matchId, teamKey, val);
    }
  };

  const getTeamName = (teamId, placeholder) => {
    if (!teamId) return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>{placeholder}</span>;
    const team = teams[teamId];
    if (!team) return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>{teamId}</span>;
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
        <img 
          src={`https://flagcdn.com/w40/${team.flag}.png`} 
          alt={team.name} 
          className="team-flag-img" 
        />
        <span>{team.name}</span>
      </span>
    );
  };

  return (
    <div className="fade-in admin-card">
      {/* Explicación */}
      <div className="glass-card hero-banner" style={{ borderLeftColor: 'var(--color-accent)' }}>
        <h3 className="gradient-text" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚙️ Panel de Administración y Control
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
          {isSuperAdmin 
            ? 'Como Super Administrador, puedes gestionar los accesos de usuarios de la quiniela y actualizar los resultados reales del Mundial.'
            : 'Como Administrador autorizado, tienes acceso a la visualización de los participantes registrados y a la exportación de correos electrónicos.'
          }
        </p>

        {/* Alerta si el rol es Admin Común */}
        {!isSuperAdmin && (
          <div style={{ 
            marginTop: '1rem', 
            background: 'rgba(255, 215, 0, 0.08)', 
            border: '1px solid rgba(255, 215, 0, 0.25)', 
            padding: '0.75rem 1rem', 
            borderRadius: '10px', 
            fontSize: '0.85rem', 
            color: 'var(--color-accent)', 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🔒 Modo Consulta: Solo el Super Administrador (Denis) puede simular o alterar los marcadores oficiales reales.
          </div>
        )}

        {/* Acciones Rápidas (Solo visibles para Super Admin) */}
        {isSuperAdmin && activeTab !== 'users' && (
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button 
              className="primary-btn" 
              style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, #d4af37 100%)', color: '#060913' }}
              onClick={onAutoSimulateRealResults}
            >
              ⚡ Simular Todos los Resultados Reales
            </button>
            <button 
              className="secondary-btn"
              style={{ background: 'rgba(255, 0, 85, 0.1)', border: '1px solid rgba(255, 0, 85, 0.25)', color: 'var(--color-danger)' }}
              onClick={onResetRealResults}
            >
              🧹 Limpiar Resultados
            </button>
          </div>
        )}
      </div>

      {/* Selector de Pestañas (Grupos + Eliminatorias + Gestión de Accesos) */}
      <div className="navigation-tabs" style={{ background: 'rgba(15,23,42,0.4)', alignSelf: 'flex-start', flexWrap: 'wrap', gap: '0.25rem' }}>
        {groupKeys.map(g => (
          <button 
            key={g} 
            className={`tab-btn ${activeTab === g ? 'active' : ''}`}
            onClick={() => setActiveTab(g)}
          >
            Grupo {g}
          </button>
        ))}
        <button 
          className={`tab-btn ${activeTab === 'knockout' ? 'active' : ''}`}
          onClick={() => setActiveTab('knockout')}
        >
          Eliminatorias 🏆
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Gestión de Accesos
        </button>
        {isSuperAdmin && (
          <button 
            className={`tab-btn ${activeTab === 'phases' ? 'active' : ''}`}
            onClick={() => setActiveTab('phases')}
          >
            🔧 Control de Fases
          </button>
        )}
      </div>

      {/* Contenido de la pestaña */}
      <div className="glass-card">
        
        {/* VISTAS DE GRUPOS (Pestañas A..L) */}
        {activeTab !== 'knockout' && activeTab !== 'users' && activeTab !== 'phases' && (
          <div>
            <h4 style={{ marginBottom: '1rem', fontWeight: 700 }}>Partidos del Grupo {activeTab}</h4>
            <div className="admin-matches-grid">
              {realGroupMatches.filter(m => m.group === activeTab).map(match => {
                const t1 = teams[match.team1];
                const t2 = teams[match.team2];

                return (
                  <div key={match.id} className="admin-match-item">
                    <div className="admin-match-header">
                      <span>Partido #{match.id}</span>
                      <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{match.date}</span>
                    </div>

                    <div className="admin-match-row">
                      <div className="admin-team-info">
                        <img 
                          src={`https://flagcdn.com/w40/${t1.flag}.png`} 
                          alt={t1.name} 
                          className="team-flag-img" 
                        />
                        <span>{t1.name}</span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="admin-score-input"
                        value={match.team1Score}
                        onChange={(e) => handleScoreInput(match.id, 'team1Score', e.target.value)}
                        maxLength={2}
                        disabled={!isSuperAdmin}
                      />
                    </div>

                    <div className="admin-match-row">
                      <div className="admin-team-info">
                        <img 
                          src={`https://flagcdn.com/w40/${t2.flag}.png`} 
                          alt={t2.name} 
                          className="team-flag-img" 
                        />
                        <span>{t2.name}</span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="admin-score-input"
                        value={match.team2Score}
                        onChange={(e) => handleScoreInput(match.id, 'team2Score', e.target.value)}
                        maxLength={2}
                        disabled={!isSuperAdmin}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA DE ELIMINATORIAS */}
        {activeTab === 'knockout' && (
          <div>
            <h4 style={{ marginBottom: '1.25rem', fontWeight: 700 }}>Partidos de Eliminación Directa</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Dieciseisavos (16vos) */}
              <div>
                <h5 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '0.75rem', fontWeight: 700 }}>Dieciseisavos de Final (16vos)</h5>
                <div className="admin-matches-grid">
                  {(realKnockoutStage.roundOf32 || []).map(match => (
                    <div key={match.id} className="admin-match-item">
                      <div className="admin-match-header">
                        <span>{match.date}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{match.type}</span>
                        <span>{match.id}</span>
                      </div>
                      <div className="admin-match-row">
                        {isSuperAdmin ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
                            {match.team1 && teams[match.team1] && (
                              <img 
                                src={`https://flagcdn.com/w40/${teams[match.team1].flag}.png`} 
                                alt={teams[match.team1].name} 
                                className="team-flag-img" 
                              />
                            )}
                            <select
                              value={match.team1 || ''}
                              onChange={(e) => onRealKnockoutTeamChange('roundOf32', match.id, 'team1', e.target.value)}
                              style={{
                                flex: 1,
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.8rem',
                                background: 'rgba(15, 23, 42, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                height: '30px'
                              }}
                            >
                              <option value="" style={{ background: '#0e1424' }}>-- Seleccionar Equipo 1 --</option>
                              {Object.values(teams).sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                                <option key={t.id} value={t.id} style={{ background: '#0e1424' }}>
                                  {t.name} ({t.group})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          getTeamName(match.team1, match.type || 'Equipo 1')
                        )}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team1Score}
                          onChange={(e) => handleKnockoutScoreInput('roundOf32', match.id, 'team1Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team1 || !isSuperAdmin}
                        />
                      </div>
                      <div className="admin-match-row" style={{ marginTop: '0.25rem' }}>
                        {isSuperAdmin ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
                            {match.team2 && teams[match.team2] && (
                              <img 
                                src={`https://flagcdn.com/w40/${teams[match.team2].flag}.png`} 
                                alt={teams[match.team2].name} 
                                className="team-flag-img" 
                              />
                            )}
                            <select
                              value={match.team2 || ''}
                              onChange={(e) => onRealKnockoutTeamChange('roundOf32', match.id, 'team2', e.target.value)}
                              style={{
                                flex: 1,
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.8rem',
                                background: 'rgba(15, 23, 42, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                height: '30px'
                              }}
                            >
                              <option value="" style={{ background: '#0e1424' }}>-- Seleccionar Equipo 2 --</option>
                              {Object.values(teams).sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                                <option key={t.id} value={t.id} style={{ background: '#0e1424' }}>
                                  {t.name} ({t.group})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          getTeamName(match.team2, match.type || 'Equipo 2')
                        )}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team2Score}
                          onChange={(e) => handleKnockoutScoreInput('roundOf32', match.id, 'team2Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team2 || !isSuperAdmin}
                        />
                      </div>
                      {isSuperAdmin && match.team1 && match.team2 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: match.went_to_penalties ? 'var(--color-accent)' : 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                          <input type="checkbox" checked={!!match.went_to_penalties} onChange={(e) => onRealKnockoutPenaltiesChange('roundOf32', match.id, e.target.checked)} style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
                          🥅 Fue a Penales (+1 pto si acertaron ganador)
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Octavos */}
              <div>
                <h5 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '0.75rem', fontWeight: 700 }}>Octavos de Final</h5>
                <div className="admin-matches-grid">
                  {realKnockoutStage.roundOf16.map(match => (
                    <div key={match.id} className="admin-match-item">
                      <div className="admin-match-header">
                        <span>{match.date}</span>
                        <span>{match.id}</span>
                      </div>
                      <div className="admin-match-row">
                        {getTeamName(match.team1, '1º Grupo A')}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team1Score}
                          onChange={(e) => handleKnockoutScoreInput('roundOf16', match.id, 'team1Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team1 || !isSuperAdmin}
                        />
                      </div>
                      <div className="admin-match-row" style={{ marginTop: '0.25rem' }}>
                        {getTeamName(match.team2, '2º Grupo B')}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team2Score}
                          onChange={(e) => handleKnockoutScoreInput('roundOf16', match.id, 'team2Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team2 || !isSuperAdmin}
                        />
                      </div>
                      {isSuperAdmin && match.team1 && match.team2 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: match.went_to_penalties ? 'var(--color-accent)' : 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                          <input type="checkbox" checked={!!match.went_to_penalties} onChange={(e) => onRealKnockoutPenaltiesChange('roundOf16', match.id, e.target.checked)} style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
                          🥅 Fue a Penales (+1 pto si acertaron ganador)
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cuartos */}
              <div>
                <h5 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '0.75rem', fontWeight: 700 }}>Cuartos de Final</h5>
                <div className="admin-matches-grid">
                  {realKnockoutStage.quarterfinals.map(match => (
                    <div key={match.id} className="admin-match-item">
                      <div className="admin-match-header">
                        <span>{match.date}</span>
                        <span>{match.id}</span>
                      </div>
                      <div className="admin-match-row">
                        {getTeamName(match.team1, 'Clasificado QF')}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team1Score}
                          onChange={(e) => handleKnockoutScoreInput('quarterfinals', match.id, 'team1Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team1 || !isSuperAdmin}
                        />
                      </div>
                      <div className="admin-match-row" style={{ marginTop: '0.25rem' }}>
                        {getTeamName(match.team2, 'Clasificado QF')}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team2Score}
                          onChange={(e) => handleKnockoutScoreInput('quarterfinals', match.id, 'team2Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team2 || !isSuperAdmin}
                        />
                      </div>
                      {isSuperAdmin && match.team1 && match.team2 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: match.went_to_penalties ? 'var(--color-accent)' : 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                          <input type="checkbox" checked={!!match.went_to_penalties} onChange={(e) => onRealKnockoutPenaltiesChange('quarterfinals', match.id, e.target.checked)} style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
                          🥅 Fue a Penales (+1 pto si acertaron ganador)
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Semifinales */}
              <div>
                <h5 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '0.75rem', fontWeight: 700 }}>Semifinales</h5>
                <div className="admin-matches-grid">
                  {realKnockoutStage.semifinals.map(match => (
                    <div key={match.id} className="admin-match-item">
                      <div className="admin-match-header">
                        <span>{match.date}</span>
                        <span>{match.id}</span>
                      </div>
                      <div className="admin-match-row">
                        {getTeamName(match.team1, 'Semifinalista')}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team1Score}
                          onChange={(e) => handleKnockoutScoreInput('semifinals', match.id, 'team1Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team1 || !isSuperAdmin}
                        />
                      </div>
                      <div className="admin-match-row" style={{ marginTop: '0.25rem' }}>
                        {getTeamName(match.team2, 'Semifinalista')}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team2Score}
                          onChange={(e) => handleKnockoutScoreInput('semifinals', match.id, 'team2Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team2 || !isSuperAdmin}
                        />
                      </div>
                      {isSuperAdmin && match.team1 && match.team2 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: match.went_to_penalties ? 'var(--color-accent)' : 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                          <input type="checkbox" checked={!!match.went_to_penalties} onChange={(e) => onRealKnockoutPenaltiesChange('semifinals', match.id, e.target.checked)} style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
                          🥅 Fue a Penales (+1 pto si acertaron ganador)
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Finales */}
              <div>
                <h5 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '0.75rem', fontWeight: 700 }}>Tercer Puesto & Final</h5>
                <div className="admin-matches-grid">
                  {realKnockoutStage.thirdPlace.map(match => (
                    <div key={match.id} className="admin-match-item" style={{ borderLeft: '3px solid var(--text-muted)' }}>
                      <div className="admin-match-header">
                        <span>{match.date}</span>
                        <span>{match.id}</span>
                      </div>
                      <div className="admin-match-row">
                        {getTeamName(match.team1, 'Clasificado 3º Puesto')}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team1Score}
                          onChange={(e) => handleKnockoutScoreInput('thirdPlace', match.id, 'team1Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team1 || !isSuperAdmin}
                        />
                      </div>
                      <div className="admin-match-row" style={{ marginTop: '0.25rem' }}>
                        {getTeamName(match.team2, 'Clasificado 3º Puesto')}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team2Score}
                          onChange={(e) => handleKnockoutScoreInput('thirdPlace', match.id, 'team2Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team2 || !isSuperAdmin}
                        />
                      </div>
                      {isSuperAdmin && match.team1 && match.team2 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: match.went_to_penalties ? 'var(--color-accent)' : 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                          <input type="checkbox" checked={!!match.went_to_penalties} onChange={(e) => onRealKnockoutPenaltiesChange('thirdPlace', match.id, e.target.checked)} style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
                          🥅 Fue a Penales (+1 pto si acertaron ganador)
                        </label>
                      )}
                    </div>
                  ))}

                  {realKnockoutStage.final.map(match => (
                    <div key={match.id} className="admin-match-item" style={{ border: '1px solid var(--color-accent)' }}>
                      <div className="admin-match-header">
                        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{match.date}</span>
                        <span>{match.id}</span>
                      </div>
                      <div className="admin-match-row">
                        {getTeamName(match.team1, 'Finalista')}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team1Score}
                          onChange={(e) => handleKnockoutScoreInput('final', match.id, 'team1Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team1 || !isSuperAdmin}
                        />
                      </div>
                      <div className="admin-match-row" style={{ marginTop: '0.25rem' }}>
                        {getTeamName(match.team2, 'Finalista')}
                        <input
                          type="text"
                          inputMode="numeric"
                          className="admin-score-input"
                          value={match.team2Score}
                          onChange={(e) => handleKnockoutScoreInput('final', match.id, 'team2Score', e.target.value)}
                          maxLength={2}
                          disabled={!match.team2 || !isSuperAdmin}
                        />
                      </div>
                      {isSuperAdmin && match.team1 && match.team2 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: match.went_to_penalties ? 'var(--color-accent)' : 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                          <input type="checkbox" checked={!!match.went_to_penalties} onChange={(e) => onRealKnockoutPenaltiesChange('final', match.id, e.target.checked)} style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
                          🥅 Fue a Penales (+1 pto si acertaron ganador)
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VISTA DE GESTIÓN DE ACCESOS */}
        {activeTab === 'users' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>👥 Usuarios y Accesos Administrativos</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Gestiona los permisos y exporta la lista completa de usuarios (clientes y empleados) a Excel.
                </p>
              </div>
              
              <button 
                className="primary-btn" 
                onClick={handleExportExcel}
                disabled={usersList.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                📊 Exportar Excel ({usersList.length})
              </button>
            </div>

            {/* Panel de Métricas Rápidas */}
            <div className="stats-row" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              <div className="glass-card stat-card" style={{ padding: '1rem' }}>
                <span className="stat-label" style={{ fontSize: '0.7rem' }}>Total Usuarios</span>
                <div className="stat-val" style={{ fontSize: '1.65rem' }}>{usersList.length}</div>
              </div>
              <div className="glass-card stat-card" style={{ padding: '1rem' }}>
                <span className="stat-label" style={{ fontSize: '0.7rem' }}>Administradores</span>
                <div className="stat-val secondary" style={{ fontSize: '1.65rem' }}>
                  {usersList.filter(u => u.is_admin).length}
                </div>
              </div>
              <div className="glass-card stat-card" style={{ padding: '1rem' }}>
                <span className="stat-label" style={{ fontSize: '0.7rem' }}>Participantes</span>
                <div className="stat-val accent" style={{ fontSize: '1.65rem' }}>
                  {usersList.length}
                </div>
              </div>
            </div>

            {/* Buscador de usuarios */}
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por nombre o correo electrónico..."
                className="profile-input"
                style={{ width: '100%', padding: '0.75rem 1rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                🔄 Cargando usuarios registrados...
              </div>
            ) : (
              <div className="users-management-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {usersList.filter(u => 
                  u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </div>
                ) : (
                  usersList.filter(u => 
                    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(u => {
                    const initials = u.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
                    const isSelf = u.id === currentUser?.id;
                    const isTargetSuper = u.email === 'denis@logistica.com' || u.email.toLowerCase().includes('denis');
                    
                    return (
                      <div key={u.id} className="profile-item" style={{ cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div className="profile-avatar" style={{ 
                            background: u.is_admin ? 'linear-gradient(135deg, var(--color-accent), #d4af37)' : 'linear-gradient(135deg, var(--color-secondary), var(--color-info))',
                            boxShadow: u.is_admin ? '0 0 10px rgba(255, 215, 0, 0.2)' : 'none'
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                              {u.name}
                              {isSelf && <span style={{ fontSize: '0.7rem', background: 'rgba(0, 255, 135, 0.1)', color: 'var(--color-primary)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>Tú</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              <span>{u.email}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(u.email);
                                  if (showToast) showToast('¡Correo copiado!', 'success');
                                }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem' }}
                                title="Copiar correo"
                              >
                                📋
                              </button>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              Registrado el: {new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="profile-badge" style={{ 
                            background: u.id_tipo_usuario === 1 ? 'rgba(0, 210, 255, 0.1)' : 'rgba(0, 255, 135, 0.1)',
                            color: u.id_tipo_usuario === 1 ? 'var(--color-info)' : 'var(--color-primary)',
                            border: u.id_tipo_usuario === 1 ? '1px solid rgba(0, 210, 255, 0.2)' : '1px solid rgba(0, 255, 135, 0.2)'
                          }}>
                            {u.tipo_usuario_nombre || (u.id_tipo_usuario === 1 ? 'Cliente ⚽' : 'Empleado 📦')}
                          </span>

                          <span className="profile-badge" style={{ 
                            background: u.is_admin ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            color: u.is_admin ? 'var(--color-accent)' : 'var(--text-secondary)',
                            border: u.is_admin ? '1px solid rgba(255, 215, 0, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            {u.is_admin ? '👑 Administrador' : '⚽ Participante'}
                          </span>

                          {/* Control de roles (Solo Super Administrador Denis puede promover/degradar) */}
                          {isSuperAdmin && !isTargetSuper && (
                            <button
                              className="primary-btn"
                              style={{ 
                                padding: '0.4rem 0.85rem', 
                                fontSize: '0.75rem',
                                background: u.is_admin ? 'linear-gradient(135deg, var(--color-danger) 0%, #bb0044 100%)' : 'linear-gradient(135deg, var(--color-primary) 0%, #00bb66 100%)',
                                color: u.is_admin ? '#ffffff' : '#060913',
                                boxShadow: 'none'
                              }}
                              disabled={togglingUserId === u.id}
                              onClick={() => handleToggleAdmin(u.id, u.name)}
                            >
                              {togglingUserId === u.id ? '...' : u.is_admin ? '❌ Quitar Admin' : '👑 Hacer Admin'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'phases' && isSuperAdmin && (
          <div className="fade-in">
            <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>🔧 Control y Bloqueo de Fases del Torneo</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Controla de forma global el acceso de los participantes a cada sección de la quiniela.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Fase de Grupos */}
              <div className="profile-item" style={{ cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h5 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>🔒 Bloquear Fase de Grupos</h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                    Si se activa, los usuarios no podrán modificar ni guardar pronósticos de la Fase de Grupos.
                  </p>
                </div>
                <button
                  className="primary-btn"
                  style={{
                    background: config.fase_grupos_bloqueada ? 'linear-gradient(135deg, var(--color-danger) 0%, #bb0044 100%)' : 'linear-gradient(135deg, var(--color-primary) 0%, #00bb66 100%)',
                    color: config.fase_grupos_bloqueada ? '#fff' : '#060913',
                    boxShadow: 'none'
                  }}
                  onClick={() => handleToggleConfig('fase_grupos_bloqueada', !config.fase_grupos_bloqueada)}
                >
                  {config.fase_grupos_bloqueada ? '🔓 Desbloquear Grupos' : '🔒 Bloquear Grupos'}
                </button>
              </div>

              {/* Fase de Eliminatorias */}
              <div className="profile-item" style={{ cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h5 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>🔒 Bloquear Fase de Eliminatorias</h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                    Si se activa, los usuarios no podrán guardar ni modificar marcadores en el bracket de 16vos en adelante.
                  </p>
                </div>
                <button
                  className="primary-btn"
                  style={{
                    background: config.fase_eliminatorias_bloqueada ? 'linear-gradient(135deg, var(--color-danger) 0%, #bb0044 100%)' : 'linear-gradient(135deg, var(--color-primary) 0%, #00bb66 100%)',
                    color: config.fase_eliminatorias_bloqueada ? '#fff' : '#060913',
                    boxShadow: 'none'
                  }}
                  onClick={() => handleToggleConfig('fase_eliminatorias_bloqueada', !config.fase_eliminatorias_bloqueada)}
                >
                  {config.fase_eliminatorias_bloqueada ? '🔓 Desbloquear Eliminatorias' : '🔒 Bloquear Eliminatorias'}
                </button>
              </div>

              {/* Visibilidad del Bracket */}
              <div className="profile-item" style={{ cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h5 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>👁️ Visibilidad del Bracket de Eliminatorias</h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                    Controla si la pestaña "🌲 Bracket Eliminatorias" es visible para los participantes comunes.
                  </p>
                </div>
                <button
                  className="primary-btn"
                  style={{
                    background: config.fase_eliminatorias_visible ? 'linear-gradient(135deg, var(--color-primary) 0%, #00bb66 100%)' : 'rgba(255,255,255,0.05)',
                    color: config.fase_eliminatorias_visible ? '#060913' : 'var(--text-secondary)',
                    boxShadow: 'none',
                    border: config.fase_eliminatorias_visible ? 'none' : '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => handleToggleConfig('fase_eliminatorias_visible', !config.fase_eliminatorias_visible)}
                >
                  {config.fase_eliminatorias_visible ? '👁️ Hacer Invisible (Ocultar)' : '👁️ Hacer Visible (Mostrar)'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
