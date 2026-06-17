import React, { useState } from 'react';
import styles from './App.module.css';
import ScreenStart from './components/ScreenStart';
import ScreenReveal from './components/ScreenReveal';
import ScreenGuess from './components/ScreenGuess';
import ScreenRoundResult from './components/ScreenRoundResult';
import ScreenFinal from './components/ScreenFinal';
import { getAllWords, shuffleArray } from './data/words';

/* ============================================================
   App.js
   ------------------------------------------------------------
   Este é o componente "raiz" do jogo. É ele que:
     1. Guarda o estado geral do jogo (ronda atual, pontuações,
        histórico, etc.) numa variável chamada `game`.
     2. Decide qual ECRÃ mostrar de momento (`screen`):
          start        -> ecrã de configuração inicial
          reveal       -> mostra a palavra ao "mestre" do jogo
          guess        -> jogadores formam as letras com o corpo
          round_result -> resultado da ronda + pontuações
          final        -> resultado final / ranking
     3. Liga os ecrãs entre si através de funções "handle..."
        que são chamadas pelos componentes filhos.

   Fluxo normal de uma ronda:
     START -> (configura e clica "Começar")
     REVEAL -> (mostra a palavra, clica "Seguinte")
     GUESS -> (jogadores formam as 4 letras) -> resultado
     ROUND_RESULT -> (clica "Próxima ronda")
     ... repete até à última ronda ...
     FINAL
   ============================================================ */

// Nomes dos ecrãs possíveis — usar constantes evita erros de escrita
const SCREEN = {
  START: 'start',
  REVEAL: 'reveal',
  GUESS: 'guess',
  ROUND_RESULT: 'round_result',
  FINAL: 'final',
};

// Cria o estado inicial de um jogo novo, a partir da configuração
// escolhida no ecrã inicial (categoria de palavras e nº de rondas).
function initGame(config) {
  const pool = getAllWords(config.category);          // todas as palavras da categoria
  const words = shuffleArray(pool).slice(0, config.rounds); // embaralha e escolhe N palavras
  return {
    config,                  // configuração escolhida (categoria, nº de rondas)
    words,                   // lista de palavras desta partida (uma por ronda)
    round: 1,                // ronda atual (começa em 1)
    scores: [0, 0, 0, 0],    // pontuação de cada um dos 4 jogadores
    history: [],             // histórico de palavras/pontos de cada ronda
    lastResult: null,        // resultado da última ronda (ganhou? pontos?)
  };
}

export default function App() {
  // `screen`: qual ecrã está visível agora
  const [screen, setScreen] = useState(SCREEN.START);
  // `game`: todo o estado da partida atual (null enquanto não começou)
  const [game, setGame] = useState(null);

  // Chamado pelo ScreenStart quando o utilizador clica em "Começar"
  const handleStart = (config) => {
    setGame(initGame(config));   // cria um jogo novo com a configuração escolhida
    setScreen(SCREEN.REVEAL);    // passa para o ecrã que revela a palavra
  };

  // Chamado pelo ScreenReveal quando se avança para a fase de adivinhar
  const handleRevealNext = () => {
    setScreen(SCREEN.GUESS);
  };

  // Chamado pelo ScreenGuess quando a ronda termina (ganhou ou tempo esgotou)
  // `won`     -> true se as 4 letras foram formadas a tempo
  // `pts`     -> pontos a somar a TODOS os jogadores nesta ronda
  // `hintUsed`-> se a dica foi usada (só guardado no histórico)
  const handleGuessResult = ({ won, pts, hintUsed }) => {
    setGame((prev) => {
      // Soma os pontos da ronda à pontuação de cada jogador
      const newScores = prev.scores.map((s) => s + pts);
      const word = prev.words[prev.round - 1];
      // Guarda esta ronda no histórico (para o ecrã final)
      const newHistory = [
        ...prev.history,
        { word: word.w, hint: word.h, won, pts },
      ];
      return {
        ...prev,
        scores: newScores,
        history: newHistory,
        lastResult: { won, pts },
      };
    });
    setScreen(SCREEN.ROUND_RESULT);
  };

  // Chamado pelo ScreenRoundResult ao avançar para a ronda seguinte
  const handleNextRound = () => {
    if (game.round >= game.config.rounds) {
      // Já era a última ronda -> mostra o ecrã final
      setScreen(SCREEN.FINAL);
    } else {
      // Avança o número da ronda e volta a mostrar a próxima palavra
      setGame((prev) => ({ ...prev, round: prev.round + 1 }));
      setScreen(SCREEN.REVEAL);
    }
  };

  // Chamado pelo ScreenFinal para começar um jogo totalmente novo
  const handleReset = () => {
    setGame(null);
    setScreen(SCREEN.START);
  };

  // Palavra da ronda atual (ou null se ainda não há jogo)
  const currentWord = game ? game.words[game.round - 1] : null;

  return (
    <div className={styles.app}>
      {/* ── Barra superior fixa, com o logo e o nº da ronda ── */}
      <div className={styles.topRail}>
        <span className={styles.logo}>🚂 TREMU NA OFICINA</span>
        {game && screen !== SCREEN.START && screen !== SCREEN.FINAL && (
          <span className={styles.roundPill}>
            Ronda {game.round}/{game.config.rounds}
          </span>
        )}
      </div>

      {/* ── Área principal: mostra UM dos ecrãs, dependendo de `screen` ── */}
      <main className={styles.main}>

        {/* Ecrã 1: configuração inicial do jogo */}
        {screen === SCREEN.START && <ScreenStart onStart={handleStart} />}

        {/* Ecrã 2: revela a palavra desta ronda (só o "mestre" vê) */}
        {screen === SCREEN.REVEAL && currentWord && (
          <ScreenReveal
            word={currentWord}
            round={game.round}
            totalRounds={game.config.rounds}
            onNext={handleRevealNext}
          />
        )}

        {/* Ecrã 3: jogadores formam as letras com o corpo, em frente à câmara.
            A prop `key` muda a cada ronda — isto faz o React DESTRUIR e
            CRIAR um ScreenGuess novo, garantindo que todo o estado
            (tempo, letras já adivinhadas, etc.) começa do zero. */}
        {screen === SCREEN.GUESS && currentWord && (
          <ScreenGuess
            key={`guess-${game.round}`}
            word={currentWord}
            round={game.round}
            totalRounds={game.config.rounds}
            onResult={handleGuessResult}
          />
        )}

        {/* Ecrã 4: resultado da ronda (ganhou/perdeu, pontos, placar) */}
        {screen === SCREEN.ROUND_RESULT && currentWord && game.lastResult && (
          <ScreenRoundResult
            won={game.lastResult.won}
            pts={game.lastResult.pts}
            word={currentWord}
            scores={game.scores}
            round={game.round}
            totalRounds={game.config.rounds}
            onNext={handleNextRound}
          />
        )}

        {/* Ecrã 5: resultado final + histórico de todas as rondas */}
        {screen === SCREEN.FINAL && (
          <ScreenFinal
            scores={game.scores}
            history={game.history}
            totalRounds={game.config.rounds}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
