import { useState, useMemo } from 'react';
import { Globe, Info, Heart, Coffee, Users, Calendar, MapPin, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Phrase, UserProgress } from '../types';

interface Props {
  phrases: Phrase[];
  userProgress: UserProgress | null;
  onUpdateProgress: (progress: UserProgress) => void;
}

interface CulturalCard {
  id: string;
  title: string;
  icon: React.ElementType;
  category: string;
  content: string;
  examples: Phrase[];
  tips: string[];
  regionalDifferences: {
    region: string;
    note: string;
  }[];
}

export default function CulturalCards({ phrases, userProgress, onUpdateProgress }: Props) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [expandedExample, setExpandedExample] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const culturalCards: CulturalCard[] = useMemo(() => {
    const cards: CulturalCard[] = [
      {
        id: 'greetings',
        title: 'Greetings & Social Etiquette',
        icon: Users,
        category: 'social',
        content: 'Greetings vary significantly across Arab regions. While Darija speakers commonly use "السلام عليكم" universally, Levantine speakers often prefer "مرحبا" in casual settings. Gulf countries maintain more formal greetings even in casual contexts.',
        examples: phrases.filter(p => p.category === 'greetings').slice(0, 3),
        tips: [
          'In Lebanon/Syria, religious greetings are less common in mixed company',
          'Gulf countries expect formal greetings even among young people',
          'Moroccans often combine Arabic and French greetings',
          'Always wait for the response to "السلام عليكم" before continuing'
        ],
        regionalDifferences: [
          { region: 'Morocco', note: 'Mix of Arabic, Berber, and French influences' },
          { region: 'Lebanon', note: 'French influence, more secular greetings' },
          { region: 'Gulf', note: 'Formal and religious greetings predominate' },
          { region: 'Syria', note: 'Similar to Lebanese but more conservative' }
        ]
      },
      {
        id: 'hospitality',
        title: 'Hospitality & Guest Culture',
        icon: Coffee,
        category: 'cultural',
        content: 'Arab hospitality is legendary, but expressions differ. Moroccans say "الدار دارك" (the house is yours), while Gulf Arabs might offer "تفضل" repeatedly. Understanding these nuances helps navigate social situations.',
        examples: phrases.filter(p => p.tags.includes('hospitality') || p.cultural_notes?.includes('hospital')).slice(0, 3),
        tips: [
          'Never refuse hospitality outright - accept at least symbolically',
          'In Morocco, mint tea is central to hospitality',
          'Gulf countries emphasize coffee (قهوة عربية) in hospitality',
          'Lebanese hospitality includes insisting guests eat more'
        ],
        regionalDifferences: [
          { region: 'Morocco', note: 'Tea ceremony is essential, multiple rounds expected' },
          { region: 'Lebanon', note: 'Mezze and abundance of food shows respect' },
          { region: 'Gulf', note: 'Arabic coffee and dates, specific serving etiquette' },
          { region: 'Syria', note: 'Similar to Lebanon but with regional specialties' }
        ]
      },
      {
        id: 'family',
        title: 'Family Terms & Respect',
        icon: Heart,
        category: 'family',
        content: 'Family terminology reveals cultural values. Moroccans use "الواليد/الواليدة" for parents, showing formality. Levantine "بابا/ماما" shows Western influence. Gulf maintains traditional Arabic terms.',
        examples: phrases.filter(p => p.category === 'family').slice(0, 3),
        tips: [
          'Always show respect when discussing family',
          'Asking about family is polite but be sensitive',
          'Terms for relatives can indicate social closeness',
          'Elders are addressed with special respect terms'
        ],
        regionalDifferences: [
          { region: 'Morocco', note: 'French "papa/maman" also common in cities' },
          { region: 'Lebanon', note: 'Western terms mixed with Arabic' },
          { region: 'Gulf', note: 'Traditional terms, emphasis on tribal relations' },
          { region: 'Syria', note: 'Balance of traditional and modern terms' }
        ]
      },
      {
        id: 'food',
        title: 'Food Culture & Dining',
        icon: Coffee,
        category: 'food_dining',
        content: 'Food expressions reflect cultural values. "بالصحة والراحة" in Morocco, "صحتين" in Lebanon, "بالهنا والشفا" in Saudi - all wish health with food but with regional flavors.',
        examples: phrases.filter(p => p.category === 'food_dining').slice(0, 3),
        tips: [
          'Always compliment the food',
          'Refusing food can be seen as rude',
          'Sharing meals is deeply social',
          'Religious considerations affect food culture'
        ],
        regionalDifferences: [
          { region: 'Morocco', note: 'Communal eating from shared plates (especially couscous)' },
          { region: 'Lebanon', note: 'Mezze culture, variety and abundance important' },
          { region: 'Gulf', note: 'Hospitality through feast, eating with hands common' },
          { region: 'Syria', note: 'Similar to Lebanon with unique local dishes' }
        ]
      },
      {
        id: 'religion',
        title: 'Religious Expressions',
        icon: Sparkles,
        category: 'religious',
        content: 'Religious phrases permeate daily speech. "إن شاء الله" (God willing) is universal but frequency varies. Moroccans and Gulf Arabs use it more than Lebanese Christians.',
        examples: phrases.filter(p => p.tags.includes('religious')).slice(0, 3),
        tips: [
          'Religious expressions are cultural even for non-religious speakers',
          '"إن شاء الله" can mean "maybe" or "no" depending on context',
          'Respect religious expressions even if not religious',
          'Some expressions are universal, others regional'
        ],
        regionalDifferences: [
          { region: 'Morocco', note: 'Heavy use of religious expressions by all' },
          { region: 'Lebanon', note: 'Varies by community, less in Christian areas' },
          { region: 'Gulf', note: 'Very frequent religious expressions' },
          { region: 'Syria', note: 'Mixed usage depending on community' }
        ]
      },
      {
        id: 'business',
        title: 'Business & Professional Context',
        icon: MapPin,
        category: 'workplace',
        content: 'Professional language varies greatly. Morocco uses French business terms, Lebanon mixes English, while Gulf maintains more Arabic. Understanding helps in professional settings.',
        examples: phrases.filter(p => p.category === 'workplace').slice(0, 3),
        tips: [
          'Formality levels differ by country',
          'Building relationships before business is crucial',
          'Time concepts vary (Gulf more relaxed than Lebanon)',
          'Email etiquette differs significantly'
        ],
        regionalDifferences: [
          { region: 'Morocco', note: 'French dominates business, very formal' },
          { region: 'Lebanon', note: 'English/French mix, Western business style' },
          { region: 'Gulf', note: 'Formal Arabic, relationship-focused' },
          { region: 'Syria', note: 'More Arabic-focused than Lebanon' }
        ]
      },
      {
        id: 'emotions',
        title: 'Expressing Emotions',
        icon: Heart,
        category: 'emotions',
        content: 'Emotional expressions vary in intensity. Moroccans say "كنحماق عليه" (I\'m crazy about him), Lebanese "بموت فيه" (I die for him) - same feeling, different imagery.',
        examples: phrases.filter(p => p.category === 'emotions').slice(0, 3),
        tips: [
          'Emotional expression acceptable levels vary',
          'Men express emotions differently than women',
          'Public vs private emotional expression differs',
          'Hyperbole is common and expected'
        ],
        regionalDifferences: [
          { region: 'Morocco', note: 'Moderate expression, French influence' },
          { region: 'Lebanon', note: 'Dramatic expression common and accepted' },
          { region: 'Gulf', note: 'More reserved publicly, expressive privately' },
          { region: 'Syria', note: 'Similar to Lebanon but slightly more reserved' }
        ]
      },
      {
        id: 'time',
        title: 'Time & Scheduling',
        icon: Calendar,
        category: 'time_date',
        content: 'Time perception varies. "دابا" (now) in Morocco might mean "soon", while Lebanese "هلأ" is more immediate. Gulf "الحين" can be quite flexible.',
        examples: phrases.filter(p => p.category === 'time_date').slice(0, 3),
        tips: [
          'Time is more fluid in Arab culture than Western',
          '"إن شاء الله" with time often means uncertainty',
          'Patience is expected and valued',
          'Social time vs business time differs'
        ],
        regionalDifferences: [
          { region: 'Morocco', note: 'Relaxed time concept, "Moroccan time"' },
          { region: 'Lebanon', note: 'More punctual due to Western influence' },
          { region: 'Gulf', note: 'Flexible time, relationships over punctuality' },
          { region: 'Syria', note: 'Between Lebanese and Gulf approaches' }
        ]
      },
      {
        id: 'bargaining',
        title: 'Shopping & Bargaining',
        icon: MapPin,
        category: 'shopping',
        content: 'Bargaining culture differs. Moroccan "نقص شوية" is expected, Lebanese might bargain less in modern shops, while Gulf bargaining depends on the market type.',
        examples: phrases.filter(p => p.category === 'shopping').slice(0, 3),
        tips: [
          'Bargaining is social interaction, not just price negotiation',
          'Starting price expectations vary by country',
          'Fixed prices more common in Gulf malls',
          'Traditional markets (souks) always expect bargaining'
        ],
        regionalDifferences: [
          { region: 'Morocco', note: 'Bargaining is art form, expected everywhere' },
          { region: 'Lebanon', note: 'Mixed - modern shops fixed, traditional flexible' },
          { region: 'Gulf', note: 'Traditional souks bargain, malls don\'t' },
          { region: 'Syria', note: 'Similar to traditional Lebanese approach' }
        ]
      },
      {
        id: 'idioms',
        title: 'Proverbs & Wisdom',
        icon: Sparkles,
        category: 'idioms',
        content: 'Proverbs reveal cultural values. "الصبر مفتاح الفرج" (patience is the key to relief) is universal, but each region has unique sayings reflecting local wisdom.',
        examples: phrases.filter(p => p.category === 'idioms').slice(0, 3),
        tips: [
          'Proverbs are used to give advice indirectly',
          'Knowing proverbs shows cultural appreciation',
          'Similar meanings, different expressions by region',
          'Elders especially appreciate proverb knowledge'
        ],
        regionalDifferences: [
          { region: 'Morocco', note: 'Rich Berber and Arab proverb tradition' },
          { region: 'Lebanon', note: 'Mix of Arab, French, and local proverbs' },
          { region: 'Gulf', note: 'Bedouin wisdom and Islamic proverbs' },
          { region: 'Syria', note: 'Ancient Levantine wisdom traditions' }
        ]
      }
    ];

    return cards;
  }, [phrases]);

  const filteredCards = useMemo(() => {
    if (filter === 'all') return culturalCards;
    return culturalCards.filter(card => card.category === filter);
  }, [culturalCards, filter]);

  const currentCard = filteredCards[currentCardIndex];

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length);
    setExpandedExample(null);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
    setExpandedExample(null);
  };

  const categories = ['all', ...new Set(culturalCards.map(c => c.category))];

  if (!currentCard) {
    return <div>Loading cultural content...</div>;
  }

  const Icon = currentCard.icon;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-500" />
            Cultural Context & Tips
          </h2>
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setFilter(cat);
                  setCurrentCardIndex(0);
                }}
                className={`px-4 py-2 rounded-lg ${
                  filter === cat ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                {cat === 'all' ? 'All' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevCard}
              className="p-2 rounded-lg bg-white shadow hover:shadow-lg transition-shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex-1 mx-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-white rounded-lg shadow">
                  <Icon className="h-8 w-8 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{currentCard.title}</h3>
              </div>
              
              <p className="text-gray-700 leading-relaxed text-center">
                {currentCard.content}
              </p>
            </div>
            
            <button
              onClick={nextCard}
              className="p-2 rounded-lg bg-white shadow hover:shadow-lg transition-shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            {filteredCards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentCardIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentCardIndex ? 'bg-indigo-500 w-8' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Regional Differences
            </h4>
            <div className="space-y-2">
              {currentCard.regionalDifferences.map((diff, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-blue-600 min-w-[80px]">
                    {diff.region}:
                  </span>
                  <span className="text-gray-700">{diff.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-green-500" />
              Cultural Tips
            </h4>
            <div className="space-y-2">
              {currentCard.tips.map((tip, idx) => (
                <div key={idx} className="flex gap-2 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-500">•</span>
                  <span className="text-gray-700">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {currentCard.examples.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-lg mb-3">Example Phrases</h4>
            <div className="space-y-3">
              {currentCard.examples.map((phrase) => (
                <div
                  key={phrase.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedExample(expandedExample === phrase.id ? null : phrase.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold arabic-text rtl text-lg">{phrase.darija}</p>
                      <p className="text-gray-600">{phrase.darija_latin}</p>
                      <p className="text-sm text-gray-500">"{phrase.literal_english}"</p>
                    </div>
                    <ChevronRight 
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        expandedExample === phrase.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                  
                  {expandedExample === phrase.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="font-medium text-sm text-gray-600 mb-1">Lebanese:</p>
                          <p className="arabic-text rtl">{phrase.translations.lebanese.phrase}</p>
                          <p className="text-sm text-gray-500">{phrase.translations.lebanese.latin}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-600 mb-1">Gulf:</p>
                          <p className="arabic-text rtl">{phrase.translations.emirati.phrase}</p>
                          <p className="text-sm text-gray-500">{phrase.translations.emirati.latin}</p>
                        </div>
                      </div>
                      {phrase.cultural_notes && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded">
                          <p className="text-sm text-yellow-800">
                            <span className="font-medium">Note:</span> {phrase.cultural_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Learning Tip</p>
              <p className="text-blue-700 text-sm mt-1">
                Understanding cultural context helps you choose the right phrase for the right situation. 
                What works in Morocco might sound odd in Lebanon, and vice versa. Pay attention to these 
                nuances to sound more natural in each dialect.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}