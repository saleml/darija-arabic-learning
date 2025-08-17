import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { avatarOptions } from './AvatarSelector';
import { logger } from '../utils/logger';

interface ProfileDropdownProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  sourceLanguage: string;
  targetLanguage: string;
  onLogout: () => void;
  onLanguageChange?: (source: string, target: string) => Promise<void>;
}

const languages = [
  { value: 'darija', label: 'Darija 🇲🇦' },
  { value: 'lebanese', label: 'Lebanese 🇱🇧' },
  { value: 'syrian', label: 'Syrian 🇸🇾' },
  { value: 'emirati', label: 'Emirati 🇦🇪' },
  { value: 'saudi', label: 'Saudi 🇸🇦' }
];

export default function ProfileDropdown({ user, sourceLanguage, targetLanguage, onLogout, onLanguageChange }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatarUrl || avatarOptions[0]);
  const [source, setSource] = useState(sourceLanguage || 'darija');
  const [target, setTarget] = useState(targetLanguage || 'lebanese');
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    try {
      logger.log('Saving profile for user:', user.id);
      logger.log('Data:', { name, avatar, source, target });
      
      // Update database directly - no need to fetch first
      console.log('Attempting to update profile with:', {
        full_name: name,
        avatar_url: avatar,
        source_language: source,
        target_language: target,
        id: user.id
      });
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: name,
          avatar_url: avatar,
          source_language: source,
          target_language: target,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating profile:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert('Failed to save profile: ' + error.message);
        setSaving(false);
        return;
      }
      
      console.log('✅ Profile updated successfully:', data);
      
      // Update auth context if function provided
      if (onLanguageChange) {
        await onLanguageChange(source, target);
      }
      
      setSaved(true);
      setSaving(false);
      
      // Close dropdown after short delay
      setTimeout(() => {
        setSaved(false);
        setIsEditing(false);
        setIsOpen(false);
        // Reload to apply changes everywhere
        window.location.reload();
      }, 1000);
    } catch (error) {
      logger.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user.name);
    setAvatar(user.avatarUrl || avatarOptions[0]);
    setSource(sourceLanguage || 'darija');
    setTarget(targetLanguage || 'lebanese');
    setIsEditing(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {user.name[0]?.toUpperCase()}
          </div>
        )}
        <span className="hidden md:block text-sm font-medium text-gray-700">{user.name}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            {!isEditing ? (
              <>
                {/* View Mode */}
                <div className="flex items-center gap-3 mb-4">
                  <img src={avatar} alt={name} className="h-12 w-12 rounded-full" />
                  <div>
                    <div className="font-semibold">{name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="text-gray-500">From:</span>{' '}
                    <span className="font-medium">
                      {languages.find(l => l.value === source)?.label}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">To:</span>{' '}
                    <span className="font-medium">
                      {languages.find(l => l.value === target)?.label}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Edit Mode */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                    <div className="grid grid-cols-5 gap-2">
                      {avatarOptions.slice(0, 5).map((option) => (
                        <button
                          key={option}
                          onClick={() => setAvatar(option)}
                          className={`p-1 rounded-lg border-2 transition-colors ${
                            avatar === option ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img src={option} alt="Avatar option" className="w-full h-full rounded" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source Language</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Language</label>
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? (
                        'Saving...'
                      ) : saved ? (
                        '✅ Saved!'
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}