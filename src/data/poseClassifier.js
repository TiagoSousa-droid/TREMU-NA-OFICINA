/**
 * poseClassifier.js
 * 
 * Classifica a pose humana detetada pelo MoveNet numa letra do alfabeto.
 * Usa os 17 keypoints do MoveNet: nariz, olhos, orelhas, ombros, cotovelos,
 * pulsos, ancas, joelhos e tornozelos.
 * 
 * Estratégia: calcula ângulos e posições relativas dos membros
 * para identificar qual das 26 letras o corpo está a formar.
 * As regras foram desenhadas para serem mutuamente exclusivas
 * entre letras parecidas (A/M/V/Y, T/E/H, K/S/X/Z, etc.).
 */

const KP = {
  NOSE: 0,
  LEFT_EYE: 1, RIGHT_EYE: 2,
  LEFT_EAR: 3, RIGHT_EAR: 4,
  LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
  LEFT_WRIST: 9, RIGHT_WRIST: 10,
  LEFT_HIP: 11, RIGHT_HIP: 12,
  LEFT_KNEE: 13, RIGHT_KNEE: 14,
  LEFT_ANKLE: 15, RIGHT_ANKLE: 16,
};

function angle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (magAB === 0 || magCB === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function isAbove(a, b) { return a.y < b.y; }
function isBelow(a, b) { return a.y > b.y; }

function extractFeatures(kps) {
  const get = (idx) => kps[idx] || { x: 0, y: 0, score: 0 };

  const ls = get(KP.LEFT_SHOULDER);
  const rs = get(KP.RIGHT_SHOULDER);
  const lh = get(KP.LEFT_HIP);
  const rh = get(KP.RIGHT_HIP);
  const le = get(KP.LEFT_ELBOW);
  const re = get(KP.RIGHT_ELBOW);
  const lw = get(KP.LEFT_WRIST);
  const rw = get(KP.RIGHT_WRIST);
  const lk = get(KP.LEFT_KNEE);
  const rk = get(KP.RIGHT_KNEE);
  const la = get(KP.LEFT_ANKLE);
  const ra = get(KP.RIGHT_ANKLE);
  const nose = get(KP.NOSE);

  const torsoCenter = {
    x: (ls.x + rs.x + lh.x + rh.x) / 4,
    y: (ls.y + rs.y + lh.y + rh.y) / 4,
  };
  const torsoHeight = dist(
    { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 },
    { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 }
  ) || 1;

  const norm = (p) => ({
    x: (p.x - torsoCenter.x) / torsoHeight,
    y: (p.y - torsoCenter.y) / torsoHeight,
  });

  const nlw = norm(lw);
  const nrw = norm(rw);
  const nle = norm(le);
  const nre = norm(re);
  const nls = norm(ls);
  const nrs = norm(rs);
  const nlh = norm(lh);
  const nrh = norm(rh);
  const nlk = norm(lk);
  const nrk = norm(rk);
  const nla = norm(la);
  const nra = norm(ra);
  const nnose = norm(nose);

  const leftArmAngle  = angle(ls, le, lw);
  const rightArmAngle = angle(rs, re, rw);
  const leftLegAngle  = angle(lh, lk, la);
  const rightLegAngle = angle(rh, rk, ra);

  const shoulderWidth = Math.abs(nls.x - nrs.x) || 1;

  return {
    lw: nlw, rw: nrw,
    le: nle, re: nre,
    ls: nls, rs: nrs,
    lh: nlh, rh: nrh,
    lk: nlk, rk: nrk,
    la: nla, ra: nra,
    nose: nnose,

    leftArmAngle, rightArmAngle,
    leftLegAngle, rightLegAngle,

    feetTogether: Math.abs(nla.x - nra.x) < 0.35,
    feetWide:     Math.abs(nla.x - nra.x) > 0.65,
    lkRaised:     isAbove(lk, lh),
    rkRaised:     isAbove(rk, rh),

    lwAboveShoulder: isAbove(lw, ls),
    rwAboveShoulder: isAbove(rw, rs),
    lwBelowHip: isBelow(lw, lh),
    rwBelowHip: isBelow(rw, rh),
    lwAtSide: Math.abs(nlw.x) < 0.35 && !isAbove(lw, ls),
    rwAtSide: Math.abs(nrw.x) < 0.35 && !isAbove(rw, rs),

    lwOut: nlw.x < -0.75,
    rwOut: nrw.x >  0.75,
    lwDiagUp:   nlw.x < -0.55 && isAbove(lw, ls),
    rwDiagUp:   nrw.x >  0.55 && isAbove(rw, rs),
    lwDiagDown: nlw.x < -0.55 && isBelow(lw, lh),
    rwDiagDown: nrw.x >  0.55 && isBelow(rw, rh),
    armsWide: nlw.x < -0.80 && nrw.x > 0.80,
    armsUp: isAbove(lw, ls) && isAbove(rw, rs),
    armsDown: isBelow(lw, lh) && isBelow(rw, rh),

    leAboveShoulder: isAbove(le, ls),
    reAboveShoulder: isAbove(re, rs),

    lwAboveHead: isAbove(lw, nose),
    rwAboveHead: isAbove(rw, nose),

    wristsClose: Math.abs(nlw.x - nrw.x) < 0.5 && Math.abs(nlw.y - nrw.y) < 0.5,

    symmetric: Math.abs(Math.abs(nlw.x) - Math.abs(nrw.x)) < 0.3
              && Math.abs(nlw.y - nrw.y) < 0.3,

    shoulderWidth,
  };
}

/**
 * Regras para cada letra baseadas na pose corporal.
 * Cada letra tem uma função que recebe features e devolve uma pontuação [0-1].
 *
 *  A - pernas abertas, braços diagonais ACIMA DA CABEÇA, simétrico
 *  B - pernas juntas, braço esq. ao lado, braço dir. dobrado à frente
 *  C - só braço esq. diagonal acima, braço dir. próximo do torso
 *  D - pernas juntas, braço esq. horizontal, dir. dobrado
 *  E - braços HORIZONTAIS largos (altura dos ombros), pernas juntas
 *  F - braço esq. reto acima, braço dir. horizontal
 *  G - braço dir. horizontal, braço esq. ao lado
 *  H - pernas abertas + braços largos + cotovelos esticados
 *  I - pernas juntas + ambos os braços ao longo do corpo
 *  J - braço dir. acima curvado + joelho dir. levantado
 *  K - esq. diag. acima + dir. diag. abaixo + pernas abertas
 *  L - pernas juntas + só braço esq. horizontal + dir. ao lado
 *  M - pernas abertas + braços diag. acima + cotovelos dobrados
 *  N - pernas abertas + esq. acima reto + dir. diag. abaixo
 *  O - braços acima formando arco, pulsos juntos, pernas juntas
 *  P - pernas juntas + esq. acima + dir. dobrado
 *  Q - como O mas com joelho levantado (cauda do Q)
 *  R - esq. acima + dir. dobrado + joelho dir. levantado
 *  S - esq. diag. acima + dir. diag. abaixo + cotovelos dobrados
 *  T - braços largos HORIZONTAIS, pernas juntas, cotovelos esticados
 *  U - ambos acima retos E paralelos + pernas juntas
 *  V - braços diag. acima, pernas JUNTAS, cotovelos esticados
 *  W - braços largos + cotovelos DOBRADOS + pulsos abaixo dos ombros
 *  X - esq. diag. acima + dir. diag. abaixo + pernas abertas + esticados
 *  Y - braços diag. acima, pernas JUNTAS, cotovelos esticados (mais abertos que V)
 *  Z - só esq. diag. acima + só dir. diag. abaixo + pernas abertas
 */
const LETTER_RULES = {
  A: (f) => {
    let s = 0;
    if (f.feetWide)                          s += 0.30;
    if (f.lwDiagUp && f.rwDiagUp)            s += 0.35;
    if (f.lwAboveHead && f.rwAboveHead)      s += 0.20;
    if (f.symmetric)                          s += 0.15;
    return s;
  },
  B: (f) => {
    let s = 0;
    if (f.feetTogether)                      s += 0.20;
    if (f.lwAtSide)                          s += 0.25;
    if (!f.lwAboveShoulder)                  s += 0.10;
    if (f.rw.y < -0.1 && f.rw.y > -0.8)     s += 0.25;
    if (f.rightArmAngle < 110)               s += 0.20;
    return s;
  },
  C: (f) => {
    let s = 0;
    if (f.lwDiagUp && !f.rwDiagUp)           s += 0.40;
    if (!f.rwAboveShoulder)                  s += 0.20;
    if (f.rw.x < 0.40)                       s += 0.20;
    if (f.leftArmAngle > 140)                s += 0.20;
    return s;
  },
  D: (f) => {
    let s = 0;
    if (f.feetTogether)                       s += 0.25;
    if (f.lwOut && !f.lwAboveShoulder)        s += 0.35;
    if (!f.rwOut)                             s += 0.15;
    if (f.rightArmAngle < 130)                s += 0.25;
    return s;
  },
  E: (f) => {
    let s = 0;
    if (f.armsWide)                           s += 0.40;
    if (f.feetTogether)                       s += 0.20;
    if (Math.abs(f.lw.y + 0.5) < 0.35 && Math.abs(f.rw.y + 0.5) < 0.35) s += 0.25;
    if (!f.lwAboveHead && !f.rwAboveHead)     s += 0.15;
    return s;
  },
  F: (f) => {
    let s = 0;
    if (f.lwAboveShoulder && !f.rwAboveShoulder) s += 0.35;
    if (f.lw.x > -0.35)                       s += 0.20;
    if (f.rwOut)                              s += 0.30;
    if (f.feetTogether)                       s += 0.15;
    return s;
  },
  G: (f) => {
    let s = 0;
    if (f.rwOut && !f.lwOut)                  s += 0.40;
    if (!f.lwAboveShoulder && !f.rwAboveShoulder) s += 0.20;
    if (f.rightArmAngle > 150)                s += 0.25;
    if (f.feetTogether)                       s += 0.15;
    return s;
  },
  H: (f) => {
    let s = 0;
    if (f.feetWide)                           s += 0.30;
    if (f.armsWide)                           s += 0.40;
    if (f.leftArmAngle > 155 && f.rightArmAngle > 155) s += 0.30;
    return s;
  },
  I: (f) => {
    let s = 0;
    if (f.feetTogether)                       s += 0.30;
    if (f.lwAtSide && f.rwAtSide)             s += 0.50;
    if (!f.lwAboveShoulder && !f.rwAboveShoulder) s += 0.20;
    return s;
  },
  J: (f) => {
    let s = 0;
    if (f.rwAboveShoulder && !f.lwAboveShoulder) s += 0.35;
    if (f.rightArmAngle < 140)                s += 0.25;
    if (f.rkRaised)                           s += 0.30;
    if (!f.feetTogether)                      s += 0.10;
    return s;
  },
  K: (f) => {
    let s = 0;
    if (f.lwDiagUp && f.rwDiagDown)           s += 0.55;
    if (f.feetWide)                           s += 0.20;
    if (f.leftArmAngle > 140)                 s += 0.25;
    return s;
  },
  L: (f) => {
    let s = 0;
    if (f.feetTogether)                       s += 0.25;
    if (f.lwOut && !f.lwAboveShoulder)        s += 0.40;
    if (f.rwAtSide)                           s += 0.20;
    if (f.leftArmAngle > 160)                 s += 0.15;
    return s;
  },
  M: (f) => {
    let s = 0;
    if (f.feetWide)                           s += 0.25;
    if (f.lwDiagUp && f.rwDiagUp)             s += 0.40;
    if (f.leftArmAngle < 155 && f.rightArmAngle < 155) s += 0.25;
    if (!f.lwAboveHead && !f.rwAboveHead)     s += 0.10;
    return s;
  },
  N: (f) => {
    let s = 0;
    if (f.feetWide)                           s += 0.25;
    if (f.lwAboveShoulder && !f.rwAboveShoulder) s += 0.30;
    if (f.lw.x > -0.35)                       s += 0.15;
    if (f.rwDiagDown)                         s += 0.30;
    return s;
  },
  O: (f) => {
    let s = 0;
    if (f.armsUp)                             s += 0.25;
    if (f.feetTogether)                       s += 0.20;
    if (f.wristsClose)                        s += 0.30;
    if (f.leftArmAngle < 130 && f.rightArmAngle < 130) s += 0.25;
    return s;
  },
  P: (f) => {
    let s = 0;
    if (f.feetTogether)                       s += 0.20;
    if (f.lwAboveShoulder && !f.rwAboveShoulder) s += 0.35;
    if (f.rightArmAngle < 115)                s += 0.30;
    if (!f.rwAboveShoulder)                   s += 0.15;
    return s;
  },
  Q: (f) => {
    let s = 0;
    if (f.armsUp)                             s += 0.25;
    if (f.wristsClose)                        s += 0.20;
    if (f.leftArmAngle < 130 && f.rightArmAngle < 130) s += 0.20;
    if (f.rkRaised || f.lkRaised)             s += 0.35;
    return s;
  },
  R: (f) => {
    let s = 0;
    if (f.lwAboveShoulder && !f.rwAboveShoulder) s += 0.30;
    if (f.rightArmAngle < 115)                s += 0.25;
    if (f.rkRaised)                           s += 0.30;
    if (!f.feetTogether)                      s += 0.15;
    return s;
  },
  S: (f) => {
    let s = 0;
    if (f.lwDiagUp && f.rwDiagDown)           s += 0.40;
    if (f.leftArmAngle > 130 && f.leftArmAngle < 165) s += 0.20;
    if (f.rightArmAngle > 130 && f.rightArmAngle < 165) s += 0.20;
    if (f.lw.x > -0.90 && f.rw.x < 0.90)      s += 0.20;
    return s;
  },
  T: (f) => {
    let s = 0;
    if (f.armsWide)                           s += 0.40;
    if (f.feetTogether)                       s += 0.30;
    if (f.leftArmAngle > 160 && f.rightArmAngle > 160) s += 0.30;
    return s;
  },
  U: (f) => {
    let s = 0;
    if (f.armsUp)                             s += 0.35;
    if (f.feetTogether)                       s += 0.25;
    if (f.leftArmAngle > 155 && f.rightArmAngle > 155) s += 0.25;
    if (!f.wristsClose)                       s += 0.15;
    return s;
  },
  V: (f) => {
    let s = 0;
    if (f.lwDiagUp && f.rwDiagUp)             s += 0.40;
    if (f.feetTogether)                       s += 0.35;
    if (f.leftArmAngle > 155 && f.rightArmAngle > 155) s += 0.25;
    return s;
  },
  W: (f) => {
    let s = 0;
    if (f.armsWide || (f.lwOut && f.rwOut))  s += 0.25;
    if (f.feetWide)                           s += 0.20;
    if (f.leftArmAngle < 125 && f.rightArmAngle < 125) s += 0.35;
    if (!f.lwAboveShoulder && !f.rwAboveShoulder)       s += 0.20;
    return s;
  },
  X: (f) => {
    let s = 0;
    if (f.lwDiagUp && f.rwDiagDown)           s += 0.40;
    if (f.feetWide)                           s += 0.25;
    if (f.leftArmAngle > 145 && f.rightArmAngle > 145) s += 0.25;
    if (Math.abs(f.lw.x - f.rw.x) > 1.0)      s += 0.10;
    return s;
  },
  Y: (f) => {
    let s = 0;
    if (f.lwDiagUp && f.rwDiagUp)             s += 0.40;
    if (f.feetTogether)                       s += 0.35;
    if (f.leftArmAngle > 145 && f.rightArmAngle > 145) s += 0.25;
    return s;
  },
  Z: (f) => {
    let s = 0;
    if (f.lwDiagUp && !f.rwDiagUp)            s += 0.25;
    if (f.rwDiagDown && !f.lwDiagDown)        s += 0.25;
    if (f.feetWide)                           s += 0.20;
    if (f.leftArmAngle > 145 && f.rightArmAngle > 145) s += 0.30;
    return s;
  },
};

/**
 * Classifica a pose e devolve a letra mais provável com a sua confiança.
 */
export function classifyPose(keypoints) {
  if (!keypoints || keypoints.length < 17) {
    return { letter: null, confidence: 0, scores: {} };
  }

  const minScore = 0.2;
  const criticalKps = [KP.LEFT_SHOULDER, KP.RIGHT_SHOULDER, KP.LEFT_HIP, KP.RIGHT_HIP];
  const allVisible = criticalKps.every(
    (idx) => keypoints[idx] && keypoints[idx].score >= minScore
  );
  if (!allVisible) {
    return { letter: null, confidence: 0, scores: {} };
  }

  const features = extractFeatures(keypoints);
  const scores = {};

  for (const [letter, ruleFn] of Object.entries(LETTER_RULES)) {
    scores[letter] = Math.min(1, ruleFn(features));
  }

  let bestLetter = null;
  let bestScore = 0;
  let secondScore = 0;

  for (const [letter, score] of Object.entries(scores)) {
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestLetter = letter;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  // Confiança mínima de 0.40, e tem de estar pelo menos 0.08 acima
  // da segunda melhor letra (evita confirmar quando há ambiguidade)
  if (bestScore < 0.40 || (bestScore - secondScore) < 0.08) {
    return { letter: null, confidence: bestScore, scores };
  }

  return { letter: bestLetter, confidence: bestScore, scores };
}

/**
 * Classifica a pose para uma letra específica esperada.
 * Útil para mostrar feedback de quão perto o jogador está.
 */
export function scoreForLetter(keypoints, targetLetter) {
  if (!keypoints || keypoints.length < 17) return 0;
  const features = extractFeatures(keypoints);
  const ruleFn = LETTER_RULES[targetLetter];
  if (!ruleFn) return 0;
  return Math.min(1, ruleFn(features));
}
