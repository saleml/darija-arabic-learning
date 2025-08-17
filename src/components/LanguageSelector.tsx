import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  excludeLanguage?: string;
  includeAll?: boolean;
}

const languages = [
  { id: 'darija', name: 'Darija', flag: '🇲🇦' },
  { id: 'lebanese', name: 'Lebanese', flag: '🇱🇧' },
  { id: 'syrian', name: 'Syrian', flag: '🇸🇾' },
  { id: 'emirati', name: 'Emirati', flag: '🇦🇪' },
  { id: 'saudi', name: 'Saudi', flag: '🇸🇦' }
];

export default function LanguageSelector({ 
  value, 
  onChange, 
  label, 
  excludeLanguage,
  includeAll = false 
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLanguage = value === 'all' 
    ? { id: 'all', name: 'All', flag: '🌍' }
    : languages.find(l => l.id === value) || languages[0];

  const availableLanguages = languages.filter(l => l.id !== excludeLanguage);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">{label}</span>
          <div className="flex items-center gap-1">
            <span className="text-lg">{selectedLanguage.flag}</span>
            <span className="font-medium text-gray-900">{selectedLanguage.name}</span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {availableLanguages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  onChange(lang.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2
                  ${value === lang.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                `}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </button>
            ))}
            {includeAll && (
              <>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    onChange('all');
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2
                    ${value === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                  `}
                >
                  <span className="text-lg">🌍</span>
                  <span className="font-medium">All Dialects</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}