import React, { useRef, useEffect, useState, useCallback } from 'react';
import styles from './CameraView.module.css';
import { classifyPose, scoreForLetter } from '../data/poseClassifier';

/**
 * Ligações entre keypoints para desenhar o esqueleto
 */
const SKELETON = [
  [5,6],[5,7],[7,9],[6,8],[8,10],
  [5,11],[6,12],[11,12],
  [11,13],[13,15],[12,14],[14,16],
];

/**
 * Define cores por grupos de keypoints
 */
function kpColor(i) {
  if (i <= 4)  return '#93c5fd';
  if (i <= 10) return '#3b82f6';
  if (i <= 12) return '#38bdf8';
  return '#1d4ed8';
}

/**
 * Detector partilhado (evita múltiplas instâncias do modelo)
 */
let sharedDetector = null;
let loadingPromise = null;

/**
 * Carrega o modelo de pose estimation (MoveNet)
 */
async function getDetector() {
  if (sharedDetector) return sharedDetector;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const tf = await import('@tensorflow/tfjs');
    await import('@tensorflow/tfjs-backend-webgl');

    await tf.setBackend('webgl');
    await tf.ready();

    const pd = await import('@tensorflow-models/pose-detection');

    sharedDetector = await pd.createDetector(
      pd.SupportedModels.MoveNet,
      {
        modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      }
    );

    return sharedDetector;
  })();

  return loadingPromise;
}

/**
 * Configuração de performance e estabilidade
 */
const CONFIRM_FRAMES = 6;        // número de frames para confirmar uma letra
const DETECT_INTERVAL_MS = 150;   // intervalo entre inferências do modelo

/**
 * Componente principal da câmara + pose estimation
 */
export default function CameraView({
  targetLetter,
  onLetterDetected,
  active,
  playerNum
}) {

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);

  // contador para confirmação de letras
  const confirmRef = useRef(0);

  // refs para evitar re-render desnecessário no loop
  const activeRef = useRef(active);
  const targetRef = useRef(targetLetter);

  // controlo de performance (evita deteção em todos os frames)
  const lastDetectTimeRef = useRef(0);
  const lastPoseRef = useRef(null);

  /**
   * Estados da UI
   */
  const [status, setStatus] = useState('loading');
  const [loadMsg, setLoadMsg] = useState('A carregar IA...');
  const [detected, setDetected] = useState(null);
  const [confidence, setConf] = useState(0);
  const [tScore, setTScore] = useState(0);
  const [confPct, setConfPct] = useState(0);

  /**
   * Atualiza refs quando props mudam
   */
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { targetRef.current = targetLetter; }, [targetLetter]);

  /**
   * Loop principal de processamento (câmara + IA + desenho)
   */
  const loop = useCallback(async (det) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    // espera pela câmara estar pronta
    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => loop(det));
      return;
    }

    const W = video.videoWidth || 640;
    const H = video.videoHeight || 480;

    // ajusta canvas ao tamanho do vídeo
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }

    const ctx = canvas.getContext('2d');

    /**
     * Desenha vídeo espelhado (efeito selfie)
     */
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-W, 0);
    ctx.drawImage(video, 0, 0, W, H);
    ctx.restore();

    try {
      const now = performance.now();
      let poses;

      /**
       * Limita frequência de inferência para performance
       */
      if (now - lastDetectTimeRef.current >= DETECT_INTERVAL_MS) {
        lastDetectTimeRef.current = now;
        poses = await det.estimatePoses(video);
        lastPoseRef.current = poses;
      } else {
        poses = lastPoseRef.current || [];
      }

      if (poses.length > 0) {

        const kps = poses[0].keypoints;

        // espelha X para alinhar com o canvas
        const mkps = kps.map(k => ({ ...k, x: W - k.x }));

        /**
         * Desenho do esqueleto
         */
        ctx.lineWidth = 3;

        for (const [a, b] of SKELETON) {
          const pa = mkps[a];
          const pb = mkps[b];

          if (!pa || !pb || pa.score < 0.2 || pb.score < 0.2) continue;

          ctx.strokeStyle = kpColor(a) + 'aa';
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }

        /**
         * Desenho dos keypoints
         */
        for (let i = 0; i < mkps.length; i++) {
          const k = mkps[i];
          if (!k || k.score < 0.2) continue;

          ctx.fillStyle = kpColor(i);
          ctx.beginPath();
          ctx.arc(k.x, k.y, i <= 4 ? 5 : 7, 0, 2 * Math.PI);
          ctx.fill();
        }

        /**
         * Classificação da pose
         */
        if (activeRef.current) {

          const result = classifyPose(kps);
          const ts = scoreForLetter(kps, targetRef.current);

          setDetected(result.letter);
          setConf(result.confidence);
          setTScore(ts);

          /**
           * Sistema de confirmação por frames consecutivos
           */
          if (result.letter === targetRef.current) {
            confirmRef.current += 1;

            const pct = Math.min(
              100,
              Math.round((confirmRef.current / CONFIRM_FRAMES) * 100)
            );

            setConfPct(pct);

            if (confirmRef.current >= CONFIRM_FRAMES) {
              confirmRef.current = 0;
              setConfPct(0);
              onLetterDetected(targetRef.current);
            }

          } else {
            confirmRef.current = 0;
            setConfPct(0);
          }

        } else {
          confirmRef.current = 0;
          setConfPct(0);
        }

      } else {
        setDetected(null);
        setConf(0);
        setTScore(0);
        confirmRef.current = 0;
        setConfPct(0);
      }

    } catch (_) {
      // falha silenciosa para evitar crash do loop
    }

    rafRef.current = requestAnimationFrame(() => loop(det));
  }, [onLetterDetected]);

  /**
   * Inicialização: câmara + modelo IA
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadMsg('A carregar modelo IA...');

        const det = await getDetector();
        if (cancelled) return;

        setLoadMsg('A abrir câmara...');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        setStatus('running');
        loop(det);

      } catch (err) {
        if (cancelled) return;

        setStatus(
          err.name === 'NotAllowedError' ||
          err.name === 'NotFoundError'
            ? 'no_camera'
            : 'error'
        );
      }
    })();

    /**
     * Cleanup ao desmontar componente
     */
    return () => {
      cancelled = true;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const isMatch = detected === targetLetter && active;

  /**
   * UI principal
   */
  return (
    <div className={styles.wrapper}>

      <video ref={videoRef} className={styles.hiddenVideo} playsInline muted />
      <canvas ref={canvasRef} className={styles.canvas} />

      {status === 'loading' && (
        <div className={styles.overlay}>
          <div className={styles.spinner} />
          <p className={styles.loadTxt}>{loadMsg}</p>
        </div>
      )}

      {status === 'no_camera' && (
        <div className={styles.overlay}>
          <p>Câmara indisponível</p>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.overlay}>
          <p>Erro ao carregar IA</p>
        </div>
      )}

      {status === 'running' && active && (
        <div className={styles.hud}>


          {isMatch && (
            <div>Confirmação: {confPct}%</div>
          )}

          <div>
          </div>
        </div>
      )}

      {status === 'running' && !active && (
        <div>A aguardar vez</div>
      )}
    </div>
  );
}