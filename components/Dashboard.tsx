import React, { useState } from 'react';
import { SYLLABUS } from '../constants';
import { SyllabusTopic, UserStats, DifficultyLevel } from '../types';

interface Props {
  onSelectTopic: (topic: SyllabusTopic, difficulty: DifficultyLevel) => void;
  onResetTopic: (topicId: string) => void;
  stats: UserStats;
}

export const Dashboard: React.FC<Props> = ({ onSelectTopic, onResetTopic, stats }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('Intermediário');

  const getProgressColor = (idx: number) => {
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
    return colors[idx % colors.length];
  };

  const getIconColor = (idx: number) => {
    const colors = ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600', 'bg-orange-100 text-orange-600', 'bg-pink-100 text-pink-600', 'bg-indigo-100 text-indigo-600'];
    return colors[idx % colors.length];
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full fade-in pb-24">
      {/* Welcome Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0d141b] dark:text-white">
            Base para Concursos
          </h2>
          <p className="text-[#4c739a] dark:text-slate-400 text-lg mt-1">
            Escolha seu nível e domine as matérias essenciais.
          </p>
        </div>

        {/* Difficulty Selector */}
        <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 inline-flex shadow-sm">
          {(['Iniciante', 'Intermediário', 'Avançado'] as DifficultyLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setSelectedDifficulty(level)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedDifficulty === level
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Highlight Card - General Focus */}
          <div 
            onClick={() => onSelectTopic(SYLLABUS[0], selectedDifficulty)}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl shadow-xl flex flex-col md:flex-row cursor-pointer transition-transform hover:scale-[1.01]"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="p-6 md:p-8 flex flex-col justify-center flex-1 relative z-10">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
                <span className="material-symbols-outlined text-[16px]">star</span>
                Matéria Fundamental
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">Língua Portuguesa</h3>
              <p className="text-gray-300 text-sm mb-6">Essencial para qualquer cargo. Domine crase, concordância e interpretação.</p>
              
              <div className="flex items-center gap-4 mb-4">
                <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold text-white border border-white/20">
                  Nível: {selectedDifficulty}
                </span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.masteryByTopic['GEN1'] || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTopic(SYLLABUS[0], selectedDifficulty);
                }}
                className="self-start bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-blue-900/30 transition-colors active:scale-95"
              >
                 Treinar Português
              </button>
            </div>
          </div>

          {/* Syllabus Grid */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xl font-bold text-[#0d141b] dark:text-slate-200">Matérias da Base Comum</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SYLLABUS.map((topic, idx) => {
                const progress = stats.masteryByTopic[topic.id] || 0;
                return (
                  <div
                    key={topic.id}
                    onClick={() => onSelectTopic(topic, selectedDifficulty)}
                    className="relative bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md transition-all text-left group cursor-pointer"
                  >
                    {/* Reset Button */}
                    {progress > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResetTopic(topic.id);
                        }}
                        className="absolute top-3 right-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
                        title="Zerar progresso"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2 rounded-lg ${getIconColor(idx)}`}>
                        <span className="material-symbols-outlined">
                          {topic.icon || 'book'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{selectedDifficulty.substring(0,3)}</span>
                        <div className="text-[10px] font-bold text-slate-300 mt-1">{progress}%</div>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mb-1 text-[#0d141b] dark:text-slate-100 group-hover:text-primary transition-colors">
                      {topic.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[2.5em]">
                      {topic.description}
                    </p>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(idx)} transition-all duration-700 ease-out`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-8">
          {/* Stats Widget */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center justify-between text-[#0d141b] dark:text-white">
               Seu Desempenho
            </h3>
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className={`flex h-6 w-6 items-center justify-center rounded-md ${stats.totalAnswered > 0 ? 'bg-primary text-white' : 'border-2 border-slate-200 dark:border-slate-600 text-slate-300 dark:text-slate-600'}`}>
                   <span className="material-symbols-outlined text-[16px]">check</span>
                 </div>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Resolver 1 Questão</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className={`flex h-6 w-6 items-center justify-center rounded-md ${stats.streak > 0 ? 'bg-primary text-white' : 'border-2 border-slate-200 dark:border-slate-600 text-slate-300 dark:text-slate-600'}`}>
                   <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                 </div>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Manter Sequência</span>
               </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
               <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Questões</p>
                  <p className="text-2xl font-black text-[#0d141b] dark:text-white">{stats.totalAnswered}</p>
               </div>
               <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Acertos</p>
                  <p className={`text-2xl font-black ${stats.correct > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                    {stats.totalAnswered > 0 ? Math.round((stats.correct/stats.totalAnswered)*100) : 0}%
                  </p>
               </div>
            </div>
          </div>

          {/* AI Tutor Info */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[100px]">school</span>
             </div>
             <div className="flex items-center gap-3 mb-4 relative z-10">
               <div className="bg-white/20 p-2 rounded-lg">
                 <span className="material-symbols-outlined text-white">psychology</span>
               </div>
               <div>
                 <h4 className="font-bold text-sm">Professor IA</h4>
                 <p className="text-[10px] text-blue-300 font-bold">ONLINE</p>
               </div>
             </div>
             <p className="text-sm text-gray-300 mb-4 leading-relaxed relative z-10">
               "Adapto as questões ao seu nível. Comece no <strong>Iniciante</strong> para fixar conceitos e avance para <strong>Avançado</strong> para desafios estilo auditor."
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};