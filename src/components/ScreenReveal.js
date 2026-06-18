import React, { useState } from 'react';
import styles from './ScreenReveal.module.css';
import LetterPoseGuide from './LetterPoseGuide';

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function ScreenReveal({ word, round, totalRounds, onNext }) {
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

      {/* Cartão central com a palavra */}
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

      {/* Poses de referência da palavra (só para o árbitro, depois de revelar) */}
      {revealed && (
        <div className={styles.wordPoses}>
          <div className={styles.wordPosesTitle}>🎭 Poses desta ronda (para o árbitro)</div>
          <div className={styles.wordPosesRow}>
            {word.w.split('').map((letter, i) => (
              <div key={i} className={styles.wordPoseItem}>
                <span className={styles.wordPosePlayer}>Jogador {i + 1}</span>
                <LetterPoseGuide letter={letter} size={90} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instruções para os jogadores — SEM revelar a letra */}
      {revealed && (
        <div className={styles.instructions}>
          <div className={styles.instrTitle}>📋 Instruções para os jogadores</div>
          <div className={styles.instrList}>
            {word.w.split('').map((letter, i) => (
              <div key={i} className={styles.instrItem}>
                <span className={styles.instrNum}>Jogador {i + 1}</span>
                <span className={styles.instrArrow}>→</span>
                <span className={styles.instrLetter}>O árbitro diz-te a tua letra em segredo</span>
              </div>
            ))}
          </div>
          <p className={styles.orderNote}>
            ⚠️ A ordem é obrigatória: começa no Jogador 1 e termina no Jogador 4!
          </p>
        </div>
      )}

      {/* Referência completa A-Z — para os jogadores saberem como fazer cada letra */}
      <div className={styles.refSection}>
        <div className={styles.refTitle}>📖 Como fazer cada letra (referência para todos)</div>
        <div className={styles.refGrid}>
          {ALL_LETTERS.map((letter) => (
            <div key={letter} className={styles.refItem}>
              <LetterPoseGuide letter={letter} size={72} />
            </div>
          ))}
        </div>
      </div>

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