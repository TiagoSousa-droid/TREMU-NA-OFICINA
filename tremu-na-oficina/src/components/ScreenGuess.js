import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ScreenGuess.module.css';
import CameraView from './CameraView';
 
const TIMER_SECONDS = 90;
const MAX_ROWS = 6;
const KEYBOARD_ROWS = ['QWERTYUIOP'.split(''), 'ASDFGHJKL'.split(''), 'ZXCVBNM'.split('')];
 
function evaluateRow(attempt, word) {
  return attempt.map((letter, i) => {
    if (!letter) return 'empty';
    if (letter === word[i]) return 'correct';
    if (word.includes(letter)) return 'present';
    return 'absent';
  });
}
 
export default function ScreenGuess({ word, round, totalRounds, onResult }) {
  const wordLetters = word.w.split('');
  const wordLen = wordLetters.length;
 
  const [grid, setGrid] = useState(() => Array.from({ length: MAX_ROWS }, () => Array(wordLen).fill('')));
  const [rowStates, setRowStates] = useState(() => Array(MAX_ROWS).fill(null));
  const [curRow, setCurRow] = useState(0);
  const [curCol, setCurCol] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shake, setShake] = useState(false);
  const [mode, setMode] = useState('camera');
  const [keyColors, setKeyColors] = useState({});
  const [done, setDone] = useState(false);
 
  const finishedRef = useRef(false);
  const curRowRef = useRef(0);
  const curColRef = useRef(0);
  const gridRef = useRef(grid);
 
  useEffect(() => { curRowRef.current = curRow; }, [curRow]);
  useEffect(() => { curColRef.current = curCol; }, [curCol]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
 
  const finishRound = useCallback((isWon) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setDone(true);
    const bonus = isWon && timeLeft > 45 ? 5 : 0;
    const base = isWon ? (hintUsed ? 5 : 10) : 0;
    onResult({ won: isWon, pts: base + bonus, hintUsed });
  }, [timeLeft, hintUsed, onResult]);
 
  useEffect(() => {
    if (timeLeft <= 0) { finishRound(false); return; }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, finishRound]);
 
  const submitRow = useCallback((rowIndex, rowLetters) => {
    const states = evaluateRow(rowLetters, wordLetters);
    setRowStates(rs => { const n = [...rs]; n[rowIndex] = states; return n; });
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
    if (rowIndex + 1 >= MAX_ROWS) { setTimeout(() => finishRound(false), 400); return; }
    setCurRow(rowIndex + 1);
    setCurCol(0);
  }, [wordLetters, finishRound]);
 
  // Câmara: recebe letra detetada
  const handleLetterDetected = useCallback((letter) => {
    if (finishedRef.current) return;
    const row = curRowRef.current;
    const col = curColRef.current;
    if (col >= wordLen) return;
 
    const newGrid = gridRef.current.map(r => [...r]);
    newGrid[row][col] = letter;
    setGrid(newGrid);
    gridRef.current = newGrid;
 
    const nextCol = col + 1;
    curColRef.current = nextCol;
    setCurCol(nextCol);
 
    if (nextCol === wordLen) {
      setTimeout(() => submitRow(curRowRef.current, newGrid[curRowRef.current]), 300);
    }
  }, [wordLen, submitRow]);
 
  // Teclado manual
  const selectManual = (letter) => {
    if (finishedRef.current || curCol >= wordLen) return;
    const newGrid = grid.map(r => [...r]);
    newGrid[curRow][curCol] = letter;
    setGrid(newGrid);
    setCurCol(c => c + 1);
  };
 
  const handleBackspace = () => {
    if (curCol === 0) return;
    const newGrid = grid.map(r => [...r]);
    newGrid[curRow][curCol - 1] = '';
    setGrid(newGrid);
    setCurCol(c => c - 1);
  };
 
  const handleEnter = () => {
    if (curCol < wordLen) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    submitRow(curRow, grid[curRow]);
  };
 
  const pct = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor = timeLeft > 60 ? '#4ecdc4' : timeLeft > 30 ? '#f9ca24' : '#ff6b6b';
  const targetLetter = wordLetters[curCol] ?? wordLetters[wordLen - 1];
 
  return (
    <div className={styles.container}>
 
      {/* Barra superior */}
      <div className={styles.topBar}>
        <span className={styles.roundBadge}>{round}/{totalRounds}</span>
        <div className={styles.timerWrap}>
          <span className={styles.timerNum} style={{ color: timerColor }}>{timeLeft}s</span>
          <div className={styles.timerBar}>
            <div className={styles.timerFill} style={{ width: `${pct}%`, background: timerColor }} />
          </div>
        </div>
        <button className={styles.modeToggle}
          onClick={() => setMode(m => m === 'camera' ? 'manual' : 'camera')}>
          {mode === 'camera' ? '⌨️' : '📷'}
        </button>
      </div>
 
      {showHint && <div className={styles.hintBox}>💡 {word.h}</div>}
 
      {/* Grelha Termo */}
      <div className={`${styles.grid} ${shake ? styles.shake : ''}`}
           style={{ '--cols': wordLen }}>
        {grid.map((row, ri) => (
          <div key={ri} className={styles.row}>
            {row.map((letter, ci) => {
              const submitted = rowStates[ri] !== null;
              let state = 'empty';
              if (submitted) {
                state = rowStates[ri][ci];
              } else if (ri === curRow && ci < curCol) {
                state = 'filled';
              } else if (ri === curRow && ci === curCol) {
                state = 'active';
              }
              return (
                <div key={ci} className={`${styles.cell} ${styles[state]}`}>
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>
 
      {/* Câmara */}
      {mode === 'camera' && !done && (
        <div className={styles.cameraWrap}>
          <div className={styles.turnLabel}>
            🎯 Letra <strong>{curCol + 1}/{wordLen}</strong> — forma com o corpo!
          </div>
          <CameraView
            targetLetter={targetLetter}
            onLetterDetected={handleLetterDetected}
            active={true}
            playerNum={curCol + 1}
          />
        </div>
      )}
 
      {/* Teclado manual */}
      {mode === 'manual' && !done && (
        <div className={styles.keyboard}>
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className={styles.keyRow}>
              {ri === 2 && <button className={`${styles.key} ${styles.wide}`} onClick={handleEnter}>↵</button>}
              {row.map(k => (
                <button key={k}
                  className={`${styles.key} ${keyColors[k] ? styles[`k_${keyColors[k]}`] : ''}`}
                  onClick={() => selectManual(k)}>{k}</button>
              ))}
              {ri === 2 && <button className={`${styles.key} ${styles.wide}`} onClick={handleBackspace}>⌫</button>}
            </div>
          ))}
        </div>
      )}
 
      {/* Ações */}
      <div className={styles.actions}>
        <button className={styles.hintBtn}
          onClick={() => { setHintUsed(true); setShowHint(true); }}
          disabled={hintUsed}>
          {hintUsed ? '💡 Dica usada' : '💡 Dica (−5 pts)'}
        </button>
        <button className={styles.skipBtn} onClick={() => finishRound(false)}>✕ Passar</button>
      </div>
    </div>
  );
}
 