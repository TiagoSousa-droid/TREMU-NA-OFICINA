import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ScreenGuess.module.css';
import CameraView from './CameraView';
 
const TIMER_SECONDS = 90;
const MAX_ATTEMPTS  = 6;
const KEYBOARD_ROWS = ['QWERTYUIOP'.split(''), 'ASDFGHJKL'.split(''), 'ZXCVBNM'.split('')];
 
/* Calcula o estado de cada célula de uma tentativa já submetida */
function evaluateRow(attempt, word) {
  return attempt.map((letter, i) => {
    if (!letter) return 'empty';
    if (letter === word[i]) return 'correct';          // verde
    if (word.includes(letter)) return 'present';       // amarelo
    return 'absent';                                    // cinzento
  });
}
 
export default function ScreenGuess({ word, round, totalRounds, onResult }) {
  const wordLetters = word.w.split('');              // ex: ['B','A','N','C','A']
  const wordLen     = wordLetters.length;            // 4 ou 5
 
  // Grelha: MAX_ATTEMPTS linhas × wordLen colunas
  const emptyRow  = () => Array(wordLen).fill('');
  const [grid,       setGrid]       = useState(() => Array.from({ length: MAX_ATTEMPTS }, emptyRow));
  const [rowStates,  setRowStates]  = useState(() => Array(MAX_ATTEMPTS).fill(null)); // null | array de estados
  const [curRow,     setCurRow]     = useState(0);
  const [curCol,     setCurCol]     = useState(0);   // slot dentro da linha atual
  const [timeLeft,   setTimeLeft]   = useState(TIMER_SECONDS);
  const [hintUsed,   setHintUsed]   = useState(false);
  const [showHint,   setShowHint]   = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [mode,       setMode]       = useState('camera');
  const [keyColors,  setKeyColors]  = useState({});  // mapa letra → estado (melhor)
 
  const finishedRef = useRef(false);
  const curRowRef   = useRef(0);
  const curColRef   = useRef(0);
 
  useEffect(() => { curRowRef.current = curRow; }, [curRow]);
  useEffect(() => { curColRef.current = curCol; }, [curCol]);
 
  /* ── Finalizar ronda ── */
  const finishRound = useCallback((isWon) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const bonus = isWon && timeLeft > 45 ? 5 : 0;
    const base  = isWon ? (hintUsed ? 5 : 10) : 0;
    onResult({ won: isWon, pts: base + bonus, hintUsed });
  }, [timeLeft, hintUsed, onResult]);
 
  /* ── Timer ── */
  useEffect(() => {
    if (timeLeft <= 0) { finishRound(false); return; }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, finishRound]);
 
  /* ── Submete a linha atual ── */
  const submitRow = useCallback((rowIndex, rowLetters) => {
    const states = evaluateRow(rowLetters, wordLetters);
    setRowStates(rs => { const n = [...rs]; n[rowIndex] = states; return n; });
 
    // Atualiza cores do teclado (melhor estado ganha)
    setKeyColors(kc => {
      const ORDER = { correct: 3, present: 2, absent: 1 };
      const next = { ...kc };
      rowLetters.forEach((l, i) => {
        if (!l) return;
        const st = states[i];
        if ((ORDER[st] || 0) > (ORDER[next[l]] || 0)) next[l] = st;
      });
      return next;
    });
 
    const won = states.every(s => s === 'correct');
    if (won) { setTimeout(() => finishRound(true), 400); return; }
    if (rowIndex + 1 >= MAX_ATTEMPTS) { setTimeout(() => finishRound(false), 400); return; }
 
    setCurRow(rowIndex + 1);
    setCurCol(0);
  }, [wordLetters, finishRound]);
 
  /* ── Câmara: letra detetada ── */
  const handleLetterDetected = useCallback((detectedLetter) => {
    if (finishedRef.current) return;
    const row = curRowRef.current;
    const col = curColRef.current;
    if (col >= wordLen) return;
 
    // Coloca a letra na célula
    setGrid(g => {
      const n = g.map(r => [...r]);
      n[row][col] = detectedLetter;
      return n;
    });
 
    const nextCol = col + 1;
    curColRef.current = nextCol;
    setCurCol(nextCol);
 
    if (nextCol === wordLen) {
      // Linha completa — submete automaticamente após breve pausa
      setTimeout(() => {
        setGrid(g => {
          submitRow(curRowRef.current - 1 < row ? row : curRowRef.current, g[row]);
          return g;
        });
      }, 300);
    }
  }, [wordLen, submitRow]);
 
  // Corrige: quando curCol chega a wordLen no estado, submete
  useEffect(() => {
    if (curCol === wordLen && curRow < MAX_ATTEMPTS) {
      const row = curRow;
      setGrid(g => {
        submitRow(row, g[row]);
        return g;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curCol]);
 
  /* ── Teclado manual ── */
  const selectManual = (letter) => {
    if (finishedRef.current || curCol >= wordLen) return;
    setGrid(g => {
      const n = g.map(r => [...r]);
      n[curRow][curCol] = letter;
      return n;
    });
    setCurCol(c => c + 1);
  };
 
  const handleBackspace = () => {
    if (curCol === 0) return;
    const newCol = curCol - 1;
    setGrid(g => {
      const n = g.map(r => [...r]);
      n[curRow][newCol] = '';
      return n;
    });
    setCurCol(newCol);
  };
 
  const handleEnter = () => {
    if (curCol < wordLen) {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 500);
      return;
    }
    submitRow(curRow, grid[curRow]);
  };
 
  /* ── UI helpers ── */
  const pct = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor = timeLeft > 60 ? 'var(--teal)' : timeLeft > 30 ? 'var(--amber)' : 'var(--coral)';
  const finished = finishedRef.current;
  const targetLetter = wordLetters[curCol] ?? wordLetters[wordLen - 1];
 
  return (
    <div className={styles.container}>
 
      {/* ── Barra superior ── */}
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
 
      {/* ── Dica ── */}
      {showHint && <div className={styles.hintBox}>💡 {word.h}</div>}
 
      {/* ── Grelha estilo Termo ── */}
      <div className={`${styles.termoGrid} ${wrongFlash ? styles.wrongAnim : ''}`}
           style={{ '--word-len': wordLen }}>
        {grid.map((row, ri) => {
          const submitted = rowStates[ri] !== null;
          const isActive  = ri === curRow && !finished;
          return (
            <div key={ri} className={styles.termoRow}>
              {row.map((letter, ci) => {
                let cellState = 'empty';
                if (submitted) {
                  cellState = rowStates[ri][ci];
                } else if (isActive && ci < curCol) {
                  cellState = 'filled';
                } else if (isActive && ci === curCol) {
                  cellState = 'active';
                }
                return (
                  <div key={ci}
                    className={`${styles.termoCell} ${styles['cell_' + cellState]}`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
 
      {/* ── Indicador de turno (modo câmara) ── */}
      {mode === 'camera' && !finished && curCol < wordLen && (
        <div className={styles.playerTurn}>
          🎯 <strong>Letra {curCol + 1}/{wordLen}</strong> — forma a letra com o corpo!
        </div>
      )}
 
      {/* ── Câmara ── */}
      {mode === 'camera' && !finished && (
        <div className={styles.cameraWrap}>
          <CameraView
            targetLetter={targetLetter}
            onLetterDetected={handleLetterDetected}
            active={true}
            playerNum={curCol + 1}
          />
        </div>
      )}
 
      {/* ── Teclado manual ── */}
      {mode === 'manual' && !finished && (
        <div className={styles.keyboard}>
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className={styles.keyRow}>
              {ri === 2 && (
                <button className={`${styles.key} ${styles.keyWide}`} onClick={handleEnter}>↵</button>
              )}
              {row.map(k => {
                const kst = keyColors[k];
                return (
                  <button key={k}
                    className={`${styles.key} ${kst ? styles['key_' + kst] : ''}`}
                    onClick={() => selectManual(k)}>
                    {k}
                  </button>
                );
              })}
              {ri === 2 && (
                <button className={`${styles.key} ${styles.keyWide}`} onClick={handleBackspace}>⌫</button>
              )}
            </div>
          ))}
        </div>
      )}
 
      {/* ── Ações ── */}
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