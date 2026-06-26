import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ScreenGuess.module.css';
import CameraView from './CameraView';
import LetterPoseGuide from './LetterPoseGuide';

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function ScreenGuess({ word, round, totalRounds, onResult }) {
  const [guess, setGuess] = useState(['', '', '', '']);
  const [slot, setSlot] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wrongLetter, setWrongLetter] = useState(null);
  const [attempts, setAttempts] = useState([]);

  const finishedRef = useRef(false);
  const slotRef = useRef(0);

  useEffect(() => { slotRef.current = slot; }, [slot]);

  const finishRound = useCallback((isWon) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const base = isWon ? (hintUsed ? 5 : 10) : 0;
    onResult({ won: isWon, pts: base, hintUsed });
  }, [hintUsed, onResult]);

  const handleLetterDetected = useCallback(() => {
    if (finishedRef.current) return;
    const cur = slotRef.current;
    if (cur >= 4) return;
    const letter = word.w[cur];
    setGuess(g => { const n = [...g]; n[cur] = letter; return n; });
    setSlot(() => {
      const nxt = cur + 1;
      if (nxt === 4) {
        setAttempts(a => [...a, word.w.split('')]);
        setTimeout(() => finishRound(true), 600);
      }
      return nxt;
    });
  }, [word, finishRound]);

  if (wrongLetter) {
    return (
      <div className={styles.container}>
        <div className={styles.wrongScreen}>
          <div className={styles.wrongEmoji}>🤡</div>
          <h2 className={styles.wrongTitle}>womp womp...</h2>
          <p className={styles.wrongSub}>Jogador {slot + 1} a letra estava errada!</p>
          <div className={styles.wordRow}>
            {word.w.split('').map((l, i) => (
              <div key={i} className={`${styles.wrongLetterBox} ${i < slot ? styles.letterWon : i === slot ? styles.letterLost : styles.letterPending}`}>
                <span className={styles.letterP}>P{i + 1}</span>
                <span className={styles.letterChar}>{i < slot ? '✓' : i === slot ? '✗' : '?'}</span>
              </div>
            ))}
          </div>
          <div className={styles.wrongActions}>
            <button className={styles.wrongRetryBtn} onClick={() => { setWrongLetter(null); setSlot(0); setGuess(['','','','']); }}>🔄 Tentar outra vez</button>
            <button className={styles.wrongSkipBtn} onClick={() => finishRound(false)}>✕ Passar ronda</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <span className={styles.roundBadge}>{round}/{totalRounds}</span>
      </div>

      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, ri) => {
          const isPast = ri < attempts.length;
          const isCurrent = ri === attempts.length && slot < 4;
          return (
            <div key={ri} className={styles.gridRow}>
              {Array.from({ length: 4 }).map((_, ci) => {
                let state = 'empty';
                let letter = '';
                if (isPast) {
                  state = 'correct';
                  letter = attempts[ri][ci];
                } else if (isCurrent) {
                  if (ci < slot) { state = 'filled'; letter = word.w[ci]; }
                  else if (ci === slot) { state = 'active'; }
                }
                return (
                  <div key={ci} className={`${styles.cell} ${styles[state]}`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {slot < 4 && (
        <div className={styles.playerTurn}>
          <div className={styles.playerTurnText}>
            🎯 <strong>Jogador {slot + 1}</strong> — forma a tua letra com o corpo!
          </div>
        </div>
      )}

      {showHint && <div className={styles.hintBox}>💡 {word.h}</div>}

      {slot < 4 && (
        <div className={styles.cameraWrap}>
          <CameraView
            targetLetter={word.w[slot]}
            onLetterDetected={handleLetterDetected}
            active={true}
            playerNum={slot + 1}
          />
        </div>
      )}

      {slot >= 4 && <div className={styles.allDone}>😎 Todas as letras reconhecidas!</div>}

      <div className={styles.actions}>
        <button className={styles.hintBtn}
          onClick={() => { setHintUsed(true); setShowHint(true); }}
          disabled={hintUsed}>
          {hintUsed ? '💡 Dica usada' : '💡 Dica (−5 pts)'}
        </button>
        <button className={styles.skipBtn} onClick={() => finishRound(false)}>✕ Passar</button>
      </div>

      <div className={styles.refSection}>
        <div className={styles.refTitle}>📖 Guia de poses A–Z</div>
        <div className={styles.refGrid}>
          {ALL_LETTERS.map((letter) => (
            <div key={letter} className={styles.refItem}>
              <LetterPoseGuide letter={letter} size={60} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}