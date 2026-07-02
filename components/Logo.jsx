'use client';

export default function Logo({ size = 104 }) {
  return (
    <svg className="logo-svg transition-transform duration-300 hover:scale-105" width={size} height={size} viewBox="0 0 104 104" fill="none">
      <rect width="104" height="104" rx="21" fill="#D42B2B"/>
      <circle cx="52" cy="45" r="25" fill="#F5C518"/>
      <ellipse cx="52" cy="53" rx="14" ry="16" fill="white"/>
      <circle cx="52" cy="33" r="10.5" fill="white"/>
      <ellipse cx="47.5" cy="23.5" rx="3" ry="4.5" fill="#C41E1E" transform="rotate(-15 47.5 23.5)"/>
      <ellipse cx="52" cy="21.5" rx="3" ry="5" fill="#C41E1E"/>
      <ellipse cx="56.5" cy="23.5" rx="3" ry="4.5" fill="#C41E1E" transform="rotate(15 56.5 23.5)"/>
      <path d="M47 33 Q49 30.8 51 33" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <path d="M53 33 Q55 30.8 57 33" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <ellipse cx="45" cy="37" rx="3" ry="2" fill="#FFB3B3" opacity="0.5"/>
      <ellipse cx="59" cy="37" rx="3" ry="2" fill="#FFB3B3" opacity="0.5"/>
      <path d="M49.5 39.5 L52 43 L54.5 39.5 Z" fill="#F5A623"/>
      <ellipse cx="52" cy="44" rx="3" ry="2.2" fill="#C41E1E"/>
      <path d="M37 50 Q33 57 37 64 Q45 60 45 52 Z" fill="white"/>
      <path d="M67 50 Q71 57 67 64 Q59 60 59 52 Z" fill="white"/>
      <path d="M66 27 L68 23" stroke="#F5C518" strokeWidth="2" strokeLinecap="round"/>
      <path d="M70 32 L74 29" stroke="#F5C518" strokeWidth="2" strokeLinecap="round"/>
      <path d="M71 39 L75 39" stroke="#F5C518" strokeWidth="2" strokeLinecap="round"/>
      <text x="52" y="84" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="11" fontWeight="900" fill="white" letterSpacing="2">HARA</text>
      <text x="52" y="98" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="7.5" fontWeight="700" fill="#F5C518" letterSpacing="1.5">Chicken</text>
    </svg>
  );
}
