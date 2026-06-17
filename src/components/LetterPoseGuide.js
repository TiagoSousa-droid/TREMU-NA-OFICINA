import React from 'react';
import styles from './LetterPoseGuide.module.css';

/* ============================================================
   LetterPoseGuide.js
   ------------------------------------------------------------
   Mostra um "boneco palito" (stick figure) que ilustra a pose
   corporal que o jogador deve formar para uma dada letra.

   Cada letra tem uma lista de pontos (cabeça, ombros, cotovelos,
   mãos, ancas, joelhos, pés) num sistema de coordenadas simples
   (0-100 em x e y), e desenhamos linhas entre eles para formar
   o boneco — exatamente as mesmas poses descritas nas regras
   do poseClassifier.js, para o jogador saber o que a câmara
   está à espera de ver.

   NOTA: x cresce para a direita, y cresce para baixo (como em
   SVG normal). O boneco está de frente para quem o vê — ou seja,
   a "mão esquerda" do boneco aparece no lado esquerdo do ecrã,
   tal como a câmara mostra o jogador (efeito espelho/selfie).
   ============================================================ */

// Pontos de referência partilhados por (quase) todas as poses
const HEAD    = { x: 50, y: 12 };
const NECK    = { x: 50, y: 22 };
const HIP_C   = { x: 50, y: 55 }; // centro da anca (usado para a coluna)

// Função auxiliar: cria a pose completa a partir só dos pontos
// que mudam de letra para letra (mãos, cotovelos, pés, joelhos).
// Os valores por omissão representam um "boneco em descanso":
// braços ao longo do corpo, pernas juntas e direitas.
function pose({
  lShoulder = { x: 38, y: 25 }, rShoulder = { x: 62, y: 25 },
  lElbow    = { x: 33, y: 42 }, rElbow    = { x: 67, y: 42 },
  lWrist    = { x: 30, y: 58 }, rWrist    = { x: 70, y: 58 },
  lHip      = { x: 42, y: 55 }, rHip      = { x: 58, y: 55 },
  lKnee     = { x: 41, y: 75 }, rKnee     = { x: 59, y: 75 },
  lAnkle    = { x: 40, y: 95 }, rAnkle    = { x: 60, y: 95 },
} = {}) {
  return { lShoulder, rShoulder, lElbow, rElbow, lWrist, rWrist, lHip, rHip, lKnee, rKnee, lAnkle, rAnkle };
}

// ── Pose de cada letra, desenhada para corresponder às regras
//    de classificação em poseClassifier.js ───────────────────
const POSES = {
  A: pose({
    lShoulder: { x: 38, y: 25 }, rShoulder: { x: 62, y: 25 },
    lElbow: { x: 25, y: 12 }, rElbow: { x: 75, y: 12 },
    lWrist: { x: 18, y: -2 }, rWrist: { x: 82, y: -2 }, // braços diagonais bem acima da cabeça
    lHip: { x: 42, y: 55 }, rHip: { x: 58, y: 55 },
    lKnee: { x: 28, y: 75 }, rKnee: { x: 72, y: 75 },
    lAnkle: { x: 18, y: 95 }, rAnkle: { x: 82, y: 95 }, // pernas bem abertas
  }),
  B: pose({
    lWrist: { x: 30, y: 58 }, // braço esquerdo ao lado do corpo
    rElbow: { x: 70, y: 35 }, rWrist: { x: 60, y: 22 }, // braço direito dobrado à frente do peito
    lAnkle: { x: 40, y: 95 }, rAnkle: { x: 50, y: 95 }, // pés juntos
  }),
  C: pose({
    lElbow: { x: 20, y: 18 }, lWrist: { x: 28, y: 5 }, // esquerdo em arco acima
    rElbow: { x: 68, y: 40 }, rWrist: { x: 64, y: 50 }, // direito dobrado perto do tronco
  }),
  D: pose({
    lElbow: { x: 15, y: 25 }, lWrist: { x: 2, y: 25 },  // esquerdo bem estendido na horizontal
    rElbow: { x: 70, y: 35 }, rWrist: { x: 62, y: 22 }, // direito dobrado
    lAnkle: { x: 40, y: 95 }, rAnkle: { x: 50, y: 95 },
  }),
  E: pose({
    lElbow: { x: 12, y: 25 }, lWrist: { x: -3, y: 25 },
    rElbow: { x: 88, y: 25 }, rWrist: { x: 103, y: 25 }, // ambos bem horizontais, à altura do ombro
    lAnkle: { x: 40, y: 95 }, rAnkle: { x: 50, y: 95 },
  }),
  F: pose({
    lElbow: { x: 38, y: 5 }, lWrist: { x: 38, y: -10 }, // esquerdo reto para cima
    rElbow: { x: 85, y: 30 }, rWrist: { x: 98, y: 30 }, // direito horizontal
    lAnkle: { x: 40, y: 95 }, rAnkle: { x: 50, y: 95 },
  }),
  G: pose({
    lWrist: { x: 30, y: 58 },
    rElbow: { x: 85, y: 28 }, rWrist: { x: 100, y: 28 }, // direito horizontal estendido
  }),
  H: pose({
    lElbow: { x: 12, y: 25 }, lWrist: { x: -3, y: 25 },
    rElbow: { x: 88, y: 25 }, rWrist: { x: 103, y: 25 },
    lAnkle: { x: 22, y: 95 }, rAnkle: { x: 78, y: 95 }, // pernas bem abertas
  }),
  I: pose(), // boneco em descanso: braços ao longo do corpo, pés juntos
  J: pose({
    rElbow: { x: 75, y: 15 }, rWrist: { x: 68, y: 0 }, // direito acima em arco
    rKnee:  { x: 62, y: 58 }, rAnkle: { x: 60, y: 50 }, // joelho direito levantado
  }),
  K: pose({
    lElbow: { x: 22, y: 15 }, lWrist: { x: 14, y: 0 },  // esquerdo diagonal acima
    rElbow: { x: 78, y: 65 }, rWrist: { x: 86, y: 80 }, // direito diagonal abaixo
    lAnkle: { x: 22, y: 95 }, rAnkle: { x: 78, y: 95 },
  }),
  L: pose({
    lElbow: { x: 15, y: 25 }, lWrist: { x: 0, y: 25 },  // esquerdo horizontal
    lAnkle: { x: 40, y: 95 }, rAnkle: { x: 50, y: 95 },
  }),
  M: pose({
    lElbow: { x: 28, y: 18 }, lWrist: { x: 22, y: 5 },  // diagonal acima, mas cotovelo dobrado
    rElbow: { x: 72, y: 18 }, rWrist: { x: 78, y: 5 },
    lAnkle: { x: 22, y: 95 }, rAnkle: { x: 78, y: 95 },
  }),
  N: pose({
    lElbow: { x: 38, y: 5 }, lWrist: { x: 38, y: -10 }, // esquerdo reto acima
    rElbow: { x: 75, y: 65 }, rWrist: { x: 82, y: 80 }, // direito diagonal abaixo
    lAnkle: { x: 22, y: 95 }, rAnkle: { x: 78, y: 95 },
  }),
  O: pose({
    lElbow: { x: 28, y: 8 }, lWrist: { x: 44, y: -5 },  // braços curvados, pulsos quase a tocar-se
    rElbow: { x: 72, y: 8 }, rWrist: { x: 56, y: -5 },
    lAnkle: { x: 40, y: 95 }, rAnkle: { x: 50, y: 95 },
  }),
  P: pose({
    lElbow: { x: 38, y: 5 }, lWrist: { x: 38, y: -10 }, // esquerdo reto acima
    rElbow: { x: 70, y: 35 }, rWrist: { x: 60, y: 22 }, // direito dobrado à frente
    lAnkle: { x: 40, y: 95 }, rAnkle: { x: 50, y: 95 },
  }),
  Q: pose({
    lElbow: { x: 28, y: 8 }, lWrist: { x: 44, y: -5 },  // como O...
    rElbow: { x: 72, y: 8 }, rWrist: { x: 56, y: -5 },
    rKnee:  { x: 62, y: 58 }, rAnkle: { x: 70, y: 48 }, // ...mas com perna levantada (cauda do Q)
  }),
  R: pose({
    lElbow: { x: 38, y: 5 }, lWrist: { x: 38, y: -10 }, // esquerdo reto acima
    rElbow: { x: 70, y: 35 }, rWrist: { x: 60, y: 22 }, // direito dobrado
    rKnee:  { x: 50, y: 58 }, rAnkle: { x: 38, y: 50 }, // perna direita cruzada
  }),
  S: pose({
    lElbow: { x: 26, y: 20 }, lWrist: { x: 20, y: 8 },  // diagonal acima, dobrado
    rElbow: { x: 74, y: 60 }, rWrist: { x: 80, y: 72 }, // diagonal abaixo, dobrado
  }),
  T: pose({
    lElbow: { x: 12, y: 25 }, lWrist: { x: -3, y: 25 },
    rElbow: { x: 88, y: 25 }, rWrist: { x: 103, y: 25 },
    lAnkle: { x: 40, y: 95 }, rAnkle: { x: 50, y: 95 }, // pés juntos (distingue de H/E)
  }),
  U: pose({
    lElbow: { x: 40, y: 5 }, lWrist: { x: 40, y: -12 }, // ambos retos para cima, próximos
    rElbow: { x: 60, y: 5 }, rWrist: { x: 60, y: -12 },
    lAnkle: { x: 40, y: 95 }, rAnkle: { x: 50, y: 95 },
  }),
  V: pose({
    lElbow: { x: 25, y: 12 }, lWrist: { x: 16, y: -3 }, // diagonal acima, esticado
    rElbow: { x: 75, y: 12 }, rWrist: { x: 84, y: -3 },
    lAnkle: { x: 40, y: 95 }, rAnkle: { x: 50, y: 95 }, // pés juntos (distingue de A/M)
  }),
  W: pose({
    lElbow: { x: 18, y: 18 }, lWrist: { x: 22, y: 35 }, // largo, cotovelo dobrado, pulso abaixo do ombro
    rElbow: { x: 82, y: 18 }, rWrist: { x: 78, y: 35 },
    lAnkle: { x: 22, y: 95 }, rAnkle: { x: 78, y: 95 },
  }),
  X: pose({
    lElbow: { x: 22, y: 15 }, lWrist: { x: 14, y: 0 },  // diagonal acima, esticado
    rElbow: { x: 78, y: 65 }, rWrist: { x: 86, y: 80 }, // diagonal abaixo, esticado
    lAnkle: { x: 22, y: 95 }, rAnkle: { x: 78, y: 95 },
  }),
  Y: pose({
    lElbow: { x: 22, y: 14 }, lWrist: { x: 10, y: 2 },  // diagonal bem aberta acima
    rElbow: { x: 78, y: 14 }, rWrist: { x: 90, y: 2 },
    lAnkle: { x: 40, y: 95 }, rAnkle: { x: 50, y: 95 }, // pés juntos (distingue de M)
  }),
  Z: pose({
    lElbow: { x: 25, y: 14 }, lWrist: { x: 16, y: 0 },  // só esquerdo diagonal acima
    rElbow: { x: 78, y: 65 }, rWrist: { x: 86, y: 80 }, // só direito diagonal abaixo
    lAnkle: { x: 22, y: 95 }, rAnkle: { x: 78, y: 95 },
  }),
};

// Ossos do boneco: pares de pontos a unir por uma linha
const BONES = [
  ['lShoulder', 'rShoulder'],
  ['lShoulder', 'lElbow'], ['lElbow', 'lWrist'],
  ['rShoulder', 'rElbow'], ['rElbow', 'rWrist'],
  ['lShoulder', 'lHip'], ['rShoulder', 'rHip'],
  ['lHip', 'rHip'],
  ['lHip', 'lKnee'], ['lKnee', 'lAnkle'],
  ['rHip', 'rKnee'], ['rKnee', 'rAnkle'],
];

export default function LetterPoseGuide({ letter, size = 120 }) {
  const p = POSES[letter];

  if (!letter || !p) {
    return (
      <div className={styles.wrapper} style={{ width: size, height: size * 1.15 }}>
        <div className={styles.placeholder}>?</div>
      </div>
    );
  }

  // viewBox com margem extra em cima/baixo para braços bem esticados (ex: A, E)
  const VIEW = '-15 -20 130 130';

  return (
    <div className={styles.wrapper} style={{ width: size, height: size * 1.15 }}>
      <svg viewBox={VIEW} className={styles.svg} xmlns="http://www.w3.org/2000/svg">
        {/* coluna pescoço -> centro da anca, para dar volume ao tronco */}
        <line x1={NECK.x} y1={NECK.y} x2={HIP_C.x} y2={HIP_C.y}
          className={styles.bone} />

        {/* ossos dos braços e pernas */}
        {BONES.map(([a, b], i) => (
          <line key={i}
            x1={p[a].x} y1={p[a].y}
            x2={p[b].x} y2={p[b].y}
            className={styles.bone} />
        ))}

        {/* cabeça */}
        <circle cx={HEAD.x} cy={HEAD.y} r="9" className={styles.head} />

        {/* articulações principais, para dar leitura clara da pose */}
        {['lShoulder','rShoulder','lElbow','rElbow','lWrist','rWrist','lHip','rHip','lKnee','rKnee','lAnkle','rAnkle']
          .map((k) => (
            <circle key={k} cx={p[k].x} cy={p[k].y} r="3.2" className={styles.joint} />
          ))}
      </svg>
      <div className={styles.label}>{letter}</div>
    </div>
  );
}
