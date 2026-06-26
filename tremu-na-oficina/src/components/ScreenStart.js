import React from 'react';
import styles from './ScreenStart.module.css';

const ROUND_OPTIONS = [3, 5, 7];
const CATEGORY_OPTIONS = [
  { key: 'all', label: 'Todas' },
  { key: 'tools', label: '🔧 Ferramentas' },
  { key: 'tech', label: '💻 Tecnologia' },
  { key: 'misc', label: '🌍 Geral' },
];

export default function ScreenStart({ onStart }) {
  const [rounds, setRounds] = React.useState(5);
  const [category, setCategory] = React.useState('all');

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.trainIcon}>🤸</div>
        <h1 className={styles.title}>TREMU NA OFICINA</h1>
        <p className={styles.tagline}>Jogo de grupo · 4 jogadores · 4 letras · 1 palavra</p>
      </div>

      <div className={styles.howto}>
        <div className={styles.step}>
          <span className={styles.stepNum}>01</span>
          <div>
            <strong>Palavra secreta</strong>
            <p>Uma palavra de 4 letras aparece no ecrã — cada jogador memoriza a sua letra</p>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>02</span>
          <div>
            <strong>Forma a letra com o corpo</strong>
            <p>O guia de poses aparece durante o jogo para te ajudar</p>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>03</span>
          <div>
            <strong>Ordem exata!</strong>
            <p>Jogador 1 → 2 → 3 → 4. A câmara deteta automaticamente</p>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>04</span>
          <div>
            <strong>Adivinha a palavra</strong>
            <p>A equipa tenta adivinhar a palavra que os corpos formam</p>
          </div>
        </div>
      </div>

      <div className={styles.config}>
        <div className={styles.configBlock}>
          <label className={styles.configLabel}>Número de rondas</label>
          <div className={styles.optionRow}>
            {ROUND_OPTIONS.map((r) => (
              <button key={r}
                className={`${styles.optBtn} ${rounds === r ? styles.optBtnActive : ''}`}
                onClick={() => setRounds(r)}>
                {r} rondas
              </button>
            ))}
          </div>
        </div>
        <div className={styles.configBlock}>
          <label className={styles.configLabel}>Categoria de palavras</label>
          <div className={styles.optionRow}>
            {CATEGORY_OPTIONS.map((c) => (
              <button key={c.key}
                className={`${styles.optBtn} ${category === c.key ? styles.optBtnActive : ''}`}
                onClick={() => setCategory(c.key)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className={styles.startBtn} onClick={() => onStart({ rounds, category })}>
        ▶ Iniciar Jogo
      </button>
    </div>
  );
}
