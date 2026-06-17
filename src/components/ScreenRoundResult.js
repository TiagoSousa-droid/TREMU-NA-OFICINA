import React from 'react';
import styles from './ScreenRoundResult.module.css';

/* ============================================================
   ScreenRoundResult.js
   ------------------------------------------------------------
   Mostra o resultado de UMA ronda:
     - Se ganhou (🎉) ou não (😅), com a palavra revelada.
     - Os pontos de cada jogador até agora.
     - "Pontinhos" (dots) a mostrar o progresso pelas rondas.
   O botão final muda de texto: "Próxima Ronda" ou,
   se for a última ronda, "Ver Resultados Finais".
   ============================================================ */

export default function ScreenRoundResult({
  won,
  pts,
  word,
  scores,
  round,
  totalRounds,
  onNext,
}) {
  // Esta foi a última ronda do jogo?
  const isLast = round >= totalRounds;

  return (
    <div className={styles.container}>
      <div className={styles.resultCard}>
        <div className={styles.emoji}>{won ? '🎉' : '😅'}</div>
        <h2 className={styles.resultTitle}>
          {won ? 'Palavra correta!' : 'Não foi desta vez...'}
        </h2>
        <p className={styles.resultSub}>
          {won
            ? `+${pts} pontos para cada jogador!`
            : `A palavra era: ${word.w}`}
        </p>

        <div className={styles.wordRow}>
          {word.w.split('').map((l, i) => (
            <div
              key={i}
              className={`${styles.letterBox} ${won ? styles.letterWon : styles.letterLost}`}
            >
              <span className={styles.letterP}>P{i + 1}</span>
              <span className={styles.letterChar}>{l}</span>
            </div>
          ))}
        </div>

        <p className={styles.wordDef}>{word.h}</p>
      </div>

      {/* Pontuação acumulada de cada um dos 4 jogadores */}
      <div className={styles.scoreCard}>
        <div className={styles.scoreTitle}>Pontuação total</div>
        <div className={styles.scoreGrid}>
          {scores.map((s, i) => (
            <div key={i} className={styles.scoreItem}>
              <div className={styles.scoreNum}>{s}</div>
              <div className={styles.scoreLabel}>Jogador {i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pontinhos: um por ronda. Cinzento = ainda não jogado,
          azul = já jogado, azul claro maior = ronda atual. */}
      <div className={styles.dots}>
        {Array.from({ length: totalRounds }, (_, i) => (
          <div
            key={i}
            className={`${styles.dot} ${
              i < round ? styles.dotDone : i === round ? styles.dotCurrent : ''
            }`}
          />
        ))}
      </div>

      <button className={styles.nextBtn} onClick={onNext}>
        {isLast ? '🏁 Ver Resultados Finais' : '▶ Próxima Ronda'}
      </button>
    </div>
  );
}
