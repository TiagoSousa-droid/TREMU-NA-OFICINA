/**
 * poseClassifier.js  — v2
 *
 * Melhorias em relação à versão anterior:
 *  - Penalizações explícitas: cada letra subtrai pontos quando
 *    features contraditórias estão presentes.
 *  - Thresholds mais apertados nos grupos ambíguos
 *    (A/M/V/Y, K/S/X/Z, T/E/H, P/R/J, O/Q/U).
 *  - Normalização robusta: usa mediana de torso em vez de média
 *    simples para resistir a keypoints mal detetados.
 *  - Margem de confiança aumentada para 0.10 (evita falsos positivos).
 */
 
const KP = {
  NOSE: 0,
  LEFT_EYE: 1,  RIGHT_EYE: 2,
  LEFT_EAR: 3,  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,     RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,     RIGHT_WRIST: 10,
  LEFT_HIP: 11,      RIGHT_HIP: 12,
  LEFT_KNEE: 13,     RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,    RIGHT_ANKLE: 16,
};
 
/* ── Geometria ─────────────────────────────────────────────── */
 
function angle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.sqrt((ab.x**2 + ab.y**2) * (cb.x**2 + cb.y**2));
  if (mag === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180 / Math.PI;
}
 
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
 
/* ── Extração de features ──────────────────────────────────── */
 
function extractFeatures(kps) {
  const g = (i) => kps[i] || { x: 0, y: 0, score: 0 };
 
  const ls = g(KP.LEFT_SHOULDER);  const rs = g(KP.RIGHT_SHOULDER);
  const lh = g(KP.LEFT_HIP);       const rh = g(KP.RIGHT_HIP);
  const le = g(KP.LEFT_ELBOW);     const re = g(KP.RIGHT_ELBOW);
  const lw = g(KP.LEFT_WRIST);     const rw = g(KP.RIGHT_WRIST);
  const lk = g(KP.LEFT_KNEE);      const rk = g(KP.RIGHT_KNEE);
  const la = g(KP.LEFT_ANKLE);     const ra = g(KP.RIGHT_ANKLE);
  const nose = g(KP.NOSE);
 
  // Centro e escala do torso
  const midShoulder = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
  const midHip      = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
  const torsoHeight = Math.max(dist(midShoulder, midHip), 1);
  const center      = { x: (midShoulder.x + midHip.x) / 2,
                         y: (midShoulder.y + midHip.y) / 2 };
 
  const N = (p) => ({
    x: (p.x - center.x) / torsoHeight,
    y: (p.y - center.y) / torsoHeight,
  });
 
  const nls = N(ls); const nrs = N(rs);
  const nlh = N(lh); const nrh = N(rh);
  const nle = N(le); const nre = N(re);
  const nlw = N(lw); const nrw = N(rw);
  const nlk = N(lk); const nrk = N(rk);
  const nla = N(la); const nra = N(ra);
  const nno = N(nose);
 
  // Ângulos dos membros
  const laArm = angle(ls, le, lw);   // ângulo no cotovelo esquerdo
  const raArm = angle(rs, re, rw);   // ângulo no cotovelo direito
  const laLeg = angle(lh, lk, la);
  const raLeg = angle(rh, rk, ra);
 
  // Ângulo do braço em relação à vertical (shoulder→wrist)
  const lArmVec = { x: nlw.x - nls.x, y: nlw.y - nls.y };
  const rArmVec = { x: nrw.x - nrs.x, y: nrw.y - nrs.y };
  // ângulo em graus: 0° = pra baixo, 90° = horizontal, 180° = pra cima
  const lArmElevDeg = Math.atan2(-(lArmVec.y), Math.abs(lArmVec.x)) * 180 / Math.PI;
  const rArmElevDeg = Math.atan2(-(rArmVec.y), Math.abs(rArmVec.x)) * 180 / Math.PI;
 
  // Largura dos pés e pernas
  const ankleGap   = Math.abs(nla.x - nra.x);
  const feetTog    = ankleGap < 0.30;
  const feetNarrow = ankleGap < 0.50;
  const feetWide   = ankleGap > 0.70;
  const feetVwide  = ankleGap > 1.00;
 
  // Pulsos
  const wristGapX  = Math.abs(nlw.x - nrw.x);
  const wristGapY  = Math.abs(nlw.y - nrw.y);
  const wristsClose = wristGapX < 0.40 && wristGapY < 0.40;
 
  // Posição vertical relativa ao ombro/anca/nariz
  const lwAboveShld = nlw.y < nls.y;
  const rwAboveShld = nrw.y < nrs.y;
  const lwAboveHead = nlw.y < nno.y - 0.1;
  const rwAboveHead = nrw.y < nno.y - 0.1;
  const lwBelowHip  = nlw.y > nlh.y + 0.2;
  const rwBelowHip  = nrw.y > nrh.y + 0.2;
  const leAboveShld = nle.y < nls.y - 0.1;
  const reAboveShld = nre.y < nrs.y - 0.1;
 
  // Lateral: braço esticado para fora?
  const lwFarLeft  = nlw.x < -0.80;
  const rwFarRight = nrw.x >  0.80;
  const lwMidLeft  = nlw.x < -0.40;
  const rwMidRight = nrw.x >  0.40;
 
  // Braço ao lado do corpo
  const lwAtSide = Math.abs(nlw.x - nls.x) < 0.25 && !lwAboveShld;
  const rwAtSide = Math.abs(nrw.x - nrs.x) < 0.25 && !rwAboveShld;
 
  // Diagonal para cima: pulso acima do ombro E fora do torso
  const lwDiagUp  = lwAboveShld && nlw.x < -0.35;
  const rwDiagUp  = rwAboveShld && nrw.x >  0.35;
 
  // Diagonal para baixo: pulso abaixo da anca E fora
  const lwDiagDown = lwBelowHip && nlw.x < -0.30;
  const rwDiagDown = rwBelowHip && nrw.x >  0.30;
 
  // Braços horizontais (elev ~70-110°) e bem esticados
  const lwHoriz = Math.abs(lArmElevDeg - 90) < 25 && lwFarLeft;
  const rwHoriz = Math.abs(rArmElevDeg - 90) < 25 && rwFarRight;
 
  // Braço reto para cima: pulso bem acima da cabeça, próximo da linha central
  const lwStraightUp = lwAboveHead && Math.abs(nlw.x - nls.x) < 0.45 && lArmElevDeg > 55;
  const rwStraightUp = rwAboveHead && Math.abs(nrw.x - nrs.x) < 0.45 && rArmElevDeg > 55;
 
  // Joelhos levantados
  const lkRaised = nle.score > 0.1 && nlk.y < nlh.y;
  const rkRaised = nre.score > 0.1 && nrk.y < nrh.y;
 
  // Simetria entre os dois braços
  const armSymX = Math.abs(Math.abs(nlw.x) - Math.abs(nrw.x)) < 0.30;
  const armSymY = Math.abs(nlw.y - nrw.y) < 0.35;
 
  return {
    // posições normalizadas
    nlw, nrw, nle, nre, nls, nrs, nlh, nrh, nlk, nrk, nla, nra, nno,
    // ângulos
    laArm, raArm, laLeg, raLeg,
    lArmElevDeg, rArmElevDeg,
    // pés
    feetTog, feetNarrow, feetWide, feetVwide, ankleGap,
    // pulsos
    wristsClose, wristGapX,
    // verticais
    lwAboveShld, rwAboveShld, lwAboveHead, rwAboveHead,
    lwBelowHip, rwBelowHip, leAboveShld, reAboveShld,
    // laterais
    lwFarLeft, rwFarRight, lwMidLeft, rwMidRight,
    lwAtSide, rwAtSide,
    // diagonais
    lwDiagUp, rwDiagUp, lwDiagDown, rwDiagDown,
    // horizontais
    lwHoriz, rwHoriz,
    // reto acima
    lwStraightUp, rwStraightUp,
    // joelhos
    lkRaised, rkRaised,
    // simetria
    armSymX, armSymY,
  };
}
 
/* ── Regras por letra ─────────────────────────────────────── */
/*
 * Convenção: s += para requisitos; s -= para penalizações.
 * Soma máxima por letra = 1.0 (normalizado no final).
 * As penalizações reduzem a pontuação quando features
 * contraditórias com a letra estão presentes.
 */
 
const LETTER_RULES = {
 
  // ── A  pernas abertas + braços diag. ACIMA DA CABEÇA, simétrico ──
  A: (f) => {
    let s = 0;
    if (f.feetWide)                          s += 0.25;
    if (f.lwDiagUp && f.rwDiagUp)            s += 0.30;
    if (f.lwAboveHead && f.rwAboveHead)       s += 0.25;
    if (f.armSymX && f.armSymY)               s += 0.20;
    // penalizações
    if (f.feetTog)                            s -= 0.30; // não pode ser V/Y
    if (f.wristsClose)                        s -= 0.20; // não é O
    if (!f.lwDiagUp || !f.rwDiagUp)          s -= 0.20;
    return s;
  },
 
  // ── B  pernas juntas + braço esq. ao lado + dir. dobrado frente ──
  B: (f) => {
    let s = 0;
    if (f.feetTog)                            s += 0.20;
    if (f.lwAtSide)                           s += 0.25;
    if (!f.lwAboveShld)                       s += 0.10;
    if (f.nrw.y < -0.05 && f.nrw.y > -0.90)  s += 0.25;
    if (f.raArm < 115)                        s += 0.20;
    // penalizações
    if (f.rwAboveShld)                        s -= 0.30;
    if (f.lwAboveShld)                        s -= 0.30;
    return s;
  },
 
  // ── C  só braço esq. diag. acima; dir. próximo do torso ──
  C: (f) => {
    let s = 0;
    if (f.lwDiagUp && !f.rwDiagUp)           s += 0.45;
    if (!f.rwAboveShld)                      s += 0.20;
    if (f.nrw.x < 0.45)                      s += 0.15;
    if (f.laArm > 130)                       s += 0.20;
    // penalizações
    if (f.rwDiagUp)                          s -= 0.40;
    if (f.lwHoriz)                           s -= 0.15; // não é L/D
    return s;
  },
 
  // ── D  pernas juntas + esq. horizontal esticado + dir. dobrado ──
  D: (f) => {
    let s = 0;
    if (f.feetTog)                            s += 0.20;
    if (f.lwHoriz)                            s += 0.40;
    if (!f.rwAboveShld && !f.rwFarRight)      s += 0.20;
    if (f.raArm < 130)                        s += 0.20;
    // penalizações
    if (f.rwHoriz)                            s -= 0.40; // seria T/E/H
    if (f.lwAboveHead)                        s -= 0.20;
    if (f.feetWide)                           s -= 0.15;
    return s;
  },
 
  // ── E  braços HORIZONTAIS largos, pernas juntas ──
  E: (f) => {
    let s = 0;
    if (f.lwHoriz && f.rwHoriz)              s += 0.50;
    if (f.feetTog)                           s += 0.20;
    if (f.laArm > 155 && f.raArm > 155)     s += 0.20;
    if (!f.lwAboveHead && !f.rwAboveHead)   s += 0.10;
    // penalizações
    if (f.feetWide)                          s -= 0.30; // seria H
    if (!f.lwFarLeft || !f.rwFarRight)       s -= 0.20;
    return s;
  },
 
  // ── F  esq. reto ACIMA + dir. horizontal ──
  F: (f) => {
    let s = 0;
    if (f.lwStraightUp && !f.rwAboveShld)    s += 0.40;
    if (f.rwHoriz)                           s += 0.35;
    if (f.feetTog)                           s += 0.15;
    if (!f.lwDiagUp)                         s += 0.10; // pulso sobre cabeça, não diagonal
    // penalizações
    if (f.rwStraightUp)                      s -= 0.40; // seria U
    if (f.lwHoriz)                           s -= 0.30; // seria T/E
    return s;
  },
 
  // ── G  dir. horizontal, esq. ao lado ──
  G: (f) => {
    let s = 0;
    if (f.rwHoriz && !f.lwFarLeft)           s += 0.50;
    if (!f.lwAboveShld)                      s += 0.20;
    if (f.raArm > 150)                       s += 0.20;
    if (f.feetTog || f.feetNarrow)           s += 0.10;
    // penalizações
    if (f.lwHoriz)                           s -= 0.40; // seria T/E/H
    if (f.lwDiagUp || f.lwAboveShld)         s -= 0.30;
    return s;
  },
 
  // ── H  pernas ABERTAS + braços horizontais + cotovelos esticados ──
  H: (f) => {
    let s = 0;
    if (f.feetWide)                          s += 0.30;
    if (f.lwHoriz && f.rwHoriz)             s += 0.45;
    if (f.laArm > 155 && f.raArm > 155)    s += 0.25;
    // penalizações
    if (f.feetTog)                           s -= 0.40; // seria T/E
    if (!f.lwFarLeft || !f.rwFarRight)       s -= 0.20;
    return s;
  },
 
  // ── I  boneco em repouso ──
  I: (f) => {
    let s = 0;
    if (f.feetTog)                           s += 0.30;
    if (f.lwAtSide && f.rwAtSide)            s += 0.50;
    if (!f.lwAboveShld && !f.rwAboveShld)   s += 0.20;
    // penalizações
    if (f.lwAboveShld || f.rwAboveShld)      s -= 0.50;
    if (f.lwFarLeft || f.rwFarRight)         s -= 0.30;
    if (f.feetWide)                          s -= 0.20;
    return s;
  },
 
  // ── J  dir. acima curvado + joelho dir. levantado ──
  J: (f) => {
    let s = 0;
    if (f.rwAboveShld && !f.lwAboveShld)    s += 0.30;
    if (f.raArm < 140)                      s += 0.25;
    if (f.rkRaised)                         s += 0.35;
    if (!f.lkRaised)                        s += 0.10;
    // penalizações
    if (f.lwAboveShld)                       s -= 0.30;
    if (f.lkRaised)                          s -= 0.15;
    return s;
  },
 
  // ── K  esq. diag. ACIMA + dir. diag. ABAIXO + pernas abertas ──
  K: (f) => {
    let s = 0;
    if (f.lwDiagUp && f.rwDiagDown)         s += 0.55;
    if (f.feetWide)                         s += 0.20;
    if (f.laArm > 140)                      s += 0.15;
    if (f.raArm > 130)                      s += 0.10;
    // penalizações — distingue de S (cotovelos dobrados) e X (esticado)
    if (f.laArm < 120 || f.raArm < 120)     s -= 0.20; // seria S
    if (!f.feetWide)                         s -= 0.10;
    if (f.rwDiagUp)                         s -= 0.40;
    return s;
  },
 
  // ── L  pernas juntas + só esq. horizontal + dir. ao lado ──
  L: (f) => {
    let s = 0;
    if (f.feetTog)                           s += 0.25;
    if (f.lwHoriz)                           s += 0.45;
    if (f.rwAtSide)                          s += 0.20;
    if (f.laArm > 155)                       s += 0.10;
    // penalizações
    if (f.rwHoriz || f.rwFarRight)           s -= 0.40; // seria T/E
    if (f.lwAboveHead)                       s -= 0.20;
    if (f.feetWide)                          s -= 0.15;
    return s;
  },
 
  // ── M  pernas abertas + ambos diag. acima + cotovelos DOBRADOS ──
  M: (f) => {
    let s = 0;
    if (f.feetWide)                          s += 0.25;
    if (f.lwDiagUp && f.rwDiagUp)           s += 0.35;
    if (f.laArm < 155 && f.raArm < 155)    s += 0.25;  // cotovelos dobrados
    if (!f.lwAboveHead && !f.rwAboveHead)  s += 0.15;  // pulsos não acima da cabeça
    // penalizações — distingue de A (acima cabeça) e V/Y (pés juntos)
    if (f.feetTog)                           s -= 0.40;
    if (f.lwAboveHead || f.rwAboveHead)      s -= 0.25;
    if (f.laArm > 165 || f.raArm > 165)     s -= 0.20; // seria A/V/Y
    return s;
  },
 
  // ── N  pernas abertas + esq. reto ACIMA + dir. diag. ABAIXO ──
  N: (f) => {
    let s = 0;
    if (f.feetWide)                          s += 0.20;
    if (f.lwStraightUp && !f.rwAboveShld)   s += 0.40;
    if (f.rwDiagDown)                       s += 0.30;
    if (!f.lwDiagUp)                        s += 0.10;
    // penalizações
    if (f.rwAboveShld)                       s -= 0.35;
    if (f.feetTog)                           s -= 0.20;
    if (f.lwDiagUp)                         s -= 0.15; // seria K/Z
    return s;
  },
 
  // ── O  braços em arco acima, pulsos JUNTOS, pernas juntas ──
  O: (f) => {
    let s = 0;
    if (f.lwAboveShld && f.rwAboveShld)     s += 0.20;
    if (f.feetTog)                           s += 0.20;
    if (f.wristsClose)                      s += 0.35;
    if (f.laArm < 130 && f.raArm < 130)    s += 0.25;
    // penalizações — distingue de U (pulsos afastados) e Q (joelho)
    if (!f.wristsClose)                     s -= 0.30;
    if (f.rkRaised || f.lkRaised)           s -= 0.35; // seria Q
    if (f.laArm > 155 || f.raArm > 155)    s -= 0.20; // seria U
    return s;
  },
 
  // ── P  pernas juntas + esq. reto ACIMA + dir. dobrado frente ──
  P: (f) => {
    let s = 0;
    if (f.feetTog)                           s += 0.20;
    if (f.lwStraightUp && !f.rwAboveShld)   s += 0.40;
    if (f.raArm < 115)                      s += 0.30;
    if (!f.rwFarRight)                      s += 0.10;
    // penalizações — distingue de R (joelho) e F (dir. horizontal)
    if (f.rkRaised || f.lkRaised)           s -= 0.35; // seria R
    if (f.rwHoriz)                          s -= 0.30; // seria F
    if (f.feetWide)                         s -= 0.20;
    return s;
  },
 
  // ── Q  como O mas com joelho levantado ──
  Q: (f) => {
    let s = 0;
    if (f.lwAboveShld && f.rwAboveShld)     s += 0.20;
    if (f.wristsClose)                      s += 0.25;
    if (f.laArm < 130 && f.raArm < 130)    s += 0.20;
    if (f.rkRaised || f.lkRaised)          s += 0.35;
    // penalizações
    if (!f.rkRaised && !f.lkRaised)         s -= 0.35; // seria O
    if (!f.wristsClose)                     s -= 0.20;
    return s;
  },
 
  // ── R  esq. reto ACIMA + dir. dobrado + joelho dir. levantado ──
  R: (f) => {
    let s = 0;
    if (f.lwStraightUp && !f.rwAboveShld)   s += 0.35;
    if (f.raArm < 115)                      s += 0.25;
    if (f.rkRaised)                         s += 0.30;
    if (!f.lkRaised)                        s += 0.10;
    // penalizações — distingue de P (sem joelho) e J (dir. acima)
    if (!f.rkRaised)                        s -= 0.30; // seria P
    if (f.lwAboveShld && f.rwAboveShld)     s -= 0.20; // seria Q
    return s;
  },
 
  // ── S  esq. diag. ACIMA + dir. diag. ABAIXO + cotovelos DOBRADOS ──
  S: (f) => {
    let s = 0;
    if (f.lwDiagUp && f.rwDiagDown)         s += 0.40;
    if (f.laArm > 115 && f.laArm < 160)    s += 0.20;  // cotovelo ligeiramente dobrado
    if (f.raArm > 115 && f.raArm < 160)    s += 0.20;
    if (f.nlw.x > -0.95 && f.nrw.x < 0.95) s += 0.20;  // braços não totalmente esticados
    // penalizações — distingue de K (cotovelos esticados) e X (mais esticado)
    if (f.laArm > 165 || f.raArm > 165)    s -= 0.25; // seria K ou X
    if (f.feetWide)                         s -= 0.10; // K/X têm pernas abertas com mais certeza
    if (f.rwDiagUp)                         s -= 0.40;
    return s;
  },
 
  // ── T  braços horizontais LARGOS + pernas JUNTAS + cotovelos esticados ──
  T: (f) => {
    let s = 0;
    if (f.lwHoriz && f.rwHoriz)            s += 0.50;
    if (f.feetTog)                          s += 0.30;
    if (f.laArm > 158 && f.raArm > 158)   s += 0.20;
    // penalizações — distingue de H (pernas abertas) e E (idêntico a T mas feetTog)
    if (f.feetWide)                         s -= 0.50; // seria H
    if (!f.lwFarLeft || !f.rwFarRight)      s -= 0.20;
    return s;
  },
 
  // ── U  ambos retos PARA CIMA paralelos + pernas juntas ──
  U: (f) => {
    let s = 0;
    if (f.lwStraightUp && f.rwStraightUp)  s += 0.45;
    if (f.feetTog)                          s += 0.25;
    if (f.laArm > 155 && f.raArm > 155)   s += 0.20;
    if (!f.wristsClose)                    s += 0.10;
    // penalizações — distingue de O (pulsos juntos) e A/V/Y
    if (f.wristsClose)                      s -= 0.30; // seria O
    if (f.lwDiagUp || f.rwDiagUp)          s -= 0.20; // braços mais abertos → A/V/Y
    if (f.feetWide)                         s -= 0.25;
    return s;
  },
 
  // ── V  diag. acima, pernas JUNTAS, cotovelos ESTICADOS ──
  V: (f) => {
    let s = 0;
    if (f.lwDiagUp && f.rwDiagUp)          s += 0.40;
    if (f.feetTog)                          s += 0.35;
    if (f.laArm > 158 && f.raArm > 158)   s += 0.25;
    // penalizações — distingue de A (pernas abertas) e M (cotovelos dobrados) e Y
    if (f.feetWide)                         s -= 0.50; // seria A
    if (f.laArm < 145 || f.raArm < 145)   s -= 0.25; // seria M
    if (f.lwAboveHead && f.rwAboveHead)     s -= 0.15; // seria A
    // V tem os braços menos abertos que Y: wristGapX menor
    if (f.wristGapX > 1.60)               s -= 0.15; // seria Y
    return s;
  },
 
  // ── W  braços LARGOS + cotovelos DOBRADOS + pulsos abaixo dos ombros ──
  W: (f) => {
    let s = 0;
    if (f.lwFarLeft && f.rwFarRight)        s += 0.25;
    if (f.feetWide)                         s += 0.20;
    if (f.laArm < 125 && f.raArm < 125)   s += 0.35;
    if (!f.lwAboveShld && !f.rwAboveShld)  s += 0.20;
    // penalizações — distingue de H/T/E (cotovelos esticados)
    if (f.laArm > 140 || f.raArm > 140)   s -= 0.30; // seria H
    if (f.lwAboveShld || f.rwAboveShld)     s -= 0.20;
    return s;
  },
 
  // ── X  esq. diag. ACIMA + dir. diag. ABAIXO + pernas abertas + ESTICADOS ──
  X: (f) => {
    let s = 0;
    if (f.lwDiagUp && f.rwDiagDown)        s += 0.40;
    if (f.feetWide)                         s += 0.25;
    if (f.laArm > 148 && f.raArm > 148)   s += 0.25;
    if (Math.abs(f.nlw.x - f.nrw.x) > 1.0) s += 0.10;
    // penalizações — distingue de K (mais suave) e S (cotovelos dobrados)
    if (f.laArm < 130 || f.raArm < 130)   s -= 0.20; // seria S
    if (!f.feetWide)                        s -= 0.15;
    if (f.rwDiagUp)                        s -= 0.40;
    return s;
  },
 
  // ── Y  diag. acima MAIS ABERTO que V + pernas JUNTAS ──
  Y: (f) => {
    let s = 0;
    if (f.lwDiagUp && f.rwDiagUp)          s += 0.40;
    if (f.feetTog)                          s += 0.35;
    if (f.laArm > 148 && f.raArm > 148)   s += 0.15;
    // Y distingue-se de V por braços mais abertos (wristGapX maior)
    if (f.wristGapX > 1.40)               s += 0.10;
    // penalizações
    if (f.feetWide)                         s -= 0.50; // seria A
    if (f.laArm < 140 || f.raArm < 140)   s -= 0.20; // seria M
    if (f.wristsClose)                      s -= 0.20; // seria O
    return s;
  },
 
  // ── Z  só esq. diag. acima + só dir. diag. abaixo + pernas abertas ──
  Z: (f) => {
    let s = 0;
    if (f.lwDiagUp && !f.rwDiagUp)         s += 0.25;
    if (f.rwDiagDown && !f.lwDiagDown)     s += 0.25;
    if (f.feetWide)                         s += 0.20;
    if (f.laArm > 145 && f.raArm > 145)   s += 0.20;
    if (!f.rwAboveShld)                    s += 0.10;
    // penalizações
    if (f.rwDiagUp)                        s -= 0.40; // seria A/V/Y
    if (f.laArm < 120 || f.raArm < 120)   s -= 0.15; // seria S
    return s;
  },
};
 
/* ── Classificador principal ───────────────────────────────── */
 
export function classifyPose(keypoints) {
  if (!keypoints || keypoints.length < 17) {
    return { letter: null, confidence: 0, scores: {} };
  }
 
  // Keypoints críticos têm de ser visíveis
  const critical = [KP.LEFT_SHOULDER, KP.RIGHT_SHOULDER, KP.LEFT_HIP, KP.RIGHT_HIP];
  if (!critical.every(i => keypoints[i]?.score >= 0.20)) {
    return { letter: null, confidence: 0, scores: {} };
  }
 
  const f = extractFeatures(keypoints);
  const scores = {};
 
  for (const [letter, fn] of Object.entries(LETTER_RULES)) {
    scores[letter] = Math.max(0, Math.min(1, fn(f)));
  }
 
  // Ordena por pontuação
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestLetter, bestScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;
 
  // Limiar mínimo 0.42 e margem de 0.10 sobre a segunda letra
  if (bestScore < 0.42 || (bestScore - secondScore) < 0.10) {
    return { letter: null, confidence: bestScore, scores };
  }
 
  return { letter: bestLetter, confidence: bestScore, scores };
}
 
/**
 * Pontuação para uma letra específica (feedback em tempo real).
 */
export function scoreForLetter(keypoints, targetLetter) {
  if (!keypoints || keypoints.length < 17) return 0;
  const fn = LETTER_RULES[targetLetter];
  if (!fn) return 0;
  const f = extractFeatures(keypoints);
  return Math.max(0, Math.min(1, fn(f)));
}