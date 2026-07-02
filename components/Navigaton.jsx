'use client';

import { useRouter, usePathname } from 'next/navigation';
import { playHotsSound } from '../lib/audio';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(path) {
    playHotsSound('tap');
    router.push(path);
  }

  const items = [
    { label: 'Portal', path: '/', icon: '🏠' },
    { label: 'CBT Ujian', path: '/exam', icon: '📝' },
    { label: 'Piket', path: '/piket', icon: '🧹' },
    { label: 'Trainer', path: '/dashboard', icon: '📊' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0e0101]/95 border-t border-crimson/10 backdrop-blur-md px-4 py-2">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {items.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center p-2 relative group focus:outline-none"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 ${
                isActive 
                  ? 'bg-crimson/20 border border-crimson/40 text-white scale-110 shadow-lg shadow-crimson/20' 
                  : 'bg-transparent text-gray-500 hover:text-gray-300'
              }`}>
                {item.icon}
              </div>
              <span className={`text-[9px] uppercase tracking-wider font-bold mt-1 transition-colors duration-300 ${
                isActive ? 'text-white font-extrabold' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-[2px] bg-gradient-to-r from-crimson to-gold rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
