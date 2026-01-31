import React, { useRef, useEffect, useState } from 'react';
import { PaperTheme } from './DiaryThemePicker';

export type PaperPattern = 'lines' | 'grid' | 'dots' | 'blank';

interface RichTextEditorProps {
    content: string;
    onChange: (val: string) => void;
    isEditable: boolean;
    theme: PaperTheme;
    pattern: PaperPattern;
    onPatternChange: (p: PaperPattern) => void;
    styles: any; // CSS styles object generated from parent
}

const PALETTE = [
    { color: '#334155', name: 'Slate' },
    { color: '#000000', name: 'Black' },
    { color: '#dc2626', name: 'Red' },
    { color: '#ea580c', name: 'Orange' },
    { color: '#16a34a', name: 'Green' },
    { color: '#2563eb', name: 'Blue' },
    { color: '#7c3aed', name: 'Violet' },
    { color: '#db2777', name: 'Pink' },
];

type ToolbarTab = 'format' | 'paragraph' | 'paper';

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    content, onChange, isEditable, theme, pattern, onPatternChange, styles 
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [activeColor, setActiveColor] = useState('#334155');
    const [activeTab, setActiveTab] = useState<ToolbarTab>('format');

    // Sync content changes from parent to editable div
    useEffect(() => {
        if (editorRef.current && content !== editorRef.current.innerHTML) {
             if (!editorRef.current.innerText.trim() && !content) {
                 editorRef.current.innerHTML = '';
             } else if (content !== editorRef.current.innerHTML) {
                 editorRef.current.innerHTML = content;
             }
        }
    }, [content]);

    const handleInput = () => {
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) editorRef.current.focus();
        
        if (command === 'foreColor' && value) {
            setActiveColor(value);
            setShowColorPalette(false);
        }
    };

    // --- UI Classes (High Contrast) ---
    // Toolbar Container: Solid background, strong border to separate from paper
    const toolbarContainerClass = `sticky top-0 z-50 transition-all -mx-6 md:-mx-14 mb-6 flex flex-col select-none bg-white border-b-2 border-slate-200 shadow-sm`;
    
    // Tab Button: Clean, togglable
    const tabBtnClass = (isActive: boolean) => `
        flex-1 py-2 text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all
        ${isActive 
            ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' 
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-b-2 border-transparent'}
    `;

    // Tool Button: Boxy, high contrast border/shadow
    const btnClass = "w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow active:scale-95 active:shadow-inner transition-all relative";
    const activeBtnStyle = "bg-indigo-600 text-white border-indigo-700 shadow-inner";
    
    const iconClass = "w-5 h-5";

    return (
        <div className="flex flex-col relative z-20">
             {/* --- NEW TABBED TOOLBAR --- */}
             <div className={toolbarContainerClass}>
                
                {/* 1. Top Row: History & Tabs Switcher */}
                <div className="flex items-center justify-between px-2 border-b border-slate-100 bg-white">
                    {/* Undo/Redo (Always visible) */}
                    <div className="flex items-center gap-1 py-1.5 pr-2 border-r border-slate-100 mr-2">
                        <button onClick={() => execCommand('undo')} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="ย้อนกลับ">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </button>
                        <button onClick={() => execCommand('redo')} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="ทำซ้ำ">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-1">
                        <button onClick={() => setActiveTab('format')} className={tabBtnClass(activeTab === 'format')}>
                            <span className="text-base font-serif font-bold">A</span> <span className="hidden sm:inline">ข้อความ</span>
                        </button>
                        <button onClick={() => setActiveTab('paragraph')} className={tabBtnClass(activeTab === 'paragraph')}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                            <span className="hidden sm:inline">จัดหน้า</span>
                        </button>
                        <button onClick={() => setActiveTab('paper')} className={tabBtnClass(activeTab === 'paper')}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            <span className="hidden sm:inline">กระดาษ</span>
                        </button>
                    </div>
                </div>

                {/* 2. Bottom Row: Tools (Changes based on active tab) */}
                <div className="p-2 bg-slate-50 flex items-center justify-center gap-2 min-h-[56px]">
                    
                    {/* --- TAB: FORMAT --- */}
                    {activeTab === 'format' && (
                        <div className="flex items-center gap-2 animate-pop">
                            <button onClick={() => execCommand('bold')} className={`${btnClass} font-bold`} title="ตัวหนา">B</button>
                            <button onClick={() => execCommand('italic')} className={`${btnClass} italic`} title="ตัวเอียง">I</button>
                            <button onClick={() => execCommand('underline')} className={`${btnClass} underline`} title="ขีดเส้นใต้">U</button>
                            
                            <div className="w-px h-8 bg-slate-300 mx-1"></div>

                            {/* Color Picker - No clipping now because overflow is visible */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowColorPalette(!showColorPalette)}
                                    className={`${btnClass} flex flex-col gap-0 items-center justify-center`}
                                    title="เลือกสีตัวอักษร"
                                >
                                    <span className="font-serif font-black text-lg leading-none mt-1" style={{ color: activeColor }}>A</span>
                                    <span className="w-5 h-1 rounded-full mt-0.5" style={{ backgroundColor: activeColor }}></span>
                                </button>

                                {/* Popup */}
                                {showColorPalette && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white rounded-xl shadow-xl border-2 border-slate-100 p-3 flex flex-col gap-3 animate-pop z-[100] min-w-[220px]">
                                        <div className="grid grid-cols-4 gap-2">
                                            {PALETTE.map(c => (
                                                <button 
                                                    key={c.name}
                                                    onClick={() => execCommand('foreColor', c.color)}
                                                    className="w-9 h-9 rounded-full border border-slate-100 hover:scale-110 transition-transform shadow-sm relative group"
                                                    style={{ backgroundColor: c.color }}
                                                    title={c.name}
                                                >
                                                     {activeColor === c.color && (
                                                        <span className="absolute inset-0 flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        {/* Custom Color */}
                                        <div className="border-t border-slate-100 pt-2 mt-1">
                                             <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer w-full">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-sm flex items-center justify-center text-white">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                </div>
                                                <span className="text-sm font-bold text-slate-600">สีอื่น...</span>
                                                <input type="color" className="absolute opacity-0 w-0 h-0" onChange={(e) => execCommand('foreColor', e.target.value)} />
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TAB: PARAGRAPH --- */}
                    {activeTab === 'paragraph' && (
                        <div className="flex items-center gap-2 animate-pop">
                            <button onClick={() => execCommand('insertUnorderedList')} className={btnClass} title="รายการแบบจุด">
                                <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /><circle cx="2" cy="6" r="1" fill="currentColor"/><circle cx="2" cy="12" r="1" fill="currentColor"/><circle cx="2" cy="18" r="1" fill="currentColor"/></svg>
                            </button>
                            <button onClick={() => execCommand('insertOrderedList')} className={btnClass} title="รายการแบบตัวเลข">
                                <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6h11M9 12h11M9 18h11M4 6h1v4m-1 0h2m0 8h.01M4 18h.01" /></svg>
                            </button>
                            
                            <div className="w-px h-8 bg-slate-300 mx-1"></div>

                            <button onClick={() => execCommand('outdent')} className={btnClass} title="ลดย่อหน้า">
                                <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => execCommand('indent')} className={btnClass} title="เพิ่มย่อหน้า">
                                <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    )}

                    {/* --- TAB: PAPER --- */}
                    {activeTab === 'paper' && (
                        <div className="flex items-center gap-2 animate-pop">
                             <button onClick={() => onPatternChange('lines')} className={`${btnClass} ${pattern === 'lines' ? activeBtnStyle : ''}`} title="เส้นบรรทัด">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h18M3 6h18M3 18h18"/></svg>
                             </button>
                             <button onClick={() => onPatternChange('grid')} className={`${btnClass} ${pattern === 'grid' ? activeBtnStyle : ''}`} title="ตาราง">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                             </button>
                             <button onClick={() => onPatternChange('blank')} className={`${btnClass} ${pattern === 'blank' ? activeBtnStyle : ''}`} title="กระดาษเปล่า">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2}/></svg>
                             </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Editable Content */}
            <style>{`
                [data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: ${styles.placeholderColor};
                    pointer-events: none;
                    display: block; 
                }
                .diary-content h1 { font-size: 2em; line-height: 72px; margin: 0; font-weight: 800; }
                .diary-content h2 { font-size: 1.5em; line-height: 36px; margin: 36px 0 0 0; font-weight: 700; }
                .diary-content p { margin: 0; }
                .diary-content ul, .diary-content ol { margin: 0; padding-left: 1.5em; }
                .diary-content li { margin: 0; line-height: 36px; }
            `}</style>
            <div
                ref={editorRef}
                contentEditable={isEditable}
                onInput={handleInput}
                suppressContentEditableWarning={true}
                className={`
                    diary-content w-full min-h-[500px] outline-none prose max-w-none font-sans
                    ${!isEditable ? 'cursor-default opacity-80' : 'cursor-text'}
                `}
                style={{
                    ...styles,
                    '--tw-prose-body': styles.color,
                    '--tw-prose-headings': styles.color,
                    '--tw-prose-bold': styles.color,
                    backgroundImage: styles.patternBg,
                    backgroundSize: styles.patternSize,
                    backgroundPosition: styles.patternPos,
                    backgroundAttachment: 'local'
                } as React.CSSProperties}
                data-placeholder={isEditable ? "วันนี้เป็นยังไงบ้าง? เล่าให้ฟังหน่อย..." : "ไม่ได้เขียนอะไรไว้..."}
            />
        </div>
    );
};

export default RichTextEditor;