import React from 'react';

export type PaperTheme = 'classic' | 'kraft' | 'midnight' | 'mint' | 'sakura' | 'loft';

interface DiaryThemePickerProps {
    selectedTheme: PaperTheme;
    onSelect: (theme: PaperTheme) => void;
}

const THEMES: { id: PaperTheme; name: string; color: string; border: string }[] = [
    { id: 'classic', name: 'ขาวคลีน', color: '#ffffff', border: '#e2e8f0' },
    { id: 'kraft', name: 'กระดาษสา', color: '#f0e6d2', border: '#e6dcc6' },
    { id: 'mint', name: 'มิ้นต์', color: '#f0fdf4', border: '#dcfce7' },
    { id: 'sakura', name: 'ซากุระ', color: '#fff1f2', border: '#ffe4e6' },
    { id: 'loft', name: 'ลอฟท์', color: '#f1f5f9', border: '#cbd5e1' },
    { id: 'midnight', name: 'มิดไนท์', color: '#1e293b', border: '#475569' },
];

const DiaryThemePicker: React.FC<DiaryThemePickerProps> = ({ selectedTheme, onSelect }) => {
    return (
        <div className="grid grid-cols-2 gap-2.5">
            {THEMES.map(t => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className={`w-full aspect-[4/3] rounded-xl transition-all duration-300 relative group border-2 overflow-hidden
                        ${selectedTheme === t.id ? 'scale-105 shadow-md ring-2 ring-offset-1 ring-violet-400' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                    style={{ backgroundColor: t.color, borderColor: t.border }}
                    title={t.name}
                >
                    {/* Fake binding line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/10"></div>
                    
                    {selectedTheme === t.id && (
                            <div className={`absolute inset-0 flex items-center justify-center`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${t.id === 'midnight' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                </div>
                            </div>
                    )}
                    <span className={`absolute bottom-1 right-2 text-[9px] font-bold ${t.id === 'midnight' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.name}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default DiaryThemePicker;