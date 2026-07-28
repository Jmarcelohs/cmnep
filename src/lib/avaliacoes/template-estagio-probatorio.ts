import type { AvaliacaoTemplate } from "./templates";

// Critérios e itens são fixos no formulário oficial (Anexo de Avaliação
// Final de Desempenho de Servidor(a) em Estágio Probatório) — não são
// editáveis pelo usuário, por isso vivem em código, não em tabela.
export const TEMPLATE_ESTAGIO_PROBATORIO: AvaliacaoTemplate = {
  id: "estagio_probatorio",
  nome: "Avaliação Final de Desempenho de Servidor(a) em Estágio Probatório",
  conceitos: [
    { key: "otimo", label: "Ótimo", peso: 5 },
    { key: "muito_bom", label: "Muito Bom", peso: 4 },
    { key: "bom", label: "Bom", peso: 3 },
    { key: "regular", label: "Regular", peso: 2 },
    { key: "insuficiente", label: "Insuficiente", peso: 1 },
  ],
  criterios: [
    {
      key: "A",
      nome: "Assiduidade",
      definicao:
        "Comparecimento regular, permanência no local de trabalho, observância do horário de trabalho e cumprimento da carga horária definida para o cargo ocupado.",
      escala: "Ótimo = Nenhuma | Muito Bom = 1 | Bom = 2 | Regular = 3 ou 4 | Insuficiente = Acima de 4",
      itens: [
        { numero: 1, texto: "Faltas injustificadas" },
        { numero: 2, texto: "Atraso ou saídas antecipadas injustificadas" },
        { numero: 3, texto: "Ausências injustificadas durante horário de trabalho" },
        { numero: 4, texto: "Faltas injustificadas à treinamentos" },
      ],
    },
    {
      key: "B",
      nome: "Disciplina",
      definicao:
        "Capacidade para observar e cumprir normas e regulamentos, bem como manter um comportamento adequado ao serviço público e aos padrões éticos do setor público.",
      itens: [
        { numero: 1, texto: "Observa as normas legais e regulamentares" },
        { numero: 2, texto: "Trata com urbanidade as pessoas no ambiente de trabalho" },
        { numero: 3, texto: "Demonstra respeito aos colegas de trabalho" },
        { numero: 4, texto: "Respeita os níveis hierárquicos e a sua Chefia Imediata" },
      ],
    },
    {
      key: "C",
      nome: "Iniciativa",
      definicao:
        "Comportamento proativo no âmbito de atuação, buscando garantir eficiência e eficácia na execução dos trabalhos.",
      itens: [
        {
          numero: 1,
          texto: "Desenvolve as suas atividades sem a necessidade de cobrança constante? Tem iniciativa de trabalho?",
        },
        { numero: 2, texto: "Apresenta ideias e sugestões que contribuam para a melhoria do trabalho" },
        {
          numero: 3,
          texto: "Troca experiência com outros colegas, auxiliando na busca de soluções relativas a problemas de trabalho",
        },
        {
          numero: 4,
          texto: "Colabora voluntariamente com a resolução dos problemas encontrados no seu campo de atuação",
        },
      ],
    },
    {
      key: "D",
      nome: "Produtividade",
      definicao: "Capacidade de alcançar os resultados desejados, com a devida qualidade e no prazo definido.",
      itens: [
        { numero: 1, texto: "Realiza seu trabalho com atenção" },
        {
          numero: 2,
          texto: "O volume de trabalho produzido é proporcional à sua complexidade e aos recursos disponíveis",
        },
        { numero: 3, texto: "Realiza seu trabalho com organização e planejamento" },
        {
          numero: 4,
          texto: "Executa as suas atividades com qualidade no tempo negociado com a Chefia Imediata",
        },
      ],
    },
    {
      key: "E",
      nome: "Responsabilidade",
      definicao:
        "Atuação demonstrada no cumprimento de suas atribuições, documentos e informações e na conservação de equipamentos e materiais.",
      itens: [
        {
          numero: 1,
          texto: "Colabora com a conservação do patrimônio público e utiliza os materiais e equipamentos de maneira racional",
        },
        {
          numero: 2,
          texto:
            "Trata as informações e os documentos com sigilo. Detecta e intervém em situações que venham a acarretar prejuízos aos resultados da área de atuação",
        },
        { numero: 3, texto: "Possui habilidade na comunicação, possui criatividade e visão global?" },
        {
          numero: 4,
          texto: "Executa as suas atividades com ética e profissionalismo, inclusive no atendimento ao público",
        },
      ],
    },
  ],
};
