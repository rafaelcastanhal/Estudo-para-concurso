import { SyllabusTopic } from './types';

// Base Comum para Concursos Públicos (Nível Médio e Superior)
export const SYLLABUS: SyllabusTopic[] = [
  {
    id: 'GEN1',
    name: 'Língua Portuguesa',
    description: 'Ortografia, Morfologia, Sintaxe, Pontuação, Crase, Concordância, Regência e Interpretação de Texto.',
    icon: 'menu_book'
  },
  {
    id: 'GEN2',
    name: 'Raciocínio Lógico e Matemático',
    description: 'Lógica Proposicional, Conjuntos, Análise Combinatória, Probabilidade, Regra de Três, Porcentagem e Geometria.',
    icon: 'calculate'
  },
  {
    id: 'GEN3',
    name: 'Informática para Concursos',
    description: 'Hardware, Windows/Linux, Word/Excel/Calc, Redes, Internet, Segurança da Informação e Nuvem.',
    icon: 'computer'
  },
  {
    id: 'GEN4',
    name: 'Direito Constitucional',
    description: 'Direitos Fundamentais (Art. 5º), Nacionalidade, Organização do Estado e Administração Pública (Art. 37).',
    icon: 'gavel'
  },
  {
    id: 'GEN5',
    name: 'Direito Administrativo',
    description: 'Princípios, Poderes, Atos Administrativos, Organização Administrativa, Responsabilidade Civil e Licitações.',
    icon: 'account_balance'
  },
  {
    id: 'GEN6',
    name: 'Atualidades e Conhecimentos Gerais',
    description: 'Política, Economia, Sociedade, Cultura, Meio Ambiente e Tecnologia (Brasil e Mundo).',
    icon: 'public'
  }
];

export const PLACEHOLDER_QUESTIONS: any[] = [
  {
    question: "No que tange à regência verbal, assinale a alternativa que está em conformidade com a norma-padrão:",
    options: [
      "O aluno obedeceu o regulamento da escola.",
      "Todos assistiram ao filme com grande interesse.",
      "Eu namoro com a Maria há dois anos.",
      "Chegamos no aeroporto pontualmente."
    ],
    correctAnswerIndex: 1,
    explanation: "O verbo 'Assistir' no sentido de ver/presenciar exige preposição 'a'. 'Obedecer' exige 'a' (ao regulamento). 'Namorar' é transitivo direto (não usa 'com'). 'Chegar' exige 'a' (ao aeroporto).",
    topicRef: "GEN1 - Regência",
    difficulty: "Intermediário"
  }
];