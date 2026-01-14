import React, { useState, useEffect, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { QuizArea } from './components/QuizArea';
import { ApiKeyModal } from './components/ApiKeyModal';
import { generateQuestions } from './services/geminiService';
import { SyllabusTopic, QuizQuestion, AppState, UserStats, DifficultyLevel } from './types';

const STATS_STORAGE_KEY = 'concurso_base_user_stats';
const THEME_STORAGE_KEY = 'concurso_base_theme';

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>(AppState.MENU);
  const [currentTopic, setCurrentTopic] = useState<SyllabusTopic | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('Intermediário');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Animation Direction State
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');

  // Theme Management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Queue Management
  const [questionsQueue, setQuestionsQueue] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [batchAnswers, setBatchAnswers] = useState<Record<number, number>>({});
  
  // Ref to prevent duplicate background fetches
  const isFetchingBackgroundRef = useRef(false);

  const [isKeyModalOpen, setKeyModalOpen] = useState(false);
  
  // Persistent Stats
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem(STATS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      totalAnswered: 0,
      correct: 0,
      streak: 0,
      masteryByTopic: {}
    };
  });

  // Watch for queue updates when in LOADING state
  useEffect(() => {
    if (currentState === AppState.LOADING && questionsQueue.length > currentQuestionIndex) {
      setCurrentState(AppState.QUIZ);
    }
  }, [questionsQueue.length, currentQuestionIndex, currentState]);

  const fetchNextQuestionInBackground = async (topic: SyllabusTopic, difficulty: DifficultyLevel, indexToCheck?: number) => {
    const activeIndex = indexToCheck ?? currentQuestionIndex;

    // RULE: Always have 2 questions ahead of the active index.
    if (questionsQueue.length > activeIndex + 2) {
      return;
    }

    if (isFetchingBackgroundRef.current) return;
    
    try {
      isFetchingBackgroundRef.current = true;
      // Pass difficulty to generator
      const newQuestions = await generateQuestions(topic, 1, difficulty);
      setQuestionsQueue(prev => [...prev, ...newQuestions]);
    } catch (error) {
      console.error("Background fetch failed", error);
    } finally {
      isFetchingBackgroundRef.current = false;
    }
  };

  const handleStartQuiz = async (topic: SyllabusTopic, difficulty: DifficultyLevel) => {
    setCurrentTopic(topic);
    setCurrentDifficulty(difficulty);
    setCurrentState(AppState.LOADING);
    setQuestionsQueue([]);
    setBatchAnswers({});
    setCurrentQuestionIndex(0);
    setSlideDirection('forward');
    isFetchingBackgroundRef.current = false;

    try {
      // 1. FAST LOAD: Generate only 1 question to start immediately
      const initialQuestions = await generateQuestions(topic, 1, difficulty);
      setQuestionsQueue(initialQuestions);
      setCurrentState(AppState.QUIZ);

      // 2. BUFFER FILL: Immediately fetch 2 more questions in background
      // Use ref to lock concurrent fetches during this initial fill
      isFetchingBackgroundRef.current = true;
      generateQuestions(topic, 2, difficulty)
        .then(bufferQuestions => {
           setQuestionsQueue(prev => [...prev, ...bufferQuestions]);
        })
        .catch(err => console.error("Background buffer generation failed", err))
        .finally(() => {
           isFetchingBackgroundRef.current = false;
        });

    } catch (error) {
      console.error("Failed to load initial questions", error);
      alert("Erro ao gerar questões. Verifique sua chave API ou tente novamente.");
      setCurrentState(AppState.MENU);
    }
  };

  const handleAnswer = (optionIndex: number, isCorrect: boolean) => {
    setBatchAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));

    setStats(prev => {
      const currentMastery = currentTopic ? (prev.masteryByTopic[currentTopic.id] || 0) : 0;
      const increment = isCorrect ? 5 : 1; 
      const newMastery = Math.min(100, currentMastery + increment);

      const newStats = {
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        streak: isCorrect ? prev.streak + 1 : 0,
        masteryByTopic: currentTopic ? {
          ...prev.masteryByTopic,
          [currentTopic.id]: newMastery
        } : prev.masteryByTopic
      };
      
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
      return newStats;
    });

    if (currentTopic) {
       fetchNextQuestionInBackground(currentTopic, currentDifficulty, currentQuestionIndex);
    }
  };

  const handleResetTopic = (topicId: string) => {
    if (window.confirm("Tem certeza que deseja zerar seu progresso neste tópico?")) {
      setStats(prev => {
        const newStats = {
          ...prev,
          masteryByTopic: {
            ...prev.masteryByTopic,
            [topicId]: 0
          }
        };
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
        return newStats;
      });
    }
  };

  const handleNext = async () => {
    if (!currentTopic) return;
    
    setSlideDirection('forward');
    const nextIndex = currentQuestionIndex + 1;

    fetchNextQuestionInBackground(currentTopic, currentDifficulty, nextIndex);

    if (nextIndex < questionsQueue.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      setCurrentQuestionIndex(nextIndex); 
      setCurrentState(AppState.LOADING);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setSlideDirection('backward');
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < questionsQueue.length) {
      if (index > currentQuestionIndex) setSlideDirection('forward');
      else setSlideDirection('backward');
      
      setCurrentQuestionIndex(index);
      
      if (currentTopic) {
        fetchNextQuestionInBackground(currentTopic, currentDifficulty, index);
      }
    }
  };

  const handleBackToMenu = () => {
    setCurrentState(AppState.MENU);
    setCurrentTopic(null);
    setQuestionsQueue([]);
    setBatchAnswers({});
    setCurrentQuestionIndex(0);
    isFetchingBackgroundRef.current = false;
  };

  const currentQuestion = questionsQueue[currentQuestionIndex];

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-slate-900 transition-colors duration-300">
      <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setKeyModalOpen(false)} onSave={() => {}} />

      {/* Sidebar Navigation */}
      <aside className={`
        flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex h-full shrink-0 z-20 transition-all duration-300 ease-in-out overflow-hidden
        ${isSidebarOpen ? 'w-64 border-r opacity-100' : 'w-0 border-none opacity-0'}
      `}>
        <div className="p-6 w-64">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary rounded-lg p-2 flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div>
              <h1 className="text-institutional-navy dark:text-slate-100 text-lg font-bold leading-tight">Base Concursos</h1>
              <p className="text-slate-500 text-xs font-medium">Preparação Geral</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            <button 
              onClick={handleBackToMenu}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                currentState === AppState.MENU 
                ? 'bg-[#e7f3eb] dark:bg-primary/20 border-l-4 border-primary text-institutional-navy dark:text-white font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm">Matérias</span>
            </button>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              currentState === AppState.QUIZ || currentState === AppState.LOADING 
              ? 'bg-[#e7f3eb] dark:bg-primary/20 border-l-4 border-primary text-institutional-navy dark:text-white font-bold' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}>
              <span className="material-symbols-outlined">quiz</span>
              <span className="text-sm">Estudando</span>
            </div>
            <button onClick={() => setKeyModalOpen(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm">Configurar API</span>
            </button>
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800 w-64">
           <div className="flex items-center gap-3">
             <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                <span className="material-symbols-outlined">person</span>
             </div>
             <div>
               <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Estudante</p>
               <p className="text-[10px] text-primary dark:text-blue-400 font-bold">Foco Total</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-colors duration-300">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 shrink-0 transition-colors duration-300">
           <div className="flex items-center gap-4">
              <button 
                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                 className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                 title={isSidebarOpen ? "Ocultar Menu" : "Mostrar Menu"}
              >
                 <span className="material-symbols-outlined">
                    {isSidebarOpen ? 'menu_open' : 'menu'}
                 </span>
              </button>
              
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                 <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                 <span>{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold border border-orange-100 dark:border-orange-800/50">
                <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                {stats.streak} Dias
              </div>
              
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all"
                title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
              >
                 <span className="material-symbols-outlined">
                   {isDarkMode ? 'light_mode' : 'dark_mode'}
                 </span>
              </button>
           </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-slate-950 transition-colors duration-300">
          {currentState === AppState.MENU && (
            <Dashboard 
              onSelectTopic={handleStartQuiz} 
              onResetTopic={handleResetTopic}
              stats={stats} 
            />
          )}

          {currentState === AppState.LOADING && (
            <div className="flex flex-col items-center justify-center h-full pb-20 fade-in">
              <div className="relative">
                 <div className="size-16 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-primary animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <span className="material-symbols-outlined text-primary">psychology</span>
                 </div>
              </div>
              <h2 className="text-xl font-bold text-institutional-navy dark:text-slate-100 mt-6">
                 {questionsQueue.length === 0 ? "Preparando Desafio..." : "Carregando..."}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Nível: <span className="font-bold text-primary">{currentDifficulty}</span> | Assunto: {currentTopic?.name}
              </p>
            </div>
          )}

          {currentState === AppState.QUIZ && currentQuestion && currentTopic && (
            <QuizArea 
              key={`${currentTopic.id}-${currentQuestionIndex}`}
              question={currentQuestion} 
              allQuestions={questionsQueue}
              topic={currentTopic}
              currentIndex={currentQuestionIndex}
              direction={slideDirection}
              userAnswers={batchAnswers}
              onBack={handleBackToMenu}
              onAnswer={handleAnswer}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onJumpToQuestion={handleJumpToQuestion}
            />
          )}
        </div>
      </main>
    </div>
  );
}