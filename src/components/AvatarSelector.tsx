import { useState } from 'react';
import { Check } from 'lucide-react';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
  size?: 'small' | 'medium' | 'large';
}

// DiceBear API avatars - consistent avataaars style across the app
export const avatarOptions = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar6',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar7',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar8',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar10',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar11',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar12'
];

export function getRandomAvatar(): string {
  return avatarOptions[Math.floor(Math.random() * avatarOptions.length)];
}

export default function AvatarSelector({ selectedAvatar, onSelectAvatar, size = 'medium' }: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };
  
  const gridSizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-14 h-14',
    large: 'w-20 h-20'
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer`}
      >
        <img 
          src={selectedAvatar || avatarOptions[0]} 
          alt="Avatar" 
          className="w-full h-full object-cover"
        />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl p-4 z-50 min-w-[280px]">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose your avatar</h3>
            <div className="grid grid-cols-5 gap-2">
              {avatarOptions.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelectAvatar(avatar);
                    setIsOpen(false);
                  }}
                  className={`relative ${gridSizeClasses[size]} rounded-full overflow-hidden border-2 ${
                    selectedAvatar === avatar ? 'border-blue-500' : 'border-gray-300'
                  } hover:border-blue-400 transition-colors`}
                >
                  <img 
                    src={avatar} 
                    alt={`Avatar ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}