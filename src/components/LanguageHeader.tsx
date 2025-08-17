import LanguageSelector from './LanguageSelector';

interface LanguageHeaderProps {
  sourceLanguage: string;
  targetLanguage: string;
  onLanguageChange: (source: string, target: string) => Promise<void>;
}

export default function LanguageHeader({ sourceLanguage, targetLanguage, onLanguageChange }: LanguageHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <LanguageSelector
        value={sourceLanguage}
        onChange={(value) => onLanguageChange(value, targetLanguage)}
        label="From"
        excludeLanguage={targetLanguage}
      />
      <span className="text-gray-500">→</span>
      <LanguageSelector
        value={targetLanguage}
        onChange={(value) => onLanguageChange(sourceLanguage, value)}
        label="To"
        excludeLanguage={sourceLanguage}
        includeAll={true}
      />
    </div>
  );
}