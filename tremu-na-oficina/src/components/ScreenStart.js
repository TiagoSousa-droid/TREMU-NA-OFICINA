import React from 'react';
import styles from './ScreenStart.module.css';

/* ============================================================
   ScreenStart.js
   ------------------------------------------------------------
   Primeiro ecrã do jogo. Mostra:
     - O título e as instruções de como jogar.
     - Duas escolhas: número de rondas e categoria das palavras.
   Quando o botão "Iniciar Jogo" é clicado, chama `onStart`
   (recebida do App.js) com a configuração escolhida — o App
   trata de criar o jogo e mudar de ecrã.
   ============================================================ */

// Opções de número de rondas que o utilizador pode escolher
const ROUND_OPTIONS = [3, 5, 7];
// Opções de categoria de palavras (ver data/words.js)
const CATEGORY_OPTIONS = [
  { key: 'all', label: 'Todas' },
  { key: 'tools', label: '🔧 Ferramentas' },
  { key: 'tech', label: '💻 Tecnologia' },
  { key: 'misc', label: '🌍 Geral' },
];

export default function ScreenStart({ onStart }) {
  // Estado local: o que o utilizador escolheu nestes menus
  const [rounds, setRounds] = React.useState(5);     // nº de rondas (3, 5 ou 7)
  const [category, setCategory] = React.useState('all'); // categoria das palavras

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.trainIcon}>🤔</div>
        <h1 className={styles.title}>TREMU NA OFICINA</h1>
        <p className={styles.tagline}>
          Jogo de grupo · 4 jogadores · 4 letras · 1 palavra
        </p>
      </div>

      <div className={styles.howto}>
        <div className={styles.step}>
          <span className={styles.stepNum}>01</span>
          <div>
            <strong>Árbitro revela</strong>
            <p>Uma palavra de 4 letras é revelada em segredo ao árbitro</p>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>02</span>
          <div>
            <strong>Cada jogador forma uma letra</strong>
            <p>Cada um dos 4 jogadores forma a sua letra com o corpo</p>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>03</span>
          <div>
            <strong>Ordem exata!</strong>
            <p>Jogador 1 → 2 → 3 → 4. A ordem tem de ser perfeita</p>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNum}>04</span>
          <div>
            <strong>Árbitro confirma</strong>
            <p>Seleciona no teclado a letra que cada jogador está a fazer</p>
          </div>
        </div>
      </div>

      {/* ── Seleção de número de rondas e categoria ── */}
      <div className={styles.config}>
        <div className={styles.configBlock}>
          <label className={styles.configLabel}>Número de rondas</label>
          <div className={styles.optionRow}>
            {ROUND_OPTIONS.map((r) => (
              <button
                key={r}
                className={`${styles.optBtn} ${rounds === r ? styles.optBtnActive : ''}`}
                onClick={() => setRounds(r)}
              >
                {r} rondas
              </button>
            ))}
          </div>
        </div>

        <div className={styles.configBlock}>
          <label className={styles.configLabel}>Categoria de palavras</label>
          <div className={styles.optionRow}>
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.key}
                className={`${styles.optBtn} ${category === c.key ? styles.optBtnActive : ''}`}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ao clicar, envia a configuração escolhida para o App.js,
          que cria o jogo e avança para o ecrã "reveal" ── */}
      <button
        className={styles.startBtn}
        onClick={() => onStart({ rounds, category })}
      >
        ▶ Iniciar Jogo
      </button>
    </div>
  );
}
