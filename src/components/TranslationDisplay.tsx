
interface TranslationDisplayProps {
  translation: any;
  dialectName: string;
  flag: string;
}

export default function TranslationDisplay({ translation, dialectName, flag }: TranslationDisplayProps) {
  if (!translation) return null;

  // Handle both string and object formats
  const getPhrase = () => {
    if (typeof translation === 'string') return translation;
    if (typeof translation === 'object' && translation.phrase) {
      return translation.phrase;
    }
    // If it's an object without phrase property, try arabic property (for some data formats)
    if (typeof translation === 'object' && translation.arabic) {
      return translation.arabic;
    }
    return '';
  };

  const getLatin = () => {
    if (typeof translation === 'object') {
      return translation.latin || '';
    }
    return '';
  };

  const getUsageNote = () => {
    if (typeof translation === 'object') {
      return translation.usage_note || '';
    }
    return '';
  };

  const phraseText = getPhrase();
  const latinText = getLatin();
  const usageText = getUsageNote();
  
  // Safety check
  if (typeof phraseText === 'object') {
    console.error('TranslationDisplay trying to render object:', phraseText, 'for', dialectName);
    return null;
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-blue-600">{flag} {dialectName}:</span>
      </div>
      <div className="pl-6">
        <div className="arabic-text rtl text-lg">{phraseText}</div>
        {latinText && typeof latinText !== 'object' && (
          <div className="text-gray-600">{latinText}</div>
        )}
        {usageText && typeof usageText !== 'object' && (
          <div className="text-sm text-gray-500 mt-1">{usageText}</div>
        )}
      </div>
    </div>
  );
}