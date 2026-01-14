import React, { useState, useEffect } from 'react';
import { Key, Lock, AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) setKey(stored);
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    if (key.length < 10) {
      setError('Chave inválida. Verifique sua API Key.');
      return;
    }
    localStorage.setItem('gemini_api_key', key);
    onSave(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 relative transition-colors duration-300">
        
        {/* Close Button (X) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded-full transition-all"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4 text-teal-700 dark:text-teal-400">
          <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold">Acesso à IA</h2>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm leading-relaxed">
          Para gerar questões personalizadas baseadas no edital da SEFA PA, este app utiliza a Gemini API do Google. 
          Sua chave fica salva apenas no seu navegador.
        </p>

        <div className="space-y-2 mb-6">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gemini API Key</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" 
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(''); }}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-700 dark:text-slate-200 font-mono text-sm"
              placeholder="Cole sua chave aqui..."
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs mt-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
           <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noreferrer"
            className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline mr-auto"
          >
            Obter Chave Grátis
          </a>
          
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 text-sm"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};