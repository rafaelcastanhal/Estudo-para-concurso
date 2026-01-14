import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, SyllabusTopic, DifficultyLevel } from "../types";

// User provided key
const DEFAULT_KEY = "AIzaSyArKdoOre76en6coVpwjHK-AQpRH_B1tSU";

const getApiKey = () => localStorage.getItem("gemini_api_key") || DEFAULT_KEY;

// Styles adapted for difficulty
const QUESTION_STYLES = {
  'Iniciante': [
    "DEFINIÇÃO: Pergunte o conceito direto.",
    "ERRO ÓBVIO: Frase com erro gramatical ou lógico claro.",
    "LEI SECA: Texto exato da norma."
  ],
  'Intermediário': [
    "CASO PRÁTICO: Aplicação da regra em situação cotidiana.",
    "LACUNAS: Preencher corretamente.",
    "MÚLTIPLA ESCOLHA: Padrão bancas IBFC/Vunesp."
  ],
  'Avançado': [
    "INTERDISCIPLINAR: Misture conceitos.",
    "JURISPRUDÊNCIA: Entendimento sumulado (STF/STJ) ou exceções.",
    "INTERPRETAÇÃO: Texto denso exigindo inferência."
  ]
};

// Comprehensive coverage for General Public Exams
const TOPIC_SPECIFIC_FOCUS: Record<string, string[]> = {
  'GEN1': [ // Português
    "Crase", "Concordância Verbal", "Regência (Assistir/Visar)", 
    "Pontuação", "Colocação Pronominal", "Conjunções", "Interpretação"
  ],
  'GEN2': [ // RLM
    "Lógica Proposicional", "Silogismos", "Análise Combinatória", 
    "Probabilidade", "Regra de Três", "Conjuntos"
  ],
  'GEN3': [ // Informática
    "Excel (Funções SE/PROCV)", "Segurança (Phishing/Ransomware)", 
    "Redes (Protocolos)", "Windows (Atalhos)", "Nuvem"
  ],
  'GEN4': [ // Constitucional
    "Art. 5º (Direitos)", "Nacionalidade", "Art. 37 (Adm Pública)", 
    "Competências", "Remédios Constitucionais"
  ],
  'GEN5': [ // Administrativo
    "Atos (Elementos/Atributos)", "Poderes", "Adm Indireta", 
    "Responsabilidade Civil", "Improbidade"
  ],
  'GEN6': [ // Atualidades
    "Geopolítica", "Meio Ambiente", "Tecnologia/IA", "Sociedade"
  ]
};

const getRandomItem = (array: string[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Intelligence Layer: Remove conflicting positional references (e.g. "A letra A está certa")
const sanitizeAiText = (text: string): string => {
  if (!text) return "";
  
  // Regex to match phrases like "A alternativa A é...", "Gabarito: Letra B", "Resposta correta é a C"
  const patterns = [
    /A alternativa correta é a (letra\s?)?[A-E]\.?/gi,
    /O gabarito é a (letra\s?)?[A-E]\.?/gi,
    /A resposta certa é a (letra\s?)?[A-E]\.?/gi,
    /^Letra [A-E]\./gim, 
    /\(Letra [A-E]\)/gi
  ];

  let cleaned = text;
  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, "");
  });

  cleaned = cleaned.trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
};

export const generateQuestions = async (
  topic: SyllabusTopic, 
  count: number = 1, 
  difficulty: DifficultyLevel = 'Intermediário'
): Promise<QuizQuestion[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  
  const stylesForLevel = QUESTION_STYLES[difficulty];
  const selectedStyle = getRandomItem(stylesForLevel);
  
  let specificFocusInstruction = "";
  if (TOPIC_SPECIFIC_FOCUS[topic.id]) {
    const specificSubTopic = getRandomItem(TOPIC_SPECIFIC_FOCUS[topic.id]);
    specificFocusInstruction = `Foco: "${specificSubTopic}"`;
  }

  // Optimized prompt for speed and strict JSON adherence
  const prompt = `
    ROLE: Banca Examinadora (FGV/Cebraspe).
    TAREFA: Criar ${count} questão(ões) de ${topic.name} (${difficulty}).
    ${specificFocusInstruction}
    ESTILO: ${selectedStyle}

    REGRAS JSON:
    - "conceptExplanation": Explicação TEÓRICA COMPLETA e DIDÁTICA. Não precisa ser curta. Aprofunde na regra gramatical, princípio jurídico ou conceito lógico. Funcione como uma 'miniaula' escrita.
    - "distractorAnalysis": Explique o erro de cada alternativa incorreta diretamente.
    - "correctExplanation": Explique por que a correta satisfaz a regra.
    - "options": 4 alternativas (Primeira sempre a correta).

    CRÍTICO:
    - NÃO cite "Letra A", "Gabarito" ou posições. O sistema embaralha.
    - "conceptExplanation" deve ser rico em detalhes. Demais campos, concisos.
    - DESTAQUE: Use **asteriscos duplos** (ex: **termo**) para destacar palavras-chave, conceitos e leis. NÃO use aspas para ênfase.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Optimized for speed
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              correctExplanation: { type: Type.STRING },
              distractorAnalysis: { type: Type.ARRAY, items: { type: Type.STRING } },
              conceptExplanation: { type: Type.STRING },
              legalBasis: { type: Type.STRING },
              studyTip: { type: Type.STRING },
              topicRef: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["Iniciante", "Intermediário", "Avançado"] }
            },
            required: ["question", "options", "correctAnswerIndex", "correctExplanation", "distractorAnalysis", "conceptExplanation", "legalBasis", "studyTip", "difficulty"]
          }
        }
      }
    });

    if (response.text) {
      const rawQuestions = JSON.parse(response.text) as QuizQuestion[];

      const shuffledQuestions = rawQuestions.map(q => {
        const cleanExplanation = sanitizeAiText(q.correctExplanation);
        const cleanConcept = sanitizeAiText(q.conceptExplanation);

        const correctOption = { text: q.options[0], isCorrect: true, explanation: "" };
        const wrongOptions = q.options.slice(1).map((opt, idx) => ({
          text: opt,
          isCorrect: false,
          explanation: sanitizeAiText(q.distractorAnalysis[idx]) || "Incorreto."
        }));

        const allOptions = shuffleArray([correctOption, ...wrongOptions]);
        const newOptionsText = allOptions.map(o => o.text);
        const newCorrectIndex = allOptions.findIndex(o => o.isCorrect);
        const letters = ['A', 'B', 'C', 'D', 'E'];
        
        const newDistractorAnalysis = allOptions
          .map((opt, idx) => {
            if (opt.isCorrect) return null;
            return `Alternativa ${letters[idx]}: ${opt.explanation}`;
          })
          .filter((item): item is string => item !== null);

        return {
          ...q,
          options: newOptionsText,
          correctAnswerIndex: newCorrectIndex,
          correctExplanation: cleanExplanation, 
          distractorAnalysis: newDistractorAnalysis,
          conceptExplanation: cleanConcept,
          difficulty: difficulty
        };
      });

      return shuffledQuestions;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};