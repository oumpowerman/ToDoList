import React, { useState } from 'react';
import { PaperTheme } from './DiaryThemePicker';
import RichTextEditor, { PaperPattern } from './RichTextEditor';

interface DiaryPaperProps {
    title: string;
    setTitle: (val: string) => void;
    content: string;
    setContent: (val: string) => void;
    mood: string;
    loading: boolean;
    isEditable: boolean;
    children?: React.ReactNode;
    isFocusMode: boolean;
    toggleFocusMode: () => void;
    theme: PaperTheme;
}

const DiaryPaper: React.FC<DiaryPaperProps> = ({ 
    title, setTitle, content, setContent, mood, loading, isEditable, children,
    isFocusMode, toggleFocusMode, theme
}) => {
    const [pattern, setPattern] = useState<PaperPattern>('lines');
    
    // --- Theme & Realistic Textures Logic ---
    const getStyles = () => {
        const lineHeight = '32px'; 
        const fontSize = '1rem'; 
        const paddingTop = '4px'; 

        // Theme Base Colors
        const t = {
            classic: { bg: '#ffffff', line: '#e2e8f0', text: '#334155', border: '#cbd5e1', placeholder: 'rgba(51, 65, 85, 0.4)', shadow: 'rgba(0,0,0,0.05)' },
            kraft:   { bg: '#f3e9d2', line: '#d6cbb5', text: '#5c4033', border: '#c7bba8', placeholder: 'rgba(92, 64, 51, 0.4)', shadow: 'rgba(60, 40, 20, 0.1)' },
            midnight:{ bg: '#1e293b', line: '#334155', text: '#e2e8f0', border: '#0f172a', placeholder: 'rgba(226, 232, 240, 0.3)', shadow: 'rgba(0,0,0,0.4)' },
            mint:    { bg: '#f0fdf4', line: '#dcfce7', text: '#15803d', border: '#bbf7d0', placeholder: 'rgba(21, 128, 61, 0.4)', shadow: 'rgba(20, 80, 40, 0.05)' },
            sakura:  { bg: '#fff1f2', line: '#ffe4e6', text: '#be123c', border: '#fecdd3', placeholder: 'rgba(190, 18, 60, 0.4)', shadow: 'rgba(100, 20, 40, 0.05)' },
            loft:    { bg: '#f8fafc', line: '#e2e8f0', text: '#475569', border: '#cbd5e1', placeholder: 'rgba(71, 85, 105, 0.4)', shadow: 'rgba(0,0,0,0.1)' },
        }[theme];

        // Texture Overlay
        let texture = 'none';
        if (theme === 'kraft') texture = 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.1\'/%3E%3C/svg%3E")';
        if (theme === 'midnight') texture = 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)';
        if (theme === 'loft') texture = 'radial-gradient(circle at 10% 20%, rgba(0,0,0,0.02) 0%, transparent 20%)';

        // Pattern Logic (for Editor Background)
        let patternBg = 'none';
        let patternSize = '100% 32px';
        let patternPos = '0 0';

        switch (pattern) {
            case 'lines':
                patternBg = `linear-gradient(transparent 31px, ${t.line} 31px)`;
                break;
            case 'grid':
                patternBg = `linear-gradient(transparent 31px, ${t.line} 31px), linear-gradient(90deg, transparent 31px, ${t.line} 31px)`;
                patternSize = '32px 32px';
                patternPos = '0 -1px';
                break;
            case 'dots':
                patternBg = `radial-gradient(${t.line} 1.5px, transparent 1.5px)`;
                patternSize = '32px 32px';
                break;
            default: patternBg = 'none';
        }

        return {
            containerBg: t.bg,
            borderColor: t.border,
            color: t.text,
            texture,
            lineHeight,
            fontSize,
            paddingTop: pattern === 'grid' ? '0px' : paddingTop, 
            patternBg,
            patternSize,
            patternPos,
            placeholderColor: t.placeholder,
            shadowColor: t.shadow,
            toolbarBg: theme === 'midnight' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            toolbarBorder: theme === 'midnight' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
        };
    };

    const styles = getStyles();

    return (
        <div 
            className={`
                flex-1 rounded-[1.5rem] md:rounded-[2rem] 
                border-2 relative overflow-hidden flex flex-col min-h-[75vh] transition-all duration-500 origin-center
                ${isFocusMode ? 'scale-[1.01] shadow-2xl z-50' : ''}
            `}
            style={{
                backgroundColor: styles.containerBg,
                borderColor: styles.borderColor,
                color: styles.color,
                boxShadow: `inset 0 0 60px rgba(0,0,0,0.02), 10px 10px 40px ${styles.shadowColor}`,
            }}
        >
            {/* Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-50" style={{ backgroundImage: styles.texture }}></div>

            {/* Binder Rings (Decoration) */}
            {!isFocusMode && theme !== 'midnight' && (
                <div className="hidden md:flex flex-col gap-8 absolute left-4 top-28 bottom-10 z-20 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-inner ring-4 ring-black/5"></div>
                    ))}
                </div>
            )}
            
            {/* Midnight Theme Leather Stitching Effect */}
            {theme === 'midnight' && (
                <div className="absolute inset-2 border border-dashed border-slate-600/50 rounded-[1.8rem] pointer-events-none z-10"></div>
            )}

            {/* Header / Actions - Absolute Positioned on top of editor */}
            <div className="absolute top-4 right-4 md:right-8 z-40 flex items-center gap-2">
                <span className="text-xl filter drop-shadow-sm hover:scale-110 transition-transform cursor-pointer" title="Mood">{mood}</span>
                <button 
                    onClick={toggleFocusMode}
                    className={`p-1.5 rounded-lg transition-all shadow-sm border ${isFocusMode ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:text-indigo-600'}`}
                >
                    {isFocusMode ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10H5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-4m-6-6l7-7m0 0l-7 7m7-7v6m0-6H14" /></svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    )}
                </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-6 md:px-14 py-6 relative z-10">
                
                {/* Title */}
                <div className="mb-2 border-b-2 pb-2 mt-8 md:mt-2" style={{ borderColor: styles.borderColor }}>
                     <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={isEditable ? "หัวข้อวันนี้..." : "ไม่มีหัวข้อ"}
                        readOnly={!isEditable}
                        style={{ color: styles.color }}
                        className="w-full bg-transparent text-xl md:text-2xl font-bold placeholder:opacity-40 focus:outline-none font-sans tracking-tight"
                     />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div></div>
                ) : (
                    <RichTextEditor 
                        content={content}
                        onChange={setContent}
                        isEditable={isEditable}
                        theme={theme}
                        pattern={pattern}
                        onPatternChange={setPattern}
                        styles={styles}
                    />
                )}
                
                <div className="mt-10 pt-6 border-t border-dashed" style={{ borderColor: styles.borderColor }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DiaryPaper;