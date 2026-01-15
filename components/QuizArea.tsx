import React, { useState, useEffect } from 'react';
import { QuizQuestion, SyllabusTopic } from '../types';
import { Scissors } from 'lucide-react'; // Import icon

interface Props {
  question: QuizQuestion;
  allQuestions: QuizQuestion[];
  topic: SyllabusTopic;
  currentIndex: number;
  direction: 'forward' | 'backward'; // New prop for animation direction
  userAnswers: Record<number, number>; // Maps question index to selected option index
  onBack: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onJumpToQuestion: (index: number) => void;
  onAnswer: (optionIndex: number, isCorrect: boolean) => void;
}

export const QuizArea: React.FC<Props> = ({ 
  question, 
  allQuestions,
  topic, 
  currentIndex, 
  direction,
  userAnswers,
  onBack, 
  onNext, 
  onPrevious, 
  onJumpToQuestion,
  onAnswer 
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // State to track visually eliminated options (The "Scissor" feature)
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);

  // Restore state if this question was already answered
  useEffect(() => {
    const savedAnswer = userAnswers[currentIndex];
    
    // Reset eliminated options when changing question
    setEliminatedOptions([]);

    if (savedAnswer !== undefined) {
      setSelectedOption(savedAnswer);
      setIsSubmitted(true);
    } else {
      // If it's a new question (not in history), reset
      setSelectedOption(null);
      setIsSubmitted(false);
    }
  }, [currentIndex, userAnswers]);

  const handleSelect = (index: number) => {
    if (isSubmitted) return;
    // Prevent selecting if it's eliminated (optional, but good UX)
    if (eliminatedOptions.includes(index)) return;
    
    setSelectedOption(index);
  };

  const handleEliminate = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); // Prevent selecting the option
    if (isSubmitted) return;

    setEliminatedOptions(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index); // Un-eliminate
      }
      return [...prev, index]; // Eliminate
    });
    
    // If we eliminate the currently selected option, deselect it
    if (selectedOption === index) {
      setSelectedOption(null);
    }
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
    onAnswer(selectedOption, selectedOption === question.correctAnswerIndex);
  };

  // Helper to render Markdown bold (e.g. **text**) as <strong> text
  // Used ONLY for Question Command and Options
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    
    // Split by markdown bold markers: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove the ** markers and wrap in strong
        return <strong key={index} className="font-extrabold text-inherit">{part.slice(2, -2)}</strong>;
      }
      // Unwrap brackets if they exist (legacy behavior) and just return the part
      return part.replace(/\[(.*?)\]/g, '$1');
    });
  };

  // Helper to STRIP formatting (remove **) for Explanations/Feedback
  const stripFormatting = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\*\*/g, '')   // Remove bold markers
      .replace(/__/g, '')     // Remove italic markers
      .replace(/\[.*?\]/g, (match) => match.slice(1, -1)); // Unwrap brackets
  };

  // Function to render option text beautifully, handling separators like '|'
  const renderOptionContent = (text: string) => {
    if (text.includes('|')) {
      return (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {text.split('|').map((part, i, arr) => (
            <React.Fragment key={i}>
              <span className={i === 0 ? "font-medium" : "font-normal opacity-90"}>
                {renderFormattedText(part.trim())}
              </span>
              {i < arr.length - 1 && (
                <span className="text-primary/40 dark:text-primary/60 font-light text-[10px] px-1 bg-primary/5 dark:bg-primary/10 rounded-full">
                  &bull;
                </span>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }
    return renderFormattedText(text);
  };

  const letters = ['A', 'B', 'C', 'D', 'E'];
  const incorrectIndices = question.options.map((_, i) => i).filter(i => i !== question.correctAnswerIndex);
  
  // Determine animation class based on direction
  const animationClass = direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left';

  return (
    <div className="w-full max-w-[1200px] mx-auto p-2 md:p-4 flex flex-col gap-5 pb-20 relative h-full">
      
      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#0d141b] dark:text-white">Histórico da Sessão</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Navegue pelas questões geradas</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <span className="material-symbols-outlined dark:text-slate-300">close</span>
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-3">
              {allQuestions.map((q, idx) => {
                const answerIdx = userAnswers[idx];
                const isAnswered = answerIdx !== undefined;
                const isCorrect = isAnswered && answerIdx === q.correctAnswerIndex;
                const isActive = idx === currentIndex;

                return (
                  <div 
                    key={idx}
                    onClick={() => {
                      onJumpToQuestion(idx);
                      setShowReviewModal(false);
                    }}
                    className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                      isActive 
                      ? 'border-primary ring-1 ring-primary bg-primary/5 dark:bg-primary/10' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      !isAnswered 
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                        : isCorrect 
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400'
                    }`}>
                       {isAnswered ? (
                         <span className="material-symbols-outlined text-lg">{isCorrect ? 'check' : 'close'}</span>
                       ) : (
                         <span>{idx + 1}</span>
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-[#0d141b] dark:text-slate-200 truncate">Questão {idx + 1}</p>
                       {/* Strip formatting for the review list preview */}
                       <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{stripFormatting(q.question)}</p>
                    </div>
                    {isActive && <span className="text-xs font-bold text-primary uppercase tracking-wider">Atual</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- DETACHED HEADER SECTION --- */}
      {/* ADDED fade-in class to keep header stable but appearing smoothly */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 fade-in">
          
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={onBack}
                className="flex items-center justify-center size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-200 hover:shadow-sm transition-all shrink-0"
                title="Sair para o Menu"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Estudo Reverso</span>
                <h2 className="text-lg font-bold text-[#0d141b] dark:text-slate-100 truncate leading-tight">
                    {topic.name}
                </h2>
              </div>
          </div>

          {/* Right: Floating Controls */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
              <span className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border shadow-sm ${
                question.difficulty === 'Difícil' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50' : 
                question.difficulty === 'Médio' ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-900/50' : 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/50'
              }`}>
                {question.difficulty}
              </span>

              {/* Navigation Pill */}
              <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <button 
                    onClick={onPrevious} 
                    disabled={currentIndex === 0}
                    className="size-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <div 
                    className="px-3 text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[90px] text-center cursor-pointer hover:text-primary transition-colors flex items-center justify-center gap-1 border-x border-slate-100 dark:border-slate-700/50 h-5"
                    onClick={() => setShowReviewModal(true)}
                  >
                    Questão {currentIndex + 1}
                    <span className="material-symbols-outlined text-[16px] opacity-40">expand_more</span>
                  </div>
                  <button 
                    onClick={onNext} 
                    className="size-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
              </div>
          </div>
      </div>

      {/* --- QUESTION CARD (DETACHED) --- */}
      {/* APPLIED animationClass here for specific slide effect on the card only */}
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300 shrink-0 flex flex-col p-5 md:p-8 ${animationClass}`}>
          
          {/* Meta Info Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 md:mb-6">
            <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-blue-500 px-2 py-1 rounded-md shadow-sm shadow-primary/20">
                  <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                  Questão Inédita
                </span>
            </div>
            <span className="text-[10px] md:text-xs text-slate-400 font-mono text-right md:text-left truncate max-w-full">
               Ref: {question.topicRef || "Geral"}
            </span>
          </div>

          <div className="mb-6 md:mb-8">
            <p className="text-[#0d141b] dark:text-slate-200 text-base md:text-lg leading-relaxed font-medium text-left">
              {/* USE FORMATTED TEXT FOR QUESTION */}
              {renderFormattedText(question.question)}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {question.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = question.correctAnswerIndex === idx;
              const isEliminated = eliminatedOptions.includes(idx);
              
              // Styles
              let cardClass = "relative group flex items-start gap-3 py-3 md:py-3.5 pr-3 md:pr-3.5 pl-10 md:pl-12 rounded-xl border cursor-pointer transition-all ";
              let letterClass = "mt-0.5 flex items-center justify-center w-6 h-6 rounded-md border text-xs font-bold shrink-0 transition-all duration-200 ";
              let textClass = `text-sm md:text-base ${isSubmitted && isCorrect ? 'font-bold text-green-900 dark:text-green-300' : 'text-[#0d141b] dark:text-slate-200'}`;

              // Apply styles based on state
              if (isEliminated) {
                cardClass += "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60 ";
                letterClass += "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 ";
                textClass += " line-through decoration-slate-400 text-slate-400 dark:text-slate-500";
              }
              else if (!isSubmitted) {
                // Active State (Pre-submit)
                cardClass += isSelected 
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm ring-1 ring-primary/50" 
                  : "border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50";
                
                letterClass += isSelected 
                  ? "bg-primary text-white border-primary shadow-md scale-110" 
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 group-hover:border-primary group-hover:text-primary dark:group-hover:text-primary";
                  
              } else {
                // Result State (Post-submit)
                if (isCorrect) {
                   cardClass += "border-green-500 bg-green-50 dark:bg-green-900/10 ring-1 ring-green-500/20";
                   letterClass += "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-transparent";
                } 
                else if (isSelected && !isCorrect) {
                   cardClass += "border-red-500/50 bg-red-50 dark:bg-red-900/10 ring-1 ring-red-500/20";
                   letterClass += "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-transparent";
                } 
                else {
                   cardClass += "border-slate-200 dark:border-slate-700 opacity-60 grayscale-[0.5]";
                   letterClass += "bg-slate-50 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700";
                }
              }

              return (
                <div key={idx} onClick={() => handleSelect(idx)} className={cardClass}>
                  {/* Scissor Action - Positioned inside padding */}
                  {!isSubmitted && (
                    <div 
                      className={`absolute left-2 md:left-3 top-4 p-1 cursor-pointer transition-all duration-200 z-10 ${
                        isEliminated ? 'opacity-100 text-red-400' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400'
                      }`}
                      onClick={(e) => handleEliminate(e, idx)}
                      title={isEliminated ? "Restaurar alternativa" : "Eliminar alternativa"}
                    >
                      <Scissors size={16} className={isEliminated ? "" : "hover:scale-110 transition-transform"} />
                    </div>
                  )}

                  <div className={letterClass}>
                    {letters[idx]}
                  </div>
                  <div className="flex-1">
                    <span className={textClass}>
                      {/* USE FORMATTED TEXT FOR OPTIONS */}
                      {renderOptionContent(option)}
                    </span>
                  </div>
                  {isSubmitted && isCorrect && <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-lg">check_circle</span>}
                  {isSubmitted && isSelected && !isCorrect && <span className="material-symbols-outlined text-red-500 dark:text-red-400 text-lg">cancel</span>}
                </div>
              );
            })}
          </div>

          {/* Primary Action Footer */}
          <div className="mt-6 md:mt-8 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
             {!isSubmitted ? (
               <button 
                 onClick={handleSubmit}
                 disabled={selectedOption === null}
                 className="w-full md:w-auto px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
               >
                 Confirmar <span className="material-symbols-outlined text-[18px]">verified</span>
               </button>
             ) : (
               <button 
                 onClick={onNext}
                 className="w-full md:w-auto px-6 py-2.5 text-white rounded-lg font-bold text-sm shadow-lg hover:translate-x-1 transition-all flex items-center justify-center gap-2 bg-[#0d1b12] dark:bg-slate-950 hover:bg-[#1a3d24] dark:hover:bg-black active:scale-95"
               >
                 Próxima <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
               </button>
             )}
          </div>
      </div>

      {/* AI Analysis Section (Visible only after submit) */}
      {isSubmitted && (
        <div className="fade-in bg-[#f0f7ff] dark:bg-slate-900/50 rounded-2xl border border-primary/20 dark:border-primary/10 shadow-lg p-5 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-primary/10 dark:border-slate-700 pb-3">
             <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md shadow-primary/20">
               <span className="material-symbols-outlined text-[20px]">smart_toy</span>
             </div>
             <div>
               <h4 className="text-primary font-black text-base tracking-tight">AI Tutor Analysis</h4>
               <p className="text-[#4c739a] dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Feedback Detalhado</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Left Column */}
             <div className="flex flex-col gap-6">
               <section>
                 <h5 className="flex items-center gap-2 text-[#0d141b] dark:text-slate-100 font-extrabold mb-2 text-xs uppercase tracking-tight">
                   <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                   Gabarito Comentado
                 </h5>
                 <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed text-sm text-slate-700 dark:text-slate-300 text-justify shadow-sm">
                   <span className="block font-bold text-green-700 dark:text-green-400 mb-1 border-b border-green-100 dark:border-slate-700 pb-1">
                     A alternativa correta é a letra {letters[question.correctAnswerIndex]}.
                   </span>
                   {/* STRIP FORMATTING HERE */}
                   {stripFormatting(question.correctExplanation)}
                 </div>
               </section>

               {/* NEW CONCEPT EXPLANATION SECTION - SINGLE BLOCK */}
               {question.conceptExplanation && (
                 <section>
                   <h5 className="flex items-center gap-2 text-[#0d141b] dark:text-slate-100 font-extrabold mb-2 text-xs uppercase tracking-tight">
                     <span className="material-symbols-outlined text-indigo-500 text-lg">menu_book</span>
                     Fixação do Conceito (Resumo Teórico)
                   </h5>
                   <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-indigo-900/30 shadow-sm transition-colors hover:border-indigo-200 dark:hover:border-indigo-900/50">
                     <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md">
                           <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-justify font-medium">
                           {/* STRIP FORMATTING HERE */}
                           {stripFormatting(question.conceptExplanation)}
                        </p>
                     </div>
                   </div>
                 </section>
               )}

               <section>
                 <h5 className="flex items-center gap-2 text-[#0d141b] dark:text-slate-100 font-extrabold mb-2 text-xs uppercase tracking-tight">
                   <span className="material-symbols-outlined text-blue-500 text-lg">gavel</span>
                   Fundamentação Legal
                 </h5>
                 <div className="bg-primary/5 dark:bg-primary/10 border-l-4 border-primary p-3 rounded-r-lg">
                   <p className="text-sm text-[#0d141b] dark:text-slate-200 italic font-medium leading-relaxed">
                     "{/* STRIP FORMATTING HERE */}
                     {stripFormatting(question.legalBasis)}"
                   </p>
                 </div>
               </section>
             </div>

             {/* Right Column */}
             <div className="flex flex-col gap-6">
                <div>
                    <h5 className="text-[#0d141b] dark:text-slate-100 font-extrabold text-xs uppercase tracking-tight mb-2 flex items-center gap-2">
                       <span className="material-symbols-outlined text-red-500 text-lg">cancel</span>
                       Análise de Distratores
                    </h5>
                    <div className="space-y-2">
                      {question.distractorAnalysis?.map((reason, i) => {
                        const match = reason.match(/^(Alternativa\s+[A-E])[:\s-]*(.*)/i);
                        let label = match ? match[1] : null;
                        let text = match ? match[2] : reason;

                        if (!label && question.distractorAnalysis.length === incorrectIndices.length) {
                           label = `Alternativa ${letters[incorrectIndices[i]]}`;
                        }

                        return (
                          <div key={i} className="p-2.5 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20 flex gap-3 items-start">
                             <span className="text-red-600 dark:text-red-400 font-black text-xs mt-0.5">X</span>
                             <div className="flex flex-col">
                                {label && (
                                  <span className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase mb-0.5 tracking-wide">
                                    {label.replace(/[:\s-]*$/, '')}
                                  </span>
                                )}
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                                  {/* STRIP FORMATTING HERE */}
                                  {stripFormatting(text)}
                                </p>
                             </div>
                          </div>
                        );
                      })}
                      {!question.distractorAnalysis && <p className="text-xs text-slate-400 italic">Análise de distratores não disponível.</p>}
                    </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-lg shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-5">
                      <span className="material-symbols-outlined text-5xl text-amber-900">lightbulb</span>
                   </div>
                   <div className="flex items-center gap-2 text-amber-800 dark:text-amber-500 mb-1 relative z-10">
                     <span className="material-symbols-outlined text-lg">lightbulb</span>
                     <span className="text-xs font-black uppercase tracking-wide">Dica Estratégica</span>
                   </div>
                   <p className="text-xs text-slate-700 dark:text-slate-200 font-bold leading-relaxed relative z-10">
                     {/* STRIP FORMATTING HERE */}
                     {stripFormatting(question.studyTip)}
                   </p>
                </div>
             </div>
          </div>
          
          <div className="flex justify-center border-t border-primary/10 dark:border-slate-700 pt-4">
             <button 
               onClick={onNext}
               className="w-full md:w-auto px-8 py-2.5 text-white rounded-lg font-bold text-sm shadow-lg hover:translate-x-1 transition-all flex items-center justify-center gap-2 bg-[#0d1b12] dark:bg-slate-950 hover:bg-[#1a3d24] dark:hover:bg-black active:scale-95"
             >
               Avançar <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};