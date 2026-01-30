import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  isEditable: boolean;
  placeholder?: string;
}

const COLORS = [
  { val: '#334155', name: 'Default' }, // Slate-700
  { val: '#ef4444', name: 'Red' },
  { val: '#f59e0b', name: 'Orange' },
  { val: '#10b981', name: 'Green' },
  { val: '#3b82f6', name: 'Blue' },
  { val: '#8b5cf6', name: 'Purple' },
  { val: '#db2777', name: 'Pink' },
];

const SIZES = [
  { val: '3', label: 'ปกติ' },
  { val: '5', label: 'ใหญ่' },
  { val: '7', label: 'หัวข้อ' },
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, isEditable, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // State for toolbar active buttons
  const [activeFormats, setActiveFormats] = useState({
      bold: false,
      italic: false,
      underline: false,
      unorderedList: false,
      orderedList: false,
      fontSize: '3',
  });

  // Sync content only when it changes externally
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML && !isUpdatingRef.current) {
        editorRef.current.innerHTML = content || '';
    }
  }, [content]);

  // Check Active Formats on Cursor Move/Select
  const checkFormats = () => {
    if (!isEditable || !document.queryCommandState) return;

    setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
        fontSize: document.queryCommandValue('fontSize') || '3',
    });
  };

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      checkFormats();
      setTimeout(() => isUpdatingRef.current = false, 100);
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if(editorRef.current) {
        editorRef.current.focus();
        handleInput();
    }
    setShowColorPicker(false);
  };

  return (
    <div className="flex flex-col h-full relative z-10 group">
      {/* --- User Friendly Floating Toolbar --- */}
      {isEditable && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-50 w-full md:w-max mx-auto md:mx-0 transition-all opacity-90 hover:opacity-100">
          
          {/* 1. Text Style Group */}
          <div className="flex gap-0.5 bg-slate-100 p-1 rounded-xl">
            <ToolbarBtn 
                onClick={() => execCmd('bold')} 
                isActive={activeFormats.bold}
                icon={<b className="font-serif text-lg">B</b>} 
                title="ตัวหนา" 
            />
            <ToolbarBtn 
                onClick={() => execCmd('italic')} 
                isActive={activeFormats.italic}
                icon={<i className="font-serif text-lg">I</i>} 
                title="ตัวเอียง" 
            />
            <ToolbarBtn 
                onClick={() => execCmd('underline')} 
                isActive={activeFormats.underline}
                icon={<u className="font-serif text-lg">U</u>} 
                title="ขีดเส้นใต้" 
            />
          </div>

          <div className="w-px h-6 bg-slate-300 mx-1"></div>

          {/* 2. Font Size */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
             {SIZES.map((s) => (
               <button
                 key={s.val}
                 onMouseDown={(e) => { e.preventDefault(); execCmd('fontSize', s.val); }}
                 className={`px-2 py-1 text-xs font-bold rounded-lg transition-all
                    ${activeFormats.fontSize === s.val ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}
               >
                 {s.label}
               </button>
             ))}
          </div>

          <div className="w-px h-6 bg-slate-300 mx-1"></div>

          {/* 3. Color Picker */}
          <div className="relative">
             <button
                onMouseDown={(e) => { e.preventDefault(); setShowColorPicker(!showColorPicker); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                title="เปลี่ยนสีตัวอักษร"
             >
                <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 ring-2 ring-white shadow-sm"></span>
             </button>
             
             {showColorPicker && (
               <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-slate-100 flex gap-1 z-50 animate-pop min-w-[180px]">
                  {COLORS.map((c) => (
                    <button
                      key={c.val}
                      onMouseDown={(e) => { e.preventDefault(); execCmd('foreColor', c.val); }}
                      className="w-6 h-6 rounded-full hover:scale-110 transition-transform ring-1 ring-slate-100"
                      style={{ backgroundColor: c.val }}
                      title={c.name}
                    />
                  ))}
               </div>
             )}
          </div>

          <div className="w-px h-6 bg-slate-300 mx-1"></div>

          {/* 4. Lists */}
          <div className="flex gap-0.5 bg-slate-100 p-1 rounded-xl">
             <ToolbarBtn 
                onClick={() => execCmd('insertUnorderedList')} 
                isActive={activeFormats.unorderedList}
                icon="• List" 
                title="รายการจุด" 
             />
             <ToolbarBtn 
                onClick={() => execCmd('insertOrderedList')} 
                isActive={activeFormats.orderedList}
                icon="1. List" 
                title="รายการตัวเลข" 
             />
          </div>
          
        </div>
      )}

      {/* Editor Area */}
      <div 
        ref={editorRef}
        contentEditable={isEditable}
        onInput={handleInput}
        onKeyUp={checkFormats}
        onMouseUp={checkFormats}
        onSelect={checkFormats}
        className={`editor-content w-full h-full bg-transparent text-slate-700 text-lg font-medium outline-none
            ${!isEditable ? 'cursor-default opacity-90' : 'cursor-text'} empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400/50`}
        data-placeholder={placeholder}
        style={{ minHeight: '400px', lineHeight: '2rem' }}
      />
    </div>
  );
};

const ToolbarBtn = ({ onClick, icon, title, isActive }: any) => (
  <button 
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all font-bold text-xs border border-transparent
        ${isActive ? 'toolbar-btn-active' : 'hover:bg-white hover:shadow-sm text-slate-600 hover:text-indigo-600'}`}
    title={title}
  >
    {icon}
  </button>
);

export default RichTextEditor;