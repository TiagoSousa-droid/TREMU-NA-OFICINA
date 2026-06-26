import React from 'react';
import styles from './ScreenReveal.module.css';
import LetterPoseGuide from './LetterPoseGuide';
 
const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
 
export default function ScreenReveal({ word, round, totalRounds, onNext }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.roundBadge}>RONDA {round} / {totalRounds}</span>
        <h2 className={styles.title}>Palavra Secreta</h2>
      </div>
 
      {/* Palavra revelada diretamente */}
      <div className={styles.wordCard}>
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
 
      {/* Poses da palavra */}
      <div className={styles.wordPoses}>
        <div className={styles.wordPosesTitle}>🎭 Poses desta ronda</div>
        <div className={styles.wordPosesRow}>
          {word.w.split('').map((letter, i) => (
            <div key={i} className={styles.wordPoseItem}>
              <span className={styles.wordPosePlayer}>Jogador {i + 1}</span>
              <LetterPoseGuide letter={letter} size={90} />
            </div>
          ))}
        </div>
      </div>
 
      {/* Referência A-Z */}
      <div className={styles.refSection}>
        <div className={styles.refTitle}>📖 Referência completa A-Z</div>
        <div className={styles.refGrid}>
          {ALL_LETTERS.map((letter) => (
            <div key={letter} className={styles.refItem}>
              <LetterPoseGuide letter={letter} size={72} />
            </div>
          ))}
        </div>
      </div>
 
      <button className={styles.nextBtn} onClick={onNext}>
        ▶ Começar a Adivinhar
      </button>
    </div>
  );
}