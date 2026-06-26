import React, { useState } from 'react';
import styles from './ScreenReveal.module.css';

const emojis = ['🕺', '💃', '🎯', '🔥', '⚡', '🎮', '👾', '🚂'];

export default function ScreenReveal({ word, round, totalRounds, onNext }) {
  const [ready, setReady] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.floatingEmojis}>
        {emojis.map((e, i) => (
          <span key={i} className={styles.floatEmoji} style={{ '--i': i }}>{e}</span>
        ))}
      </div>

      <div className={styles.header}>
        <span className={styles.roundBadge}>🎮 RONDA {round} / {totalRounds}</span>
        <h2 className={styles.title}>Preparem-se!!</h2>
        <p className={styles.subtitle}>Formem as letras com o corpo 🙆</p>
      </div>

      <div className={styles.wordCard}>
        <div className={styles.categoryTag}>📦 {word.c}</div>
        <p className={styles.hint}>💡 {word.h}</p>
      </div>

      {!ready ? (
        <button className={styles.readyBtn} onClick={() => setReady(true)}>
          👍 Estamos prontos!
        </button>
      ) : (
        <button className={styles.nextBtn} onClick={onNext}>
          🚀 Vamos lá!!
        </button>
      )}
    </div>
  );
}
