import React, { useState, useEffect } from 'react';

const phases = [
  {
    id: 'mapping',
    name: 'MAPPING',
    caption: '見出し・要約を確認',
    detail: '章末のSummaryを先に読む',
    duration: 5 * 60,
    color: '#8b5cf6',
    number: '01'
  },
  {
    id: 'hacking',
    name: 'IMAGE HACK',
    caption: '図とキャプションだけを追う',
    detail: '本文は無視。指でなぞりながら',
    duration: 25 * 60,
    color: '#ec4899',
    number: '02',
    important: true
  },
  {
    id: 'scan',
    name: 'SCAN',
    caption: '本文から疑問点だけ拾う',
    detail: '太字キーワードの定義を確認',
    duration: 10 * 60,
    color: '#06b6d4',
    number: '03'
  },
  {
    id: 'recall',
    name: 'RECALL',
    caption: '白紙に図を再現する',
    detail: '書けるまで次に進まない',
    duration: 5 * 60,
    color: '#f59e0b',
    number: '04',
    important: true
  },
  {
    id: 'rest',
    name: 'REST',
    caption: '目を閉じる・スマホ禁止',
    detail: '脳を整理する時間',
    duration: 5 * 60,
    color: '#64748b',
    number: '05'
  }
];

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  return `${mins}:00`;
};

const soundOptions = [
  { id: 'bell', name: 'Bell', freq: 440, type: 'sine', duration: 0.3 },
  { id: 'chime', name: 'Chime', freq: 523.25, type: 'sine', duration: 0.5 },
  { id: 'beep', name: 'Beep', freq: 800, type: 'square', duration: 0.2 },
  { id: 'ding', name: 'Ding', freq: 659.25, type: 'triangle', duration: 0.4 },
  { id: 'alert', name: 'Alert', freq: 1000, type: 'sawtooth', duration: 0.25 }
];

export default function StudyTimer() {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(phases[0].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [selectedSound, setSelectedSound] = useState('bell');
  const [phaseDurations, setPhaseDurations] = useState(
    phases.map(p => p.duration)
  );
  const [wakeLock, setWakeLock] = useState(null);

  const currentPhase = phases[currentPhaseIndex];
  const currentPhaseDuration = phaseDurations[currentPhaseIndex];
  const totalDuration = phaseDurations.reduce((sum, d) => sum + d, 0);
  const elapsedBefore = phaseDurations.slice(0, currentPhaseIndex).reduce((sum, d) => sum + d, 0);
  const currentElapsed = currentPhaseDuration - timeRemaining;
  const totalElapsed = elapsedBefore + currentElapsed;

  // Wake Lock effect - keeps screen awake when timer is running
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isRunning) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
        }
      } catch (err) {
        console.log('Wake Lock error:', err);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock) {
        try {
          await wakeLock.release();
          setWakeLock(null);
        } catch (err) {
          console.log('Wake Lock release error:', err);
        }
      }
    };

    if (isRunning) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isRunning]);

  useEffect(() => {
    let interval;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeRemaining === 0) {
      playSound();
      if (currentPhaseIndex < phases.length - 1) {
        setCurrentPhaseIndex(prev => prev + 1);
        setTimeRemaining(phaseDurations[currentPhaseIndex + 1]);
      } else {
        setIsRunning(false);
        setSessionCount(prev => prev + 1);
        setCurrentPhaseIndex(0);
        setTimeRemaining(phaseDurations[0]);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, currentPhaseIndex, phaseDurations]);

  const playSound = (soundId = selectedSound) => {
    const sound = soundOptions.find(s => s.id === soundId) || soundOptions[0];
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = sound.freq;
    osc.type = sound.type;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
    osc.start();
    osc.stop(ctx.currentTime + sound.duration);
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setCurrentPhaseIndex(0);
    setTimeRemaining(phaseDurations[0]);
  };

  const goToPhase = (index) => {
    setCurrentPhaseIndex(index);
    setTimeRemaining(phaseDurations[index]);
  };

  const updatePhaseDuration = (index, minutes) => {
    const newDurations = [...phaseDurations];
    newDurations[index] = minutes * 60;
    setPhaseDurations(newDurations);
    if (index === currentPhaseIndex && !isRunning) {
      setTimeRemaining(minutes * 60);
    }
  };

  const prevPhase = () => {
    if (currentPhaseIndex > 0) goToPhase(currentPhaseIndex - 1);
  };

  const nextPhase = () => {
    if (currentPhaseIndex < phases.length - 1) goToPhase(currentPhaseIndex + 1);
  };

  const skipForward = () => {
    const newTime = Math.max(0, timeRemaining - 10);
    setTimeRemaining(newTime);
  };

  const skipBackward = () => {
    const newTime = Math.min(currentPhaseDuration, timeRemaining + 10);
    setTimeRemaining(newTime);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const progress = (currentElapsed / currentPhaseDuration) * 100;
  const totalProgress = (totalElapsed / totalDuration) * 100;

  const theme = {
    bg: isDarkMode ? '#09090b' : '#f8f9fa',
    cardBg: isDarkMode ? '#0f0f11' : '#ffffff',
    border: isDarkMode ? '#1a1a1f' : '#e5e7eb',
    text: isDarkMode ? '#fafafa' : '#1f2937',
    textMuted: isDarkMode ? '#a1a1aa' : '#6b7280',
    textDim: isDarkMode ? '#52525b' : '#9ca3af',
    controlBg: isDarkMode ? '#18181b' : '#f3f4f6',
    progressBg: isDarkMode ? '#18181b' : '#e5e7eb',
    sessionBg: isDarkMode ? '#18181b' : '#f3f4f6',
    sessionText: isDarkMode ? '#3f3f46' : '#9ca3af',
    playButtonBg: isDarkMode ? '#fafafa' : '#1f2937',
    playButtonText: isDarkMode ? '#09090b' : '#ffffff'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      color: theme.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      transition: 'background 0.3s ease, color 0.3s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1400px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Left: Main Player */}
        <div style={{
          background: theme.cardBg,
          borderRadius: '1.5rem',
          padding: '3rem',
          border: `1px solid ${theme.border}`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 0.3s ease, border 0.3s ease'
        }}>
          {/* Background accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: `linear-gradient(180deg, ${currentPhase.color}08 0%, transparent 100%)`,
            pointerEvents: 'none',
            transition: 'background 0.5s ease'
          }} />

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '2rem',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowTimeSettings(!showTimeSettings);
                  setShowSoundSettings(false);
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: `1px solid ${theme.border}`,
                  background: showTimeSettings ? currentPhase.color : theme.controlBg,
                  color: showTimeSettings ? (isDarkMode ? '#09090b' : '#ffffff') : theme.textDim,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </button>
              <button
                onClick={() => {
                  setShowSoundSettings(!showSoundSettings);
                  setShowTimeSettings(false);
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: `1px solid ${theme.border}`,
                  background: showSoundSettings ? currentPhase.color : theme.controlBg,
                  color: showSoundSettings ? (isDarkMode ? '#09090b' : '#ffffff') : theme.textDim,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </button>
              <button
                onClick={toggleTheme}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: `1px solid ${theme.border}`,
                  background: theme.controlBg,
                  color: theme.textDim,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                {isDarkMode ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
              <div style={{
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                color: theme.sessionText,
                background: theme.sessionBg,
                padding: '0.5rem 1rem',
                borderRadius: '2rem',
                transition: 'all 0.3s ease'
              }}>
                SESSION {sessionCount}
              </div>
            </div>
          </div>

          {/* Now Playing */}
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '1rem',
              marginBottom: '0.5rem'
            }}>
              <span style={{
                fontSize: '0.75rem',
                color: currentPhase.color,
                letterSpacing: '0.2em',
                fontWeight: 500
              }}>
                NOW PLAYING
              </span>
              {currentPhase.important && (
                <span style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  color: currentPhase.color,
                  border: `1px solid ${currentPhase.color}40`,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '0.25rem'
                }}>
                  IMPORTANT
                </span>
              )}
            </div>

            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: 600,
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.03em',
              lineHeight: 1.1
            }}>
              {currentPhase.name}
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: theme.textMuted,
              margin: '0 0 0.25rem 0'
            }}>
              {currentPhase.caption}
            </p>
            <p style={{
              fontSize: '0.85rem',
              color: theme.textDim,
              margin: 0
            }}>
              {currentPhase.detail}
            </p>
          </div>

          {/* Time Settings Panel */}
          {showTimeSettings && (
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: theme.controlBg,
              borderRadius: '1rem',
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                color: theme.textDim,
                textTransform: 'uppercase',
                marginBottom: '1rem'
              }}>
                Phase Duration
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      borderRadius: '0.5rem',
                      border: `1px solid ${theme.border}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: phase.color
                      }} />
                      <span style={{
                        fontSize: '0.85rem',
                        color: theme.text,
                        fontWeight: 500
                      }}>
                        {phase.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => updatePhaseDuration(index, Math.max(1, Math.floor(phaseDurations[index] / 60) - 1))}
                        disabled={phaseDurations[index] <= 60}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '0.375rem',
                          border: `1px solid ${theme.border}`,
                          background: phaseDurations[index] <= 60 ? 'transparent' : theme.progressBg,
                          color: phaseDurations[index] <= 60 ? theme.sessionText : theme.textMuted,
                          cursor: phaseDurations[index] <= 60 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        −
                      </button>
                      <span style={{
                        fontSize: '0.9rem',
                        color: theme.text,
                        fontVariantNumeric: 'tabular-nums',
                        minWidth: '50px',
                        textAlign: 'center',
                        fontWeight: 600
                      }}>
                        {Math.floor(phaseDurations[index] / 60)} min
                      </span>
                      <button
                        onClick={() => updatePhaseDuration(index, Math.floor(phaseDurations[index] / 60) + 1)}
                        disabled={phaseDurations[index] >= 3600}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '0.375rem',
                          border: `1px solid ${theme.border}`,
                          background: phaseDurations[index] >= 3600 ? 'transparent' : theme.progressBg,
                          color: phaseDurations[index] >= 3600 ? theme.sessionText : theme.textMuted,
                          cursor: phaseDurations[index] >= 3600 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sound Settings Panel */}
          {showSoundSettings && (
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: theme.controlBg,
              borderRadius: '1rem',
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                color: theme.textDim,
                textTransform: 'uppercase',
                marginBottom: '1rem'
              }}>
                Notification Sound
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {soundOptions.map(sound => (
                  <div
                    key={sound.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: selectedSound === sound.id ? `${currentPhase.color}15` : 'transparent',
                      borderRadius: '0.5rem',
                      border: `1px solid ${selectedSound === sound.id ? currentPhase.color : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setSelectedSound(sound.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${selectedSound === sound.id ? currentPhase.color : theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}>
                        {selectedSound === sound.id && (
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: currentPhase.color
                          }} />
                        )}
                      </div>
                      <span style={{
                        fontSize: '0.9rem',
                        color: selectedSound === sound.id ? theme.text : theme.textMuted,
                        fontWeight: selectedSound === sound.id ? 600 : 400
                      }}>
                        {sound.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound(sound.id);
                      }}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: theme.progressBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '0.5rem',
                        color: theme.textMuted,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Display */}
          <div style={{
            marginTop: '4rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: '10rem',
              fontWeight: 200,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: theme.text,
              transition: 'color 0.3s ease'
            }}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{
              height: '3px',
              background: theme.progressBg,
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${currentPhase.color}, ${currentPhase.color}aa)`,
                borderRadius: '2px',
                transition: 'width 0.3s linear',
                boxShadow: `0 0 20px ${currentPhase.color}50`
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              color: theme.sessionText,
              fontVariantNumeric: 'tabular-nums'
            }}>
              <span>{formatTime(currentElapsed)}</span>
              <span>{formatTime(currentPhaseDuration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={resetTimer}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: theme.textDim,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                fontSize: '0.8rem'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>

            <button
              onClick={skipBackward}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: 'none',
                background: theme.controlBg,
                color: theme.textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/>
              </svg>
            </button>

            <button
              onClick={prevPhase}
              disabled={currentPhaseIndex === 0}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: 'none',
                background: theme.controlBg,
                color: currentPhaseIndex === 0 ? theme.sessionText : theme.textMuted,
                cursor: currentPhaseIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>

            <button
              onClick={toggleTimer}
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                border: 'none',
                background: theme.playButtonBg,
                color: theme.playButtonText,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: isDarkMode ? '0 0 40px rgba(255,255,255,0.1)' : '0 0 40px rgba(0,0,0,0.1)'
              }}
            >
              {isRunning ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '3px' }}>
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <button
              onClick={nextPhase}
              disabled={currentPhaseIndex === phases.length - 1}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: 'none',
                background: theme.controlBg,
                color: currentPhaseIndex === phases.length - 1 ? theme.sessionText : theme.textMuted,
                cursor: currentPhaseIndex === phases.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z"/>
              </svg>
            </button>

            <button
              onClick={skipForward}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: 'none',
                background: theme.controlBg,
                color: theme.textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 19l7-7-7-7M6 19l7-7-7-7"/>
              </svg>
            </button>

            <div style={{ width: '48px' }} />
          </div>
        </div>

        {/* Right: Playlist */}
        <div style={{
          background: theme.cardBg,
          borderRadius: '1.5rem',
          border: `1px solid ${theme.border}`,
          overflow: 'hidden',
          transition: 'background 0.3s ease, border 0.3s ease'
        }}>
          {/* Total Progress Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: `1px solid ${theme.border}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <span style={{
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                color: theme.textDim,
                textTransform: 'uppercase'
              }}>
                Total Progress
              </span>
              <span style={{
                fontSize: '0.8rem',
                color: theme.textMuted,
                fontVariantNumeric: 'tabular-nums'
              }}>
                {formatTime(totalElapsed)} / {formatTime(totalDuration)}
              </span>
            </div>
            <div style={{
              height: '4px',
              background: theme.progressBg,
              borderRadius: '2px',
              overflow: 'hidden',
              display: 'flex'
            }}>
              {phases.map((phase, index) => {
                let phaseProgress = 0;
                if (index < currentPhaseIndex) phaseProgress = 100;
                else if (index === currentPhaseIndex) phaseProgress = progress;

                return (
                  <div
                    key={phase.id}
                    style={{
                      flex: phaseDurations[index],
                      height: '100%',
                      background: phaseProgress > 0
                        ? `linear-gradient(90deg, ${phase.color} ${phaseProgress}%, ${theme.progressBg} ${phaseProgress}%)`
                        : theme.progressBg,
                      transition: 'all 0.3s ease'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Playlist Header */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: `1px solid ${theme.border}`,
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            color: theme.sessionText,
            textTransform: 'uppercase'
          }}>
            Queue
          </div>

          {/* Playlist Items */}
          <div>
            {phases.map((phase, index) => {
              const isActive = index === currentPhaseIndex;
              const isPast = index < currentPhaseIndex;

              return (
                <div
                  key={phase.id}
                  onClick={() => goToPhase(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    background: isActive ? `${phase.color}08` : 'transparent',
                    borderLeft: `3px solid ${isActive ? phase.color : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isPast ? 0.4 : 1
                  }}
                >
                  {/* Number / Status */}
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isActive ? phase.color : theme.controlBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: isActive ? (isDarkMode ? '#09090b' : '#ffffff') : theme.textDim,
                    transition: 'all 0.2s ease'
                  }}>
                    {isPast ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : isActive && isRunning ? (
                      <div style={{
                        display: 'flex',
                        gap: '2px',
                        alignItems: 'flex-end',
                        height: '12px'
                      }}>
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            style={{
                              width: '2px',
                              background: isDarkMode ? '#09090b' : '#ffffff',
                              borderRadius: '1px',
                              animation: `equalizer 0.8s ease-in-out ${i * 0.2}s infinite`
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      phase.number
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.15rem'
                    }}>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? theme.text : theme.textMuted
                      }}>
                        {phase.name}
                      </span>
                      {phase.important && (
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: isPast ? theme.sessionText : phase.color
                        }} />
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: theme.textDim,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {phase.caption}
                    </div>
                  </div>

                  {/* Duration */}
                  <div style={{
                    fontSize: '0.8rem',
                    color: theme.sessionText,
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {formatDuration(phaseDurations[index])}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes equalizer {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      `}</style>
    </div>
  );
}
