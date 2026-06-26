# 🚂 TREMU NA OFICINA — v2 (com Câmara + IA)

Jogo de grupo para 4 pessoas com palavras de 4 letras.
A IA reconhece automaticamente a letra que cada jogador forma com o corpo usando a câmara!

## Dependências

- Node.js v18+
- npm v9+

## Instalação

```bash
npm install
npm start
```

Abre em `http://localhost:3000`

## Dependências instaladas

| Pacote | Versão | Para quê |
|---|---|---|
| react | ^18.2.0 | Framework UI |
| react-dom | ^18.2.0 | Renderização |
| react-scripts | 5.0.1 | Build tool (CRA) |
| @tensorflow/tfjs | ^4.17.0 | Motor de IA no browser |
| @tensorflow/tfjs-backend-webgl | ^4.17.0 | Aceleração GPU (WebGL) |
| @tensorflow-models/pose-detection | ^2.1.3 | MoveNet — deteção de pose humana |

## Como funciona a IA

1. A câmara captura vídeo em tempo real
2. **MoveNet** (modelo leve, corre no browser) deteta 17 keypoints do corpo
3. `poseClassifier.js` analisa ângulos e posições dos membros
4. Quando o corpo forma a letra correta por **10 frames consecutivos** → letra confirmada!

## Funcionalidades

-  **4 câmaras** simultâneas (uma por jogador)
-  **Reconhecimento automático** de poses com MoveNet
-  **Modo manual** como fallback 
-  Temporizador de 90 segundos
-  Sistema de dicas com penalização
-  Ranking final com histórico

## Para Codespace

``bash`
npm install && npm start
# Torna a porta 3000 pública no menu "Ports"
```

**Nota:** A câmara requer HTTPS ou localhost. No Codespace funciona automaticamente.
