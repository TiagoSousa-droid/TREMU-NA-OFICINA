import React, { useState } from 'react';
import styles from './ScreenReveal.module.css';

/* ============================================================
   ScreenReveal.js
   ------------------------------------------------------------
   Ecrã onde a palavra da ronda é revelada — mas só depois de
   se clicar em "Revelar Palavra" (assim só o árbitro vê o
   ecrã nesse momento, e não os jogadores).

   Depois de revelada, mostra também instruções: que jogador
   forma que letra, e a ordem obrigatória (1 → 2 → 3 → 4).

   O botão "Começar a Adivinhar" só fica ativo depois de a
   palavra ter sido revelada, e chama `onNext` (do App.js) para
   avançar para o ecrã de jogo (ScreenGuess).
   ============================================================ */

export default function ScreenReveal({ word, round, totalRounds, onNext }) {
  // Controla se a palavra já foi revelada nesta ronda
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.roundBadge}>
          RONDA {round} / {totalRounds}
        </span>
        <h2 className={styles.title}>Palavra Secreta</h2>
        <p className={styles.sub}>Apenas o árbitro deve ver esta palavra</p>
      </div>

      {/* Cartão central: antes de revelar, mostra o botão "olho";
          depois de revelar, mostra as 4 letras da palavra,
          a categoria e a dica. */}
      <div className={styles.wordCard}>
        {!revealed ? (
          <button className={styles.revealBtn} onClick={() => setRevealed(true)}>
            <span className={styles.eyeIcon}>👁</span>
            <span>Revelar Palavra</span>
            <span className={styles.revealHint}>só árbitro</span>
          </button>
        ) : (
          <div className={styles.wordRevealed}>
            <div className={styles.letterRow}>
              {word.w.split('').map((letter, i) => (
                <div key={i} className={styles.letterBox}>
                  <span className={styles.playerTag}>P{i + 1}</span>
                  <span className={styles.letterChar}>{letter}</span>
                </div>
              ))}
            </div>
            <div className={styles.categoryTag}>{word.c}</div>
            <p className={styles.hint}>💡 {word.h}</p>
          </div>
        )}
      </div>

      {/* Lista de instruções: cada jogador e a letra que lhe calhou.
          Só aparece depois de a palavra ser revelada. */}
      {revealed && (
        <div className={styles.instructions}>
          <div className={styles.instrTitle}>📋 Instruções para os jogadores</div>
          <div className={styles.instrList}>
            {word.w.split('').map((letter, i) => (
              <div key={i} className={styles.instrItem}>
                <span className={styles.instrNum}>Jogador {i + 1}</span>
                <span className={styles.instrArrow}>→</span>
                <span className={styles.instrLetter}>Letra "{letter}"</span>
                <span className={styles.instrSub}>forma com o corpo</span>
              </div>
            ))}
          </div>
          <p className={styles.orderNote}>
            ⚠️ A ordem é obrigatória: começa no Jogador 1 e termina no Jogador 4!
          </p>
        </div>
      )}

      {/* Botão só fica clicável (não disabled) depois de revelar a palavra */}
      <button
        className={`${styles.nextBtn} ${!revealed ? styles.nextBtnDisabled : ''}`}
        onClick={onNext}
        disabled={!revealed}
      >
        ▶ Começar a Adivinhar
      </button>
    </div>
  );
}
