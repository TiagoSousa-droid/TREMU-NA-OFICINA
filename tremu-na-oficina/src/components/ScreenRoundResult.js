cat > /workspaces/TREMU-NA-OFICINA/src/components/ScreenGuess.js << 'EOF'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ScreenGuess.module.css';
import CameraView from './CameraView';

const TIMER_SECONDS = 90;
const KEYBOARD_ROWS = ['QWERTYUIOP'.split(''), 'ASDFGHJKL'.split(''), 'ZXCVBNM'.split('')];

export default function ScreenGuess({ word, round, totalRounds, onResult }) {
  const [guess,      setGuess]    = useState(['', '', '', '']);
  const [slot,       setSlot]     = useState(0);
  const [timeLeft,   setTimeLeft] = useState(TIMER_SECONDS);
  const [hintUsed,   setHintUsed] = useState(false);
  const [showHint,   setShowHint] = useState(false);
  const [mode,       setMode]     = useState('camera');
  const [wrongLetter, setWrongLetter] = useState(null); // letra errada que o jogador meteu

  const finishedRef = useRef(false);
  const slotRef     = useRef(0);

  useEffect(() => { slotRef.current = slot; }, [slot]);

  const finishRound = useCallback((isWon) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const bonus = isWon && timeLeft > 45 ? 5 : 0;
    const base  = isWon ? (hintUsed ? 5 : 10) : 0;
    onResult({ won: isWon, pts: base + bonus, hintUsed });
  }, [timeLeft, hintUsed, onResult]);

  useEffect(() => {
    if (timeLeft <= 0) { finishRound(false); return; }
    if (wrongLetter) return; // pausa o timer enquanto mostra o ecrã de erro
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, finishRound, wrongLetter]);

  const handleLetterDetected = useCallback(() => {
    if (finishedRef.current) return;
    const cur = slotRef.current;
    if (cur >= 4) return;

    const letter = word.w[cur];
    setGuess(g => { const n = [...g]; n[cur] = letter; return n; });

    setSlot(() => {
      const nxt = cur + 1;
      if (nxt === 4) setTimeout(() => finishRound(true), 600);
      return nxt;
    });
  }, [word, finishRound]);

  const selectManual = (letter) => {
    if (finishedRef.current || slot >= 4 || wrongLetter) return;
    if (letter === word.w[slot]) {
      setGuess(g => { const n = [...g]; n[slot] = letter; return n; });
      const nxt = slot + 1;
      setSlot(nxt);
      if (nxt === 4) setTimeout(() => finishRound(true), 600);
    } else {
      // Mostra ecrã de erro com a letra errada
      setWrongLetter(letter);
    }
  };

  const pct = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor = timeLeft > 60 ? 'var(--teal)' : timeLeft > 30 ? 'var(--amber)' : 'var(--coral)';

  // ── Ecrã de letra errada ─────────────────────────────────
  if (wrongLetter) {
    return (
      <div className={styles.container}>
        <div className={styles.wrongScreen}>
          <div className={styles.wrongEmoji}>🤡</div>
          <h2 className={styles.wrongTitle}>womp womp...</h2>
          <p className={styles.wrongSub}>
            Jogador {slot + 1} meteu <strong>"{wrongLetter}"</strong> mas a letra era outra!
          </p>
          <div className={styles.wordRow}>
            {word.w.split('').map((l, i) => (
              <div key={i} className={`${styles.wrongLetterBox} ${i < slot ? styles.letterWon : i === slot ? styles.letterLost : styles.letterPending}`}>
                <span className={styles.letterP}>P{i + 1}</span>
                <span className={styles.letterChar}>{i < slot ? '✓' : i === slot ? '✗' : '?'}</span>
              </div>
            ))}
          </div>
          <div className={styles.wrongActions}>
            <button className={styles.wrongRetryBtn} onClick={() => setWrongLetter(null)}>
              🔄 Tentar outra vez
            </button>
            <button className={styles.wrongSkipBtn} onClick={() => finishRound(false)}>
              ✕ Passar ronda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      <div className={styles.topBar}>
        <span className={styles.roundBadge}>{round}/{totalRounds}</span>
        <div className={styles.timerWrap}>
          <span className={styles.timerNum} style={{ color: timerColor }}>{timeLeft}s</span>
          <div className={styles.timerBar}>
            <div className={styles.timerFill} style={{ width: `${pct}%`, background: timerColor }} />
          </div>
        </div>
        <button className={styles.modeToggle}
          onClick={() => setMode(m => m === 'camera' ? 'manual' : 'camera')}
          title="Alternar câmara / teclado">
          {mode === 'camera' ? '⌨️' : '📷'}
        </button>
      </div>

      <div className={styles.slotsRow}>
        {guess.map((l, i) => {
          const state = i < slot ? 'correct' : i === slot ? 'active' : 'pending';
          return (
            <div key={i} className={`${styles.slot} ${styles[state]}`}>
              <span className={styles.slotNum}>{i + 1}</span>
              <span className={styles.slotLetter}>
                {i < slot ? '✓' : i === slot ? '?' : ''}
              </span>
              <span className={styles.slotPlayer}>J{i + 1}</span>
            </div>
          );
        })}
      </div>

      {slot < 4 && (
        <div className={styles.playerTurn}>
          <div className={styles.playerTurnText}>
            🎯 <strong>Jogador {slot + 1}</strong> — forma a tua letra com o corpo!
            <div className={styles.playerTurnSub}>
              (O árbitro já te disse qual é — consulta o quadro de referência se precisares)
            </div>
          </div>
        </div>
      )}

      {showHint && <div className={styles.hintBox}>💡 {word.h}</div>}

      {mode === 'camera' && slot < 4 && (
        <div className={styles.cameraWrap}>
          <div className={styles.letterProgress}>
            {word.w.split('').map((l, i) => (
              <div key={i} className={`${styles.lp} ${i < slot ? styles.lpDone : i === slot ? styles.lpActive : styles.lpPending}`}>
                <span className={styles.lpNum}>J{i + 1}</span>
                <span className={styles.lpLetter}>{i < slot ? '✓' : i === slot ? '?' : '·'}</span>
              </div>
            ))}
          </div>
          <CameraView
            targetLetter={word.w[slot]}
            onLetterDetected={handleLetterDetected}
            active={true}
            playerNum={slot + 1}
          />
        </div>
      )}

      {mode === 'camera' && slot >= 4 && (
        <div className={styles.allDone}>😎 Todas as letras reconhecidas!</div>
      )}

      {mode === 'manual' && (
        <div className={styles.keyboard}>
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className={styles.keyRow}>
              {row.map(k => (
                <button key={k} className={styles.key} onClick={() => selectManual(k)}>{k}</button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.hintBtn}
          onClick={() => { setHintUsed(true); setShowHint(true); }}
          disabled={hintUsed}>
          {hintUsed ? '💡 Dica usada' : '💡 Dica (−5 pts)'}
        </button>
        <button className={styles.skipBtn} onClick={() => finishRound(false)}>
          ✕ Passar
        </button>
      </div>

    </div>
  );
}
EOF