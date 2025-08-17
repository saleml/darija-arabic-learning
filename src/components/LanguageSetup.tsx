import { useState } from 'react';
import { Globe, ChevronRight, Check } from 'lucide-react';

interface LanguageSetupProps {
  onComplete: (sourceLanguage: string, targetLanguage: string) => void;
  initialSource?: string;
  initialTarget?: string;
}

const languages = [
  { id: 'darija', name: 'Moroccan Darija', flag: '🇲🇦' },
  { id: 'lebanese', name: 'Lebanese', flag: '🇱🇧' },
  { id: 'syrian', name: 'Syrian', flag: '🇸🇾' },
  { id: 'emirati', name: 'Emirati', flag: '🇦🇪' },
  { id: 'saudi', name: 'Saudi', flag: '🇸🇦' }
];

export default function LanguageSetup({ onComplete, initialSource = 'darija', initialTarget = 'lebanese' }: LanguageSetupProps) {
  const [sourceLanguage, setSourceLanguage] = useState(initialSource);
  const [targetLanguage, setTargetLanguage] = useState(initialTarget);
  const [step, setStep] = useState<'source' | 'target'>('source');

  const handleContinue = () => {
    if (step === 'source') {
      setStep('target');
    } else {
      onComplete(sourceLanguage, targetLanguage);
    }
  };

  const canContinue = step === 'source' ? sourceLanguage !== '' : targetLanguage !== '' && targetLanguage !== sourceLanguage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl w-fit mx-auto mb-4">
            <Globe className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'source' ? 'Choose Your Source Language' : 'Choose Your Target Language'}
          </h2>
          <p className="text-gray-600">
            {step === 'source' 
              ? 'Select the language you already know'
              : 'Select the language you want to learn'}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {languages.map((lang) => {
            const isSelected = step === 'source' ? sourceLanguage === lang.id : targetLanguage === lang.id;
            const isDisabled = step === 'target' && lang.id === sourceLanguage;
            
            return (
              <button
                key={lang.id}
                onClick={() => {
                  if (!isDisabled) {
                    if (step === 'source') {
                      setSourceLanguage(lang.id);
                    } else {
                      setTargetLanguage(lang.id);
                    }
                  }
                }}
                disabled={isDisabled}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className={`font-medium ${isSelected ? 'text-blue-900' : isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
                    {lang.name}
                  </span>
                </div>
                {isSelected && (
                  <div className="bg-blue-500 rounded-full p-1">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {step === 'target' && targetLanguage === 'all' && (
          <button
            onClick={() => setTargetLanguage('all')}
            className={`
              w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between mb-3
              ${targetLanguage === 'all'
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌍</span>
              <span className={`font-medium ${targetLanguage === 'all' ? 'text-blue-900' : 'text-gray-700'}`}>
                All Dialects
              </span>
            </div>
            {targetLanguage === 'all' && (
              <div className="bg-blue-500 rounded-full p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </button>
        )}

        <div className="flex gap-3">
          {step === 'target' && (
            <button
              onClick={() => setStep('source')}
              className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Back
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`
              flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2
              ${canContinue
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {step === 'source' ? 'Continue' : 'Start Learning'}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {step === 'source' && (
          <p className="text-center text-sm text-gray-500 mt-6">
            You can change these settings anytime from the header menu
          </p>
        )}
      </div>
    </div>
  );
}