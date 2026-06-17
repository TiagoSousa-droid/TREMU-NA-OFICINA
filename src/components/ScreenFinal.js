import React from 'react';
import styles from './ScreenFinal.module.css';

/* ============================================================
   ScreenFinal.js
   ------------------------------------------------------------
   Ecrã final do jogo. Mostra:
     - Uma mensagem de acordo com o desempenho geral (%).
     - O "ranking" dos 4 jogadores, do maior para o menor
       número de pontos (com medalhas 🥇🥈🥉).
     - O histórico de todas as palavras jogadas (acertou ou não,
       e quantos pontos valeu cada uma).
   O botão "Jogar Novamente" chama `onReset` (do App.js), que
   limpa o jogo e volta ao ecrã inicial.
   ============================================================ */

// Ícones de medalha, por posição no ranking (1º, 2º, 3º, 4º lugar)
const MEDALS = ['🥇', '🥈', '🥉', '4️⃣'];

export default function ScreenFinal({ scores, history, totalRounds, onReset }) {
  // Soma os pontos de todos os jogadores
  const total = scores.reduce((a, b) => a + b, 0);
  // Pontuação máxima possível por jogador (15 pts por ronda: 10 base + 5 bónus)
  const maxScore = totalRounds * 15;
  // Percentagem do total possível (4 jogadores) que foi alcançada
  const pct = Math.round((total / (maxScore * 4)) * 100);

  // Cria uma lista [{ s: pontos, i: índice do jogador }] ordenada
  // do jogador com mais pontos para o com menos pontos.
  const sorted = scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.trophy}>🏆</div>
        <h2 className={styles.title}>Fim do Jogo!</h2>
        <p className={styles.sub}>
          {pct >= 80
            ? 'Excelente trabalho em equipa! 🚀'
            : pct >= 50
            ? 'Bom esforço! Continuem a praticar 💪'
            : 'Próxima vez vai correr melhor! 🌱'}
        </p>
        <div className={styles.totalBadge}>
          {total} pts totais · {history.filter((h) => h.won).length}/
          {totalRounds} palavras acertadas
        </div>
      </div>

      {/* Ranking dos jogadores, da maior para a menor pontuação */}
      <div className={styles.rankCard}>
        <div className={styles.sectionTitle}>Ranking</div>
        {sorted.map((item, rank) => (
          <div key={item.i} className={`${styles.rankRow} ${rank === 0 ? styles.rankFirst : ''}`}>
            <span className={styles.medal}>{MEDALS[rank]}</span>
            <span className={styles.rankName}>Jogador {item.i + 1}</span>
            <span className={styles.rankScore}>{item.s} pts</span>
          </div>
        ))}
      </div>

      {/* Histórico: uma linha por ronda jogada, com a palavra,
          a dica e quantos pontos valeu */}
      <div className={styles.historyCard}>
        <div className={styles.sectionTitle}>Palavras jogadas</div>
        {history.map((h, i) => (
          <div key={i} className={styles.histRow}>
            <span className={styles.histIcon}>{h.won ? '✅' : '❌'}</span>
            <span className={styles.histWord}>{h.word}</span>
            <span className={styles.histHint}>{h.hint}</span>
            <span className={`${styles.histPts} ${h.won ? styles.ptsGood : styles.ptsBad}`}>
              {h.won ? `+${h.pts}` : '0'} pts
            </span>
          </div>
        ))}
      </div>

      <button className={styles.resetBtn} onClick={onReset}>
        🔄 Jogar Novamente
      </button>
    </div>
  );
}
