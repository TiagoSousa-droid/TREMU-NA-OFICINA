/* ============================================================
   words.js
   ------------------------------------------------------------
   Lista de palavras do jogo, organizadas por categoria.
   Cada palavra tem:
     w -> a própria palavra (sempre 4 letras, em maiúsculas)
     h -> uma dica/explicação
     c -> o nome da categoria (mostrado no ecrã de revelação)

   As funções no fundo do ficheiro:
     getAllWords(category) -> devolve a lista de palavras de
        uma categoria, ou de TODAS se category === 'all'
     shuffleArray(array)   -> devolve uma cópia do array com
        a ordem dos elementos embaralhada (aleatória)
   ============================================================ */

export const WORDS = {
  tools: [
    { w: 'FACA', h: 'Utensílio cortante de metal', c: 'Ferramentas', d: 1 },
    { w: 'LIMA', h: 'Ferramenta de lixar metais', c: 'Ferramentas', d: 1 },
    { w: 'PINO', h: 'Peça de fixação cilíndrica', c: 'Ferramentas', d: 1 },
    { w: 'CABO', h: 'Parte para segurar ferramenta', c: 'Ferramentas', d: 1 },
    { w: 'VISE', h: 'Dispositivo de fixação', c: 'Ferramentas', d: 2 },
    { w: 'ANEL', h: 'Peça circular de vedação', c: 'Ferramentas', d: 1 },
    { w: 'ARCO', h: 'Serra em arco para metal', c: 'Ferramentas', d: 2 },
  ],

  tech: [
    { w: 'JAVA', h: 'Linguagem de programação', c: 'Tecnologia', d: 1 },
    { w: 'NODE', h: 'Runtime JavaScript servidor', c: 'Tecnologia', d: 1 },
    { w: 'HTML', h: 'Linguagem da web', c: 'Tecnologia', d: 1 },
    { w: 'JSON', h: 'Formato de dados', c: 'Tecnologia', d: 1 },
    { w: 'REST', h: 'Arquitetura de APIs', c: 'Tecnologia', d: 2 },
    { w: 'HTTP', h: 'Protocolo web', c: 'Tecnologia', d: 1 },
    { w: 'REPO', h: 'Repositório de código', c: 'Tecnologia', d: 1 },
    { w: 'CODE', h: 'Instruções para computador', c: 'Tecnologia', d: 1 },
    { w: 'HOOK', h: 'Função React especial', c: 'Tecnologia', d: 2 },
    { w: 'BOOL', h: 'Verdadeiro ou falso', c: 'Tecnologia', d: 1 },
  ],

  misc: [
    { w: 'TREM', h: 'Veículo sobre carris', c: 'Geral', d: 1 },
    { w: 'CORE', h: 'Núcleo ou centro', c: 'Geral', d: 1 },
    { w: 'BASE', h: 'Fundação de algo', c: 'Geral', d: 1 },
    { w: 'RODA', h: 'Peça circular que gira', c: 'Geral', d: 1 },
    { w: 'REDE', h: 'Conjunto de ligações', c: 'Geral', d: 1 },
    { w: 'META', h: 'Objetivo final', c: 'Geral', d: 1 },
    { w: 'ERRO', h: 'Falha ou engano', c: 'Geral', d: 1 },
    { w: 'FOGO', h: 'Combustão com calor', c: 'Geral', d: 1 },
    { w: 'BOLA', h: 'Objeto esférico', c: 'Geral', d: 1 },
    { w: 'MAPA', h: 'Representação de território', c: 'Geral', d: 1 },
  ],
};
// Devolve a lista de palavras de uma categoria (só as de 4 letras).
// Se category for 'all' (ou não for indicada), junta as 3 categorias.
export function getAllWords(category = 'all') {
  const fourLetterOnly = (arr) => arr.filter((item) => item.w.length === 4);

  if (category === 'all') {
    return fourLetterOnly([
      ...WORDS.tools,
      ...WORDS.tech,
      ...WORDS.misc,
    ]);
  }
  return fourLetterOnly(WORDS[category] || WORDS.misc);
}

// Embaralha um array (algoritmo de Fisher-Yates), sem alterar o original.
// É usado para escolher palavras aleatórias para as rondas.
export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
