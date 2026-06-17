import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ScreenGuess.module.css';
import CameraView from './CameraView';
import LetterPoseGuide from './LetterPoseGuide';

/* ============================================================
   ScreenGuess.js
   ------------------------------------------------------------
   Este é o ecrã principal do jogo: aqui os 4 jogadores, um a
   um, têm de formar com o corpo a letra correspondente à sua
   posição na palavra. A câmara (CameraView) tenta reconhecer
   a letra automaticamente; também há um modo manual (teclado)
   como alternativa.

   Estado mais importante:
     guess -> array com as 4 letras já adivinhadas, ex: ['C','A','','']
     slot  -> índice (0-3) do jogador/letra da vez
     timeLeft -> contagem decrescente do temporizador (90s)

   Quando `slot` chega a 4, significa que as 4 letras foram
   formadas corretamente -> a ronda termina com vitória.
   Se o tempo acabar antes disso -> a ronda termina com derrota.
   ============================================================ */

const TIMER_SECONDS = 90;                 // duração do temporizador, em segundos
const KEYBOARD_ROWS = ['QWERTYUIOP'.split(''), 'ASDFGHJKL'.split(''), 'ZXCVBNM'.split('')];

export default function ScreenGuess({ word, round, totalRounds, onResult }) {
  // ── Estado do ecrã ───────────────────────────────────────────
  const [guess,       setGuess]      = useState(['', '', '', '']); // letras já confirmadas
  const [slot,        setSlot]       = useState(0);                 // letra/jogador da vez (0-3)
  const [timeLeft,    setTimeLeft]   = useState(TIMER_SECONDS);      // segundos restantes
  const [hintUsed,    setHintUsed]   = useState(false);              // se a dica já foi pedida
  const [showHint,    setShowHint]   = useState(false);              // se a dica está visível
  const [wrongFlash,  setWrongFlash] = useState(false);              // animação de "errado"
  const [mode,        setMode]       = useState('camera');           // 'camera' | 'manual'

  // ── Refs auxiliares ──────────────────────────────────────────
  // finishedRef evita que a ronda termine mais do que uma vez
  // (por exemplo, o temporizador chegar a 0 ao mesmo tempo que
  // a última letra é confirmada).
  const finishedRef   = useRef(false);
  // slotRef guarda o valor atual de `slot` numa ref, para o
  // callback da câmara (handleLetterDetected) NUNCA usar um
  // valor antigo/desatualizado (problema de "closures" no React).
  const slotRef       = useRef(0);

  // Mantém slotRef sempre igual a slot
  useEffect(() => { slotRef.current = slot; }, [slot]);

  // ── Termina a ronda (chamado quando ganha ou quando o tempo acaba) ──
  // useCallback garante que esta função não muda a cada render,
  // o que é importante porque é usada dentro do useEffect do timer.
  const finishRound = useCallback((isWon) => {
    if (finishedRef.current) return;     // já tinha terminado -> ignora
    finishedRef.current = true;

    // Cálculo de pontos:
    //  - 10 pontos base se ganhou sem usar dica, 5 se usou dica
    //  - +5 pontos extra ("bónus") se ainda restava mais de 45s
    //  - 0 pontos se não ganhou
    const bonus = isWon && timeLeft > 45 ? 5 : 0;
    const base  = isWon ? (hintUsed ? 5 : 10) : 0;
    onResult({ won: isWon, pts: base + bonus, hintUsed });
  }, [timeLeft, hintUsed, onResult]);

  // ── Temporizador: conta de 1 em 1 segundo ─────────────────────
  // Sempre que `timeLeft` muda, este efeito corre de novo:
  //  - se chegou a 0, termina a ronda como "derrota"
  //  - caso contrário, agenda um setTimeout de 1s que decresce timeLeft
  useEffect(() => {
    if (timeLeft <= 0) { finishRound(false); return; }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id); // limpa o intervalo anterior antes de criar outro
  }, [timeLeft, finishRound]);

  // Pequena animação de "tremer" quando se escolhe uma letra errada (modo manual)
  const flashWrong = () => {
    setWrongFlash(true);
    setTimeout(() => setWrongFlash(false), 500);
  };

  // ── Câmara: letra confirmada pela pose do corpo ───────────────
  // O CameraView mostra sempre a letra-alvo do `slot` atual, e
  // chama esta função quando a pessoa em frente à câmara mantém
  // essa pose durante tempo suficiente. Como a letra já está
  // confirmada como correta pela própria CameraView, aqui só
  // precisamos de "avançar" o jogo.
  const handleLetterDetected = useCallback(() => {
    if (finishedRef.current) return;
    const cur = slotRef.current;
    if (cur >= 4) return;          // já tinham sido encontradas as 4 letras

    const letter = word.w[cur];    // letra correta para esta posição
    // Atualiza o array de letras adivinhadas, na posição `cur`
    setGuess(g => { const n = [...g]; n[cur] = letter; return n; });

    // Avança para a próxima letra/jogador
    setSlot(next => {
      const nxt = cur + 1;
      if (nxt === 4) {
        // Encontrou as 4 letras -> espera 0.6s (para o jogador ver o resultado)
        // e só depois termina a ronda como "vitória"
        setTimeout(() => finishRound(true), 600);
      }
      return nxt;
    });
  }, [word, finishRound]);

  // ── Teclado manual (alternativa à câmara) ─────────────────────
  const selectManual = (letter) => {
    if (finishedRef.current || slot >= 4) return;
    if (letter === word.w[slot]) {
      // Letra certa -> regista e avança, igual ao fluxo da câmara
      setGuess(g => { const n = [...g]; n[slot] = letter; return n; });
      const nxt = slot + 1;
      setSlot(nxt);
      if (nxt === 4) setTimeout(() => finishRound(true), 600);
    } else {
      // Letra errada -> apenas mostra a animação de erro
      flashWrong();
    }
  };

  // Percentagem do tempo restante (para a barra de progresso)
  const pct = (timeLeft / TIMER_SECONDS) * 100;
  // Cor do temporizador muda conforme o tempo vai acabando
  const timerColor = timeLeft > 60 ? 'var(--teal)' : timeLeft > 30 ? 'var(--amber)' : 'var(--coral)';

  return (
    <div className={styles.container}>

      {/* ── Barra superior: ronda atual, temporizador e botão câmara/teclado ── */}
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

      {/* ── 4 caixas mostrando o progresso da palavra (uma por letra/jogador) ── */}
      <div className={`${styles.slotsRow} ${wrongFlash ? styles.wrongAnim : ''}`}>
        {guess.map((l, i) => {
          // Estado de cada caixa: já encontrada / é a vez desta / ainda não chegou a vez
          const state = i < slot ? 'correct' : i === slot ? 'active' : 'pending';
          return (
            <div key={i} className={`${styles.slot} ${styles[state]}`}>
              <span className={styles.slotNum}>{i + 1}</span>
              <span className={styles.slotLetter}>{l || (state === 'active' ? '?' : '')}</span>
              <span className={styles.slotPlayer}>J{i + 1}</span>
            </div>
          );
        })}
      </div>

      {/* ── Instrução: de quem é a vez e que letra deve formar ── */}
      {slot < 4 && (
        <div className={styles.playerTurn}>
          <LetterPoseGuide letter={word.w[slot]} size={84} />
          <div className={styles.playerTurnText}>
            🎯 <strong>Jogador {slot + 1}</strong> — forma a letra{' '}
            <span className={styles.bigLetter}>{word.w[slot]}</span> com o teu corpo
          </div>
        </div>
      )}

      {/* ── Dica (mostrada só depois de pedida) ── */}
      {showHint && <div className={styles.hintBox}>💡 {word.h}</div>}

      {/* ── MODO CÂMARA: mostra a câmara enquanto faltarem letras ── */}
      {mode === 'camera' && slot < 4 && (
        <div className={styles.cameraWrap}>
          {/* Tira de progresso com as 4 letras: feitas / atual / por fazer */}
          <div className={styles.letterProgress}>
            {word.w.split('').map((l, i) => (
              <div key={i} className={`${styles.lp} ${i < slot ? styles.lpDone : i === slot ? styles.lpActive : styles.lpPending}`}>
                <span className={styles.lpNum}>J{i + 1}</span>
                <span className={styles.lpLetter}>{i <= slot ? l : '?'}</span>
              </div>
            ))}
          </div>

          {/* Câmara única — a letra-alvo (targetLetter) atualiza automaticamente
              sempre que `slot` muda, porque é passada como prop. */}
          <CameraView
            targetLetter={word.w[slot]}
            onLetterDetected={handleLetterDetected}
            active={true}
            playerNum={slot + 1}
          />
        </div>
      )}

      {/* Mensagem final quando as 4 letras já foram todas reconhecidas */}
      {mode === 'camera' && slot >= 4 && (
        <div className={styles.allDone}>🎉 Todas as letras reconhecidas!</div>
      )}

      {/* ── MODO MANUAL: teclado QWERTY para escolher letras à mão ── */}
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

      {/* ── Botões de ação: pedir dica ou passar a ronda ── */}
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
