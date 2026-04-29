import { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { useTheme, type ThemeType } from '../context/ThemeContext';

const themes: { value: ThemeType; label: string }[] = [
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'modern', label: 'Modern Tech' },
  { value: 'friendly', label: 'Friendly' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50" ref={ref}>
      <div className="theme-selector-wrap">
        <button className="theme-selector-btn" onClick={() => setIsOpen(!isOpen)}>
          <Palette size={18} />
        </button>
        {isOpen && (
          <div className="theme-dropdown">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => { setTheme(t.value); setIsOpen(false); }}
                className={`theme-option-btn ${theme === t.value ? 'active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
