import { useEffect, useRef } from 'react';

interface KeyboardShortcuts {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const shortcutsRef = useRef(shortcuts);
  
  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Build the key combination string
      let key = '';
      if (event.metaKey || event.ctrlKey) key += 'cmd+';
      if (event.altKey) key += 'alt+';
      if (event.shiftKey) key += 'shift+';
      key += event.key.toLowerCase();

      // Check if we have a handler for this key combination
      if (shortcutsRef.current[key]) {
        event.preventDefault();
        shortcutsRef.current[key]();
      }

      // Also check for single keys
      if (shortcutsRef.current[event.key.toLowerCase()]) {
        // Don't trigger if user is typing in an input
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          shortcutsRef.current[event.key.toLowerCase()]();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array - set up once
}