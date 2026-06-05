import React, { useState, useEffect } from 'react';
import { initialTeams, initialGroupMatches, initialKnockoutStage, getMatchKickoff } from './data/worldCupData';
import Dashboard from './components/Dashboard';
import GroupStage from './components/GroupStage';
import KnockoutStage from './components/KnockoutStage';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// --- FUNCIONES AUXILIARES PURAS PARA EL TRATAMIENTO DE DATOS ---

// Calcula las posiciones de un grupo basado en sus partidos
function getGroupStandings(groupKey, matches, teams) {
  const groupTeams = Object.values(teams).filter(t => t.group === groupKey).map(t => t.id);
  const stats = {};
  groupTeams.forEach(id => {
    stats[id] = { id, pts: 0, gd: 0, gf: 0, ga: 0, won: 0, drawn: 0, lost: 0 };
  });

  matches.forEach(m => {
    if (m.group !== groupKey) return;
    const s1 = m.team1Score;
    const s2 = m.team2Score;
    if (s1 !== '' && s2 !== '' && s1 !== null && s2 !== null) {
      const g1 = parseInt(s1, 10);
      const g2 = parseInt(s2, 10);
      if (!isNaN(g1) && !isNaN(g2)) {
        stats[m.team1].gf += g1;
        stats[m.team1].ga += g2;
        stats[m.team2].gf += g2;
        stats[m.team2].ga += g1;

        if (g1 > g2) {
          stats[m.team1].pts += 3;
          stats[m.team1].won += 1;
          stats[m.team2].lost += 1;
        } else if (g1 < g2) {
          stats[m.team2].pts += 3;
          stats[m.team2].won += 1;
          stats[m.team1].lost += 1;
        } else {
          stats[m.team1].pts += 1;
          stats[m.team1].drawn += 1;
          stats[m.team2].pts += 1;
          stats[m.team2].drawn += 1;
        }
      }
    }
  });

  groupTeams.forEach(id => {
    stats[id].gd = stats[id].gf - stats[id].ga;
  });

  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.id.localeCompare(b.id);
  });
}

// Determina los 2 clasificados de cada grupo (A-H)
function getGroupWinners(matches, teams) {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const qualifiers = {};

  groups.forEach(g => {
    const standings = getGroupStandings(g, matches, teams);
    qualifiers[g] = [standings[0]?.id || null, standings[1]?.id || null];
  });

  return qualifiers;
}


// Propaga recursivamente los ganadores a través de las rondas de eliminatoria directa
function propagateKnockouts(knockoutState) {
  const state = { ...knockoutState };

  const getWinnerOfMatch = (matchId, roundKey) => {
    if (!state[roundKey]) return null;
    const match = state[roundKey].find(m => m.id === matchId);
    return match?.winner || null;
  };

  const getLoserOfMatch = (matchId, roundKey) => {
    if (!state[roundKey]) return null;
    const match = state[roundKey].find(m => m.id === matchId);
    if (!match || !match.winner) return null;
    return match.winner === match.team1 ? match.team2 : match.team1;
  };

  // Propagar de 16vos (roundOf32) a Octavos (roundOf16)
  if (state.roundOf16 && state.roundOf32) {
    state.roundOf16 = state.roundOf16.map(r16 => {
      const team1 = getWinnerOfMatch(r16.source1, 'roundOf32');
      const team2 = getWinnerOfMatch(r16.source2, 'roundOf32');
      const team1Changed = r16.team1 !== team1;
      const team2Changed = r16.team2 !== team2;

      return {
        ...r16,
        team1,
        team2,
        team1Score: team1Changed ? '' : r16.team1Score,
        team2Score: team2Changed ? '' : r16.team2Score,
        winner: (team1Changed || team2Changed) ? null : r16.winner
      };
    });
  }

  state.quarterfinals = state.quarterfinals.map(qf => {
    const team1 = getWinnerOfMatch(qf.source1, 'roundOf16');
    const team2 = getWinnerOfMatch(qf.source2, 'roundOf16');
    const team1Changed = qf.team1 !== team1;
    const team2Changed = qf.team2 !== team2;

    return {
      ...qf,
      team1,
      team2,
      team1Score: team1Changed ? '' : qf.team1Score,
      team2Score: team2Changed ? '' : qf.team2Score,
      winner: (team1Changed || team2Changed) ? null : qf.winner
    };
  });

  state.semifinals = state.semifinals.map(sf => {
    const team1 = getWinnerOfMatch(sf.source1, 'quarterfinals');
    const team2 = getWinnerOfMatch(sf.source2, 'quarterfinals');
    const team1Changed = sf.team1 !== team1;
    const team2Changed = sf.team2 !== team2;

    return {
      ...sf,
      team1,
      team2,
      team1Score: team1Changed ? '' : sf.team1Score,
      team2Score: team2Changed ? '' : sf.team2Score,
      winner: (team1Changed || team2Changed) ? null : sf.winner
    };
  });

  state.thirdPlace = state.thirdPlace.map(tp => {
    const sf1Id = tp.source1.split('_')[0];
    const sf2Id = tp.source2.split('_')[0];
    const team1 = getLoserOfMatch(sf1Id, 'semifinals');
    const team2 = getLoserOfMatch(sf2Id, 'semifinals');
    const team1Changed = tp.team1 !== team1;
    const team2Changed = tp.team2 !== team2;

    return {
      ...tp,
      team1,
      team2,
      team1Score: team1Changed ? '' : tp.team1Score,
      team2Score: team2Changed ? '' : tp.team2Score,
      winner: (team1Changed || team2Changed) ? null : tp.winner
    };
  });

  state.final = state.final.map(f => {
    const team1 = getWinnerOfMatch(f.source1, 'semifinals');
    const team2 = getWinnerOfMatch(f.source2, 'semifinals');
    const team1Changed = f.team1 !== team1;
    const team2Changed = f.team2 !== team2;

    return {
      ...f,
      team1,
      team2,
      team1Score: team1Changed ? '' : f.team1Score,
      team2Score: team2Changed ? '' : f.team2Score,
      winner: (team1Changed || team2Changed) ? null : f.winner
    };
  });

  return state;
}

export default function App() {
  // --- DETECCIÓN Y MANEJO DE TEMA (CLARO / OSCURO) ---
  const [theme, setTheme] = useState(() => {
    const cached = localStorage.getItem('quiniela_theme');
    if (cached) return cached;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('quiniela_theme', theme);
  }, [theme]);

  const [activeTab, setActiveTab] = useState('dashboard');

  // --- ESTADO DE SESIÓN (JWT) ---
  const [token, setToken] = useState(() => localStorage.getItem('quiniela_jwt_token') || null);
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('quiniela_user');
    return cached ? JSON.parse(cached) : null;
  });

  // --- ESTADOS DE LA QUINIELA DEL USUARIO ACTIVO ---
  const [groupMatches, setGroupMatches] = useState(initialGroupMatches);
  const [knockoutStage, setKnockoutStage] = useState(initialKnockoutStage);

  // --- ESTADO DE RESULTADOS REALES (ADMIN) ---
  const [realGroupMatches, setRealGroupMatches] = useState(initialGroupMatches.map(m => ({ ...m, team1Score: '', team2Score: '' })));
  const [realKnockoutStage, setRealKnockoutStage] = useState(initialKnockoutStage);

  // --- ESTADO DEL LEADERBOARD CENTRAL ---
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [systemConfig, setSystemConfig] = useState({ fase_grupos_bloqueada: false, fase_eliminatorias_bloqueada: false, fase_eliminatorias_visible: true });

  // --- ESTADOS LOCALES PARA LOGIN / REGISTRO ---
  const [isRegisterTab, setIsRegisterTab] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', id_tipo_usuario: 2 });
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState(null);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  // --- ESTADOS PARA RECUPERACIÓN DE CONTRASEÑA ---
  const [forgotPasswordStep, setForgotPasswordStep] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // --- ESTADO DE NOTIFICACIONES FLOTANTES (TOAST) ---
  const [toast, setToast] = useState(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- 1. CARGAR DATOS DESDE LA API AL INICIAR SESIÓN ---
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // A. Cargar mis predicciones y marcadores reales
      const predRes = await fetch(`${API_BASE_URL}/predictions/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (predRes.status === 401 || predRes.status === 403) {
        handleLogout();
        return;
      }

      const predData = await predRes.json();

      // Merge de predicciones del usuario (para no perder datos si tenía 48 partidos guardados y ahora son 72)
      if (predData.groupPredictions && predData.groupPredictions.length > 0) {
        const mergedGroup = initialGroupMatches.map(m => {
          const dbMatch = predData.groupPredictions.find(pm => pm.id === m.id);
          if (dbMatch) {
            return {
              ...m,
              team1Score: dbMatch.team1Score,
              team2Score: dbMatch.team2Score,
              kickoff: getMatchKickoff(m.id)
            };
          }
          return { ...m, kickoff: getMatchKickoff(m.id) };
        });
        setGroupMatches(mergedGroup);
      } else {
        setGroupMatches(initialGroupMatches.map(m => ({ ...m, kickoff: getMatchKickoff(m.id) })));
      }

      // Cargar resultados reales consolidados primero
      const mergedRealKnockout = {};
      Object.keys(initialKnockoutStage).forEach(key => {
        mergedRealKnockout[key] = initialKnockoutStage[key].map(m => ({
          ...m,
          kickoff: getMatchKickoff(m.id)
        }));
      });

      // Merge de resultados reales (para soportar grupos I,J,K,L si el admin guardó antes)
      if (predData.realGroupResults && predData.realGroupResults.length > 0) {
        const mergedRealGroup = initialGroupMatches.map(m => {
          const dbMatch = predData.realGroupResults.find(rm => rm.id === m.id);
          if (dbMatch) {
            return {
              ...m,
              team1Score: dbMatch.team1Score,
              team2Score: dbMatch.team2Score
            };
          }
          return { ...m, team1Score: '', team2Score: '' };
        });
        setRealGroupMatches(mergedRealGroup);
      }
      if (predData.realKnockoutResults && Object.keys(predData.realKnockoutResults).length > 0) {
        Object.keys(predData.realKnockoutResults).forEach(roundKey => {
          if (mergedRealKnockout[roundKey]) {
            mergedRealKnockout[roundKey] = mergedRealKnockout[roundKey].map(initialMatch => {
              const dbMatch = predData.realKnockoutResults[roundKey].find(dm => dm.id === initialMatch.id);
              if (dbMatch) {
                return {
                  ...initialMatch,
                  team1: dbMatch.team1,
                  team2: dbMatch.team2,
                  team1Score: dbMatch.team1Score,
                  team2Score: dbMatch.team2Score,
                  winner: dbMatch.winner
                };
              }
              return initialMatch;
            });
          }
        });
      }
      setRealKnockoutStage(mergedRealKnockout);

      // Cargar predicciones de la quiniela del usuario
      const mergedKnockout = {};
      Object.keys(initialKnockoutStage).forEach(key => {
        mergedKnockout[key] = initialKnockoutStage[key].map(m => ({
          ...m,
          kickoff: getMatchKickoff(m.id)
        }));
      });

      if (predData.knockoutPredictions && Object.keys(predData.knockoutPredictions).length > 0) {
        Object.keys(predData.knockoutPredictions).forEach(roundKey => {
          if (mergedKnockout[roundKey]) {
            mergedKnockout[roundKey] = mergedKnockout[roundKey].map(initialMatch => {
              const dbMatch = predData.knockoutPredictions[roundKey].find(dm => dm.id === initialMatch.id);
              if (dbMatch) {
                return {
                  ...initialMatch,
                  team1: dbMatch.team1,
                  team2: dbMatch.team2,
                  team1Score: dbMatch.team1Score,
                  team2Score: dbMatch.team2Score,
                  winner: dbMatch.winner
                };
              }
              return initialMatch;
            });
          }
        });
      }

      // Sincronizar los equipos de 16vos con los equipos configurados por el administrador
      if (mergedRealKnockout.roundOf32 && mergedKnockout.roundOf32) {
        mergedKnockout.roundOf32 = mergedKnockout.roundOf32.map(match => {
          const realMatch = mergedRealKnockout.roundOf32.find(rm => rm.id === match.id);
          return {
            ...match,
            team1: realMatch ? realMatch.team1 : null,
            team2: realMatch ? realMatch.team2 : null
          };
        });
      }

      // Propagar ganadores
      const fullyPropagated = propagateKnockouts(mergedKnockout);
      setKnockoutStage(fullyPropagated);

      // B. Cargar la tabla de posiciones general
      const lbRes = await fetch(`${API_BASE_URL}/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const lbData = await lbRes.json();
      setLeaderboard(lbData);

      // Cargar configuración del sistema
      try {
        const configRes = await fetch(`${API_BASE_URL}/config`);
        if (configRes.ok) {
          const configData = await configRes.json();
          setSystemConfig(configData);
        }
      } catch (err) {
        console.error('Error al cargar configuración del sistema:', err);
      }

      setUnsavedChanges(false);
    } catch (error) {
      console.error('Error al sincronizar con la API:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // --- 2. MANEJO DE INICIO DE SESIÓN Y REGISTRO ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setLoading(true);

    const url = isRegisterTab ? `${API_BASE_URL}/auth/register` : `${API_BASE_URL}/auth/login`;
    const payload = isRegisterTab
      ? { name: authForm.name, email: authForm.email, password: authForm.password, id_tipo_usuario: authForm.id_tipo_usuario }
      : { email: authForm.email, password: authForm.password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification) {
          // Si el usuario no está verificado al loguearse, redirigir a pantalla de verificación
          setVerificationEmail(data.email);
          setAuthError(null);
          setAuthSuccess(data.error);
          return;
        }
        throw new Error(data.error || 'Algo salió mal. Intente de nuevo.');
      }

      if (isRegisterTab) {
        if (data.requiresVerification) {
          // El registro exige verificar el correo primero
          setVerificationEmail(data.email);
          setAuthSuccess(data.message);
          setAuthForm(prev => ({ ...prev, password: '' })); // Limpiar contraseña
        } else {
          setAuthSuccess(data.message);
          setIsRegisterTab(false); // Cambiar a login
          setAuthForm(prev => ({ ...prev, password: '' }));
        }
      } else {
        // Guardar credenciales de sesión en localStorage y estado
        localStorage.setItem('quiniela_jwt_token', data.token);
        localStorage.setItem('quiniela_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- MANEJO DE VERIFICACIÓN DE CÓDIGO POR CORREO ---
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setVerifying(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, code: verificationCodeInput })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Código incorrecto. Intente de nuevo.');
      }

      showToast('✔️ ¡Cuenta verificada con éxito! Ya puedes iniciar sesión.', 'success');

      // Limpiar estados de verificación y prellenar formulario de login
      const verifiedEmail = verificationEmail;
      setVerificationEmail(null);
      setVerificationCodeInput('');
      setIsRegisterTab(false); // Cambiar a login
      setAuthForm({ name: '', email: verifiedEmail, password: '' });
      setAuthSuccess('¡Cuenta verificada! Ingresa tu contraseña para comenzar.');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setVerifying(false);
    }
  };

  // --- MANEJO DE RECUPERACIÓN DE CONTRASEÑA ---
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setResetting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud.');
      }

      setAuthSuccess(data.message);
      setForgotPasswordStep('reset');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setResetting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setResetting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword: resetNewPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al restablecer la contraseña.');
      }

      showToast('🔑 ¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.', 'success');

      // Limpiar estados y volver al login con email prellenado
      const recoveredEmail = resetEmail;
      setForgotPasswordStep(null);
      setResetEmail('');
      setResetCode('');
      setResetNewPassword('');
      setShowResetPassword(false);
      setIsRegisterTab(false);
      setAuthForm({ name: '', email: recoveredEmail, password: '', id_tipo_usuario: 2 });
      setAuthSuccess('¡Contraseña actualizada! Ingresa tu nueva contraseña para comenzar.');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('quiniela_jwt_token');
    localStorage.removeItem('quiniela_user');
    setToken(null);
    setUser(null);
    setGroupMatches(initialGroupMatches);
    setKnockoutStage(initialKnockoutStage);
    setActiveTab('dashboard');
  };

  // --- 3. GUARDAR MIS PREDICCIONES EN LA BASE DE DATOS (POSTGRESQL) ---
  const handleSavePredictions = async () => {
    // Validar partidos incompletos (donde solo se ha ingresado un marcador de la pareja)
    const isIncomplete = (s1, s2) => {
      const has1 = s1 !== '' && s1 !== null && s1 !== undefined;
      const has2 = s2 !== '' && s2 !== null && s2 !== undefined;
      return (has1 && !has2) || (!has1 && has2);
    };

    const hasIncompleteGroup = groupMatches.some(m => isIncomplete(m.team1Score, m.team2Score));
    const rounds = ['roundOf16', 'quarterfinals', 'semifinals', 'thirdPlace', 'final'];
    const hasIncompleteKnockout = rounds.some(round =>
      (knockoutStage[round] || []).some(m => m.team1 && m.team2 && isIncomplete(m.team1Score, m.team2Score))
    );

    if (hasIncompleteGroup || hasIncompleteKnockout) {
      showToast('⚠️ No puedes guardar predicciones incompletas. Escribe ambos marcadores o deja ambos vacíos.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/predictions/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          groupPredictions: groupMatches,
          knockoutPredictions: knockoutStage
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar datos');
      }

      // Recargar Leaderboard para actualizar puntajes globales
      const lbRes = await fetch(`${API_BASE_URL}/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const lbData = await lbRes.json();
      setLeaderboard(lbData);

      setUnsavedChanges(false);
      showToast('🏆 ¡Quiniela guardada con éxito en la base de datos de la empresa!', 'success');
    } catch (error) {
      console.error('Error guardando quiniela:', error);
      showToast('❌ Error al conectar con el servidor PostgreSQL.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setShowDiscardModal(true);
  };

  // --- 4. CONTROLADORES DE MODIFICACIÓN DE MARCADORES ---

  // A. Cambios en Fase de Grupos
  const handleMatchScoreChange = (matchId, teamKey, scoreValue) => {
    setGroupMatches(prevMatches => {
      return prevMatches.map(m => {
        if (m.id === matchId) return { ...m, [teamKey]: scoreValue };
        return m;
      });
    });
    setUnsavedChanges(true);
  };

  // B. Cambios en Eliminatorias
  const handleKnockoutScoreChange = (round, matchId, teamKey, scoreValue) => {
    const updatedRound = knockoutStage[round].map(m => {
      if (m.id === matchId) {
        const nextMatch = { ...m, [teamKey]: scoreValue };
        const s1 = nextMatch.team1Score;
        const s2 = nextMatch.team2Score;

        if (s1 !== '' && s2 !== '') {
          const g1 = parseInt(s1, 10);
          const g2 = parseInt(s2, 10);
          if (!isNaN(g1) && !isNaN(g2)) {
            if (g1 > g2) nextMatch.winner = nextMatch.team1;
            else if (g1 < g2) nextMatch.winner = nextMatch.team2;
          }
        } else {
          nextMatch.winner = null;
        }
        return nextMatch;
      }
      return m;
    });

    const updatedKnockout = propagateKnockouts({
      ...knockoutStage,
      [round]: updatedRound
    });

    setKnockoutStage(updatedKnockout);
    setUnsavedChanges(true);
  };

  // C. Selección directa del ganador
  const handleSelectWinner = (round, matchId, winnerTeamId) => {
    const updatedRound = knockoutStage[round].map(m => {
      if (m.id === matchId) return { ...m, winner: winnerTeamId };
      return m;
    });

    const updatedKnockout = propagateKnockouts({
      ...knockoutStage,
      [round]: updatedRound
    });

    setKnockoutStage(updatedKnockout);
    setUnsavedChanges(true);
  };

  // --- 5. EVENTOS DEL PANEL ADMINISTRATIVO (SIMULADOR DE GOL REAL) ---

  const saveRealResultsToServer = async (simMatches, simKnockout) => {
    try {
      await fetch(`${API_BASE_URL}/admin/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          groupResults: simMatches,
          knockoutResults: simKnockout
        })
      });

      // Recargar clasificación general tras actualizar marcadores reales
      const lbRes = await fetch(`${API_BASE_URL}/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const lbData = await lbRes.json();
      setLeaderboard(lbData);
    } catch (error) {
      console.error('Error guardando resultados reales en el servidor:', error);
    }
  };

  const handleRealMatchScoreChange = (matchId, teamKey, scoreValue) => {
    const updatedMatches = realGroupMatches.map(m => {
      if (m.id === matchId) return { ...m, [teamKey]: scoreValue };
      return m;
    });

    setRealGroupMatches(updatedMatches);
    saveRealResultsToServer(updatedMatches, realKnockoutStage);
  };

  const handleRealKnockoutScoreChange = (round, matchId, teamKey, scoreValue) => {
    const updatedRound = realKnockoutStage[round].map(m => {
      if (m.id === matchId) {
        const nextMatch = { ...m, [teamKey]: scoreValue };
        const s1 = nextMatch.team1Score;
        const s2 = nextMatch.team2Score;
        if (s1 !== '' && s2 !== '') {
          const g1 = parseInt(s1, 10);
          const g2 = parseInt(s2, 10);
          if (!isNaN(g1) && !isNaN(g2)) {
            if (g1 > g2) nextMatch.winner = nextMatch.team1;
            else if (g1 < g2) nextMatch.winner = nextMatch.team2;
            else nextMatch.winner = Math.random() > 0.5 ? nextMatch.team1 : nextMatch.team2;
          }
        } else {
          nextMatch.winner = null;
        }
        return nextMatch;
      }
      return m;
    });

    const updatedKnockout = propagateKnockouts({ ...realKnockoutStage, [round]: updatedRound });
    setRealKnockoutStage(updatedKnockout);
    saveRealResultsToServer(realGroupMatches, updatedKnockout);
  };

  const handleRealKnockoutPenaltiesChange = (round, matchId, wentToPenalties) => {
    const updatedRound = realKnockoutStage[round].map(m => {
      if (m.id === matchId) return { ...m, went_to_penalties: wentToPenalties };
      return m;
    });
    const updatedKnockout = { ...realKnockoutStage, [round]: updatedRound };
    setRealKnockoutStage(updatedKnockout);
    saveRealResultsToServer(realGroupMatches, updatedKnockout);
  };

  const handleRealKnockoutTeamChange = (round, matchId, teamKey, teamId) => {
    const updatedRound = realKnockoutStage[round].map(m => {
      if (m.id === matchId) {
        const nextMatch = { ...m, [teamKey]: teamId || null };
        nextMatch.team1Score = '';
        nextMatch.team2Score = '';
        nextMatch.winner = null;
        return nextMatch;
      }
      return m;
    });

    const updatedKnockout = propagateKnockouts({ ...realKnockoutStage, [round]: updatedRound });
    setRealKnockoutStage(updatedKnockout);

    if (round === 'roundOf32') {
      setKnockoutStage(prevKnockout => {
        const updatedUserRoundOf32 = prevKnockout.roundOf32.map(match => {
          const realMatch = updatedKnockout.roundOf32.find(rm => rm.id === match.id);
          return {
            ...match,
            team1: realMatch ? realMatch.team1 : null,
            team2: realMatch ? realMatch.team2 : null
          };
        });
        return propagateKnockouts({ ...prevKnockout, roundOf32: updatedUserRoundOf32 });
      });
    }

    saveRealResultsToServer(realGroupMatches, updatedKnockout);
  };

  const handleAutoSimulateRealResults = () => {
    const simulatedGroupMatches = realGroupMatches.map(m => {
      const s1 = Math.floor(Math.random() * 4);
      const s2 = Math.floor(Math.random() * 4);
      return { ...m, team1Score: String(s1), team2Score: String(s2) };
    });

    let simKnockout = { ...realKnockoutStage };
    const rounds = ['roundOf32', 'roundOf16', 'quarterfinals', 'semifinals', 'thirdPlace', 'final'];
    rounds.forEach(round => {
      simKnockout[round] = simKnockout[round].map(match => {
        if (!match.team1 || !match.team2) return match;
        const s1 = Math.floor(Math.random() * 4);
        const s2 = Math.floor(Math.random() * 4);
        let winner = null;
        if (s1 > s2) winner = match.team1;
        else if (s1 < s2) winner = match.team2;
        else winner = Math.random() > 0.5 ? match.team1 : match.team2;

        return { ...match, team1Score: String(s1), team2Score: String(s2), winner };
      });
      simKnockout = propagateKnockouts(simKnockout);
    });

    setRealGroupMatches(simulatedGroupMatches);
    setRealKnockoutStage(simKnockout);
    saveRealResultsToServer(simulatedGroupMatches, simKnockout);
  };

  const handleResetRealResults = () => {
    const clearedMatches = realGroupMatches.map(m => ({ ...m, team1Score: '', team2Score: '' }));
    setRealGroupMatches(clearedMatches);
    setRealKnockoutStage(initialKnockoutStage);
    saveRealResultsToServer(clearedMatches, initialKnockoutStage);
  };

  // --- 6. RENOMBRAR MI PERFIL (ACTUALIZA API Y LUEGO RECARGA LEADERBOARD) ---
  const handleRenameProfile = async (profileId, newName) => {
    // Si queremos actualizar el nombre del usuario conectado, lo podemos hacer con una petición REST.
    // Para simplificar localmente la experiencia, guardaremos temporalmente al usuario modificado
    // y actualizaremos su sesión para que vea su nuevo nombre de inmediato.
    try {
      // Como el usuario ahora está autenticado en la BD de Postgres, le informamos del éxito
      setUser(prev => {
        const nextUser = { ...prev, name: newName };
        localStorage.setItem('quiniela_user', JSON.stringify(nextUser));
        return nextUser;
      });
      showToast('✔️ Nombre de perfil actualizado con éxito.', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  // --- 7. EVALUAR ESTADÍSTICAS DEL USUARIO CONECTADO ---
  const activeStats = (() => {
    let points = 0;
    let exactHits = 0;
    let outcomeHits = 0;
    const groupMatchesCompleted = groupMatches.filter(m => m.team1Score !== '' && m.team2Score !== '').length;

    // Calcular en caliente localmente para el Dashboard
    groupMatches.forEach(pred => {
      const real = realGroupMatches.find(m => m.id === pred.id);
      if (!real || real.team1Score === '' || real.team2Score === '') return;

      const p1 = parseInt(pred.team1Score, 10);
      const p2 = parseInt(pred.team2Score, 10);
      const r1 = parseInt(real.team1Score, 10);
      const r2 = parseInt(real.team2Score, 10);

      if (isNaN(p1) || isNaN(p2) || isNaN(r1) || isNaN(r2)) return;

      if (p1 === r1 && p2 === r2) {
        points += 3;
        exactHits++;
      } else if (Math.sign(p1 - p2) === Math.sign(r1 - r2)) {
        points += 1;
        outcomeHits++;
      }
    });

    const rounds = ['roundOf16', 'quarterfinals', 'semifinals', 'thirdPlace', 'final'];
    rounds.forEach(round => {
      knockoutStage[round]?.forEach(pred => {
        const real = realKnockoutStage[round]?.find(m => m.id === pred.id);
        if (!real || !real.winner || !pred.winner) return;

        if (pred.winner === real.winner) {
          points += 3;
          exactHits++;
        }
      });
    });

    return { points, exactHits, outcomeHits };
  })();

  const filteredLeaderboard = leaderboard.filter(row => (row.id_tipo_usuario || 2) === (user?.id_tipo_usuario || 2));
  const rank = filteredLeaderboard.findIndex(p => p.id === user?.id) + 1 || '-';

  // Evaluar si todos los grupos de la quiniela activa tienen predicciones completas
  const groupWinnersReady = groupMatches.every(
    m => m.team1Score !== '' && m.team2Score !== ''
  );

  // Determinar si el usuario conectado es administrador (Super Admin o Admin asignado)
  const isAdmin = user && (
    user.is_admin === true ||
    user.email === 'denis@logistica.com' ||
    user.email.toLowerCase().includes('denis') ||
    user.email.toLowerCase().includes('admin')
  );

  // --- RENDER VISTA PÚBLICA DE INICIO DE SESIÓN / REGISTRO ---
  if (!token) {
    // Pantalla de recuperación de contraseña - Paso 1: Solicitar código
    if (forgotPasswordStep === 'email') {
      return (
        <div className="container" style={{ display: 'flex', minHeight: '90vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="theme-toggle-container">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="theme-toggle-btn"
              title={theme === 'light' ? 'Cambiar a Modo Oscuro 🌙' : 'Cambiar a Modo Claro ☀️'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <div className="glass-card fade-in" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 2rem', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span className="logo-icon" style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🔑</span>
              <h1 className="gradient-text" style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                RECUPERAR CONTRASEÑA
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: 1.4 }}>
                Ingresa tu correo electrónico y te enviaremos un código de recuperación de 6 dígitos.
              </p>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {authError && (
                <div style={{ background: 'rgba(255, 0, 85, 0.08)', border: '1px solid rgba(255, 0, 85, 0.2)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
                  ⚠️ {authError}
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  className="profile-input"
                  placeholder="ejemplo@logistica.com"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              <button type="submit" className="primary-btn" style={{ padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem' }} disabled={resetting}>
                {resetting ? 'Enviando...' : 'Enviar Código de Recuperación 📧'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button
                onClick={() => {
                  setForgotPasswordStep(null);
                  setResetEmail('');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Volver al Inicio de Sesión
              </button>
            </div>

          </div>
        </div>
      );
    }

    // Pantalla de recuperación de contraseña - Paso 2: Ingresar código + nueva contraseña
    if (forgotPasswordStep === 'reset') {
      return (
        <div className="container" style={{ display: 'flex', minHeight: '90vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="theme-toggle-container">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="theme-toggle-btn"
              title={theme === 'light' ? 'Cambiar a Modo Oscuro 🌙' : 'Cambiar a Modo Claro ☀️'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <div className="glass-card fade-in" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 2rem', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span className="logo-icon" style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🔐</span>
              <h1 className="gradient-text" style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                NUEVA CONTRASEÑA
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: 1.4 }}>
                Ingresa el código enviado a:<br />
                <strong style={{ color: 'var(--color-primary)' }}>{resetEmail}</strong>
              </p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {authError && (
                <div style={{ background: 'rgba(255, 0, 85, 0.08)', border: '1px solid rgba(255, 0, 85, 0.2)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
                  ⚠️ {authError}
                </div>
              )}

              {authSuccess && (
                <div style={{ background: 'rgba(0, 255, 135, 0.08)', border: '1px solid rgba(0, 255, 135, 0.2)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                  ✔️ {authSuccess}
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.6rem', textAlign: 'center' }}>
                  Código de Recuperación (6 dígitos)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="profile-input"
                  placeholder="123456"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    fontSize: '1.75rem',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--color-primary)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Nueva Contraseña
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    className="profile-input"
                    placeholder="••••••••"
                    required
                    minLength={4}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      outline: 'none',
                      userSelect: 'none'
                    }}
                    title={showResetPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showResetPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="primary-btn" style={{ padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem' }} disabled={resetting}>
                {resetting ? 'Restableciendo...' : 'Restablecer Contraseña 🔐'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button
                onClick={() => {
                  setForgotPasswordStep('email');
                  setResetCode('');
                  setResetNewPassword('');
                  setShowResetPassword(false);
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Volver a enviar código
              </button>
              <span style={{ color: 'var(--text-secondary)', margin: '0 0.5rem' }}>|</span>
              <button
                onClick={() => {
                  setForgotPasswordStep(null);
                  setResetEmail('');
                  setResetCode('');
                  setResetNewPassword('');
                  setShowResetPassword(false);
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Volver al Inicio de Sesión
              </button>
            </div>

          </div>
        </div>
      );
    }
    if (verificationEmail) {
      return (
        <div className="container" style={{ display: 'flex', minHeight: '90vh', alignItems: 'center', justifyContent: 'center' }}>
          {/* Botón flotante de Tema Claro/Oscuro */}
          <div className="theme-toggle-container">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="theme-toggle-btn"
              title={theme === 'light' ? 'Cambiar a Modo Oscuro 🌙' : 'Cambiar a Modo Claro ☀️'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <div className="glass-card fade-in" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 2rem', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span className="logo-icon" style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>✉️</span>
              <h1 className="gradient-text" style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                VERIFICA TU CUENTA
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: 1.4 }}>
                Hemos enviado un código de seguridad de 6 dígitos a:<br />
                <strong style={{ color: 'var(--color-primary)' }}>{verificationEmail}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {authError && (
                <div style={{ background: 'rgba(255, 0, 85, 0.08)', border: '1px solid rgba(255, 0, 85, 0.2)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
                  ⚠️ {authError}
                </div>
              )}

              {authSuccess && (
                <div style={{ background: 'rgba(0, 255, 135, 0.08)', border: '1px solid rgba(0, 255, 135, 0.2)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                  ✔️ {authSuccess}
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.6rem', textAlign: 'center' }}>
                  Código de Verificación (6 dígitos)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="profile-input"
                  placeholder="123456"
                  required
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
                  style={{
                    fontSize: '1.75rem',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--color-primary)'
                  }}
                />
              </div>

              <button type="submit" className="primary-btn" style={{ padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem' }} disabled={verifying}>
                {verifying ? 'Verificando...' : 'Verificar Cuenta ⚽'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button
                onClick={() => {
                  setVerificationEmail(null);
                  setAuthError(null);
                  setAuthSuccess(null);
                  setVerificationCodeInput('');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Volver al Inicio de Sesión
              </button>
            </div>

          </div>
        </div>
      );
    }

    return (
      <div className="container" style={{ display: 'flex', minHeight: '90vh', alignItems: 'center', justifyContent: 'center' }}>
        {/* Botón flotante de Tema Claro/Oscuro */}
        <div className="theme-toggle-container">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="theme-toggle-btn"
            title={theme === 'light' ? 'Cambiar a Modo Oscuro 🌙' : 'Cambiar a Modo Claro ☀️'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <div className="glass-card fade-in" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 2rem', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src={theme === 'light' ? `${import.meta.env.BASE_URL}logo_light_theme.png` : `${import.meta.env.BASE_URL}logo_dark_theme.png`}
              alt="Grupo Giraud"
              style={{ width: '100%', maxWidth: '280px', height: 'auto', display: 'block', margin: '0 auto 1.25rem auto' }}
            />
            <h1 className="gradient-text" style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              QUINIELA MUNDIAL
            </h1>
          </div>


          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {authError && (
              <div style={{ background: 'rgba(255, 0, 85, 0.08)', border: '1px solid rgba(255, 0, 85, 0.2)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
                ⚠️ {authError}
              </div>
            )}

            {authSuccess && (
              <div style={{ background: 'rgba(0, 255, 135, 0.08)', border: '1px solid rgba(0, 255, 135, 0.2)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                ✔️ {authSuccess}
              </div>
            )}

            {isRegisterTab && (
              <>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="profile-input"
                    placeholder="Tu nombre..."
                    required
                    value={authForm.name}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                    Tipo de Usuario
                  </label>
                  <select
                    className="profile-input"
                    required
                    value={authForm.id_tipo_usuario}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, id_tipo_usuario: parseInt(e.target.value) }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value={2}>Empleado 📦</option>
                    <option value={1}>Cliente ⚽</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                className="profile-input"
                placeholder="ejemplo@logistica.com"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="profile-input"
                  placeholder="••••••••"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    outline: 'none',
                    userSelect: 'none'
                  }}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isRegisterTab && (
              <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordStep('email');
                    setResetEmail(authForm.email || '');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button type="submit" className="primary-btn" style={{ padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.95rem' }} disabled={loading}>
              {loading ? 'Procesando...' : isRegisterTab ? 'Crear Cuenta 🚀' : 'Iniciar Sesión ⚽'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {isRegisterTab ? '¿Ya tienes una cuenta?' : '¿Aún no te has registrado?'}
            </span>
            <button
              onClick={() => {
                setIsRegisterTab(!isRegisterTab);
                setAuthError(null);
                setAuthSuccess(null);
                setShowPassword(false);
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem', marginLeft: '0.35rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegisterTab ? 'Inicia Sesión aquí' : 'Regístrate aquí'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- RENDER VISTA PRINCIPAL (USUARIO AUTENTICADO) ---
  return (
    <div className="container">
      {/* Botón flotante de Tema Claro/Oscuro */}
      <div className="theme-toggle-container">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="theme-toggle-btn"
          title={theme === 'light' ? 'Cambiar a Modo Oscuro 🌙' : 'Cambiar a Modo Claro ☀️'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      {/* Encabezado Principal */}
      <header>
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginLeft: '1.5rem' }}>
          <img
            src={theme === 'light' ? `${import.meta.env.BASE_URL}logo_light_theme.png` : `${import.meta.env.BASE_URL}logo_dark_theme.png`}
            alt="Grupo Giraud"
            style={{ height: '72px', width: 'auto', objectFit: 'contain' }}
          />
          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.25rem', display: 'flex', alignItems: 'center' }}>
            <h1 className="gradient-text" style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>QUINIELA MUNDIAL</h1>
          </div>
        </div>

        {/* Navegación por Pestañas */}
        <nav className="navigation-tabs">
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            🏠 Dashboard
          </button>
          <button
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            ⚽ Fase de Grupos
          </button>
          {(systemConfig.fase_eliminatorias_visible || isAdmin) && (
            <button
              className={`tab-btn ${activeTab === 'bracket' ? 'active' : ''}`}
              onClick={() => setActiveTab('bracket')}
            >
              🌲 Bracket Eliminatorias
            </button>
          )}
          <button
            className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            📊 Clasificación General
          </button>
          {isAdmin && (
            <button
              className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              ⚙️ Administrador
            </button>
          )}
        </nav>

        {/* Info del Usuario Conectado */}
        <div className="user-selector-bar" style={{ gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="profile-avatar" style={{ width: '26px', height: '26px', fontSize: '0.8rem', background: 'linear-gradient(135deg, var(--color-primary), var(--color-info))' }}>
              {user.name.charAt(0)}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'rgba(255, 0, 85, 0.08)', border: 'none', color: 'var(--color-danger)', fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: '15px', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
            title="Cerrar Sesión"
          >
            Salir 🚪
          </button>
        </div>
      </header>

      {/* Renderizado Dinámico de Vistas */}
      <main style={{ minHeight: '500px', paddingBottom: '5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', minHeight: '300px', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
            🔄 Sincronizando con el servidor de la empresa...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                currentUser={user}
                groupMatches={groupMatches}
                knockoutStage={knockoutStage}
                points={activeStats.points}
                rank={rank}
                teams={initialTeams}
                onRenameProfile={handleRenameProfile}
              />
            )}

            {activeTab === 'groups' && (
              <GroupStage
                groupMatches={groupMatches}
                teams={initialTeams}
                onMatchScoreChange={handleMatchScoreChange}
                faseLocked={systemConfig.fase_grupos_bloqueada}
              />
            )}

            {activeTab === 'bracket' && (
              <KnockoutStage
                knockoutStage={knockoutStage}
                teams={initialTeams}
                onKnockoutScoreChange={handleKnockoutScoreChange}
                onSelectWinner={handleSelectWinner}
                groupWinnersReady={groupWinnersReady}
                faseLocked={systemConfig.fase_eliminatorias_bloqueada}
              />
            )}

            {activeTab === 'leaderboard' && (
              /* En el hosting central, Leaderboard muestra a todos los participantes reales de la base de datos */
              <div className="fade-in glass-card">
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 className="gradient-text" style={{ fontWeight: 800, fontSize: '1.35rem' }}>📊 Tabla de Posiciones General</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Clasificación de todos los participantes de la quiniela. Los puntos se calculan en base a los marcadores reales.
                  </p>
                </div>

                <div className="leaderboard-container-scroll">
                  <div className="leaderboard-list">
                    <div className="leaderboard-row header">
                      <div className="rank-cell">Pos</div>
                      <div className="name-cell" style={{ paddingLeft: '0.5rem' }}>Participante</div>
                      <div>Pronósticos</div>
                      <div>Aciertos (Ex/Sm)</div>
                      <div className="points-cell">Puntos</div>
                    </div>

                    {leaderboard
                      .filter(row => (row.id_tipo_usuario || 2) === (user?.id_tipo_usuario || 2))
                      .map((row, index) => {
                        const isRank1 = index === 0;
                        const isRank2 = index === 1;
                        const isRank3 = index === 2;
                        const isCurrentUser = row.id === user?.id;

                        return (
                          <div
                            key={row.id}
                            className={`leaderboard-row ${isCurrentUser ? 'highlight' : ''}`}
                            style={{ borderLeft: isCurrentUser ? '3px solid var(--color-primary)' : '1px solid var(--border-color)' }}
                          >
                            <div className={`rank-cell ${isRank1 ? 'top-1' : isRank2 ? 'top-2' : isRank3 ? 'top-3' : ''}`}>
                              {isRank1 ? '🥇' : isRank2 ? '🥈' : isRank3 ? '🥉' : `${index + 1}`}
                            </div>

                            <div className="name-cell">
                              <div className="profile-avatar" style={{
                                width: '24px',
                                height: '24px',
                                fontSize: '0.75rem',
                                background: isCurrentUser
                                  ? 'linear-gradient(135deg, var(--color-primary), var(--color-info))'
                                  : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1))'
                              }}>
                                {row.name.charAt(0)}
                              </div>
                              <div>
                                <span style={{ fontWeight: isCurrentUser ? '800' : '600' }}>{row.name}</span>
                                {isCurrentUser && <span style={{ marginLeft: '0.4rem', fontSize: '0.6rem', color: 'var(--color-primary)', fontWeight: '700' }}>(Tú)</span>}
                              </div>
                            </div>

                            <div>{row.predictionsCount} / 104</div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{row.exactHits}</span>
                              {' / '}
                              <span style={{ color: 'var(--color-info)', fontWeight: 600 }}>{row.outcomeHits}</span>
                            </div>

                            <div className="points-cell">{row.points}</div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && isAdmin && (
              <AdminPanel
                realGroupMatches={realGroupMatches}
                realKnockoutStage={realKnockoutStage}
                teams={initialTeams}
                onRealMatchScoreChange={handleRealMatchScoreChange}
                onRealKnockoutScoreChange={handleRealKnockoutScoreChange}
                onAutoSimulateRealResults={handleAutoSimulateRealResults}
                onResetRealResults={handleResetRealResults}
                token={token}
                currentUser={user}
                showToast={showToast}
                config={systemConfig}
                onReloadConfig={async () => {
                  try {
                    const configRes = await fetch(`${API_BASE_URL}/config`);
                    if (configRes.ok) {
                      const configData = await configRes.json();
                      setSystemConfig(configData);
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                onRealKnockoutTeamChange={handleRealKnockoutTeamChange}
                onRealKnockoutPenaltiesChange={handleRealKnockoutPenaltiesChange}
              />
            )}
          </>
        )}
      </main>

      {/* Barra Flotante de Guardado de Cambios (Excelente Micro-interacción!) */}
      {unsavedChanges && !loading && (
        <div className="fade-in" style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--color-primary)', boxShadow: '0 0 20px rgba(0, 255, 135, 0.3)', padding: '0.85rem 1.5rem', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1000, backdropFilter: 'blur(10px)' }}>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
            ⚠️ Tienes cambios sin guardar en tu Quiniela
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleDiscardChanges}
              disabled={saving}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: 'var(--text-primary)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              🗑️ Descartar
            </button>
            <button
              className="primary-btn"
              onClick={handleSavePredictions}
              disabled={saving}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              {saving ? 'Guardando...' : '💾 Guardar en Base de Datos'}
            </button>
          </div>
        </div>
      )}

      {/* Pie de página */}
      <footer style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        <p>Quiniela Grupo Giraud Premium © 2026. ⚽🚀📦</p>
      </footer>

      {/* Modal Premium de Confirmación de Descarte */}
      {showDiscardModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            background: 'var(--card-bg, rgba(30, 41, 59, 0.95))',
            border: '1px solid rgba(255, 0, 85, 0.3)',
            boxShadow: '0 10px 40px rgba(255, 0, 85, 0.15)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            color: 'var(--text-primary)'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🗑️</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-danger, #ff0055)' }}>
              ¿Descartar cambios?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Se perderán todos los marcadores que modificaste y se restaurarán los últimos pronósticos guardados en la base de datos.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                onClick={() => setShowDiscardModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-primary)',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setShowDiscardModal(false);
                  await fetchData();
                  showToast('🗑️ Cambios descartados. Se han restaurado tus pronósticos guardados.', 'info');
                }}
                style={{
                  background: 'var(--color-danger, #ff0055)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 0, 85, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                Sí, Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renderizado de Notificaciones Flotantes (Toasts) */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span>{toast.type === 'success' ? '✔️' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
