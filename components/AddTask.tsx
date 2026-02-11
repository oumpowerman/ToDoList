import React, { useState } from 'react';
import { generateTaskBreakdown } from '../services/geminiService';
import { Task, Priority, TaskStatus, Category, ActivityLog } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AddTaskProps {
  onAdd: (task: Task) => void;
  categories: Category[];
  onShowAlert: (msg: string) => void;
}

const AddTask: React.FC<AddTaskProps> = ({ onAdd, categories, onShowAlert }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [dueDate, setDueDate] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const initialLog: ActivityLog = {
        id: uuidv4(),
        content: '🔥 เริ่มลุยงานนี้! (สร้างรายการใหม่)',
        type: 'system',
        createdAt: Date.now()
    };

    const newTask: Task = {
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      priority,
      status: TaskStatus.TODO,
      createdAt: Date.now(),
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      subtasks: [],
      tags: [],
      categoryId: selectedCategoryId || undefined,
      activities: [initialLog],
      links: []
    };

    onAdd(newTask);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setShowOptions(false);
    setDueDate('');
    setPriority(Priority.MEDIUM);
  };

  const handleAiMagic = async () => {
    if (!title.trim()) return;
    setIsAiLoading(true);

    const result = await generateTaskBreakdown(title);
    
    if (result) {
      const initialLog: ActivityLog = {
          id: uuidv4(),
          content: '✨ AI ช่วยแตกงานให้แล้ว!',
          type: 'system',
          createdAt: Date.now()
      };

      const newTask: Task = {
        id: uuidv4(),
        title: title.trim(),
        description: description.trim(),
        priority: result.suggestedPriority,
        status: TaskStatus.TODO,
        createdAt: Date.now(),
        dueDate: result.suggestedDueDate ? new Date(result.suggestedDueDate).getTime() : (dueDate ? new Date(dueDate).getTime() : undefined),
        subtasks: result.subtasks.map(st => ({
          id: uuidv4(),
          title: st.title,
          duration: st.duration,
          completed: false
        })),
        tags: result.suggestedTags,
        categoryId: selectedCategoryId || undefined,
        activities: [initialLog],
        links: []
      };
      onAdd(newTask);
      resetForm();
    } else {
        onShowAlert("AI มึนตึ๊บ! ลองพิมพ์ใหม่ให้ชัดเจนขึ้นอีกนิดนะ");
    }
    
    setIsAiLoading(false);
  };

  // UI Helper for Selectors
  const priorityConfig = {
      [Priority.LOW]: { label: 'ไม่รีบ', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
      [Priority.MEDIUM]: { label: 'กลางๆ', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      [Priority.HIGH]: { label: 'ด่วนจี๋', color: 'bg-red-100 text-red-800 border-red-200' },
  };

  return (
    <div 
        className={`
            transition-all duration-300 ease-in-out relative z-40
            ${showOptions 
                ? 'bg-white rounded-[1.5rem] shadow-xl border-2 border-indigo-100 p-4 mb-4 ring-4 ring-indigo-50/50' 
                : 'bg-white rounded-[1.5rem] shadow-lg border border-indigo-50 p-2 mb-4 hover:shadow-xl hover:scale-[1.01]'
            }
        `}
    >
      <form onSubmit={handleSubmit} className="relative flex flex-col gap-3">
        
        {/* Top Row: Input & Main Actions */}
        <div className="flex items-start gap-2 md:gap-3">
          
            {/* Input Wrapper */}
            <div className={`flex-grow flex flex-col transition-all ${showOptions ? 'gap-3' : 'gap-0'}`}>
                <div className={`
                    flex items-center transition-all duration-300
                    ${showOptions 
                        ? 'bg-slate-50 border-slate-200 rounded-xl px-4 py-3 border-2' 
                        : 'bg-transparent border-transparent px-3 py-2'
                    }
                `}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="✨ วันนี้มีอะไรต้องทำ?..."
                        className={`w-full bg-transparent font-bold placeholder:text-slate-400 focus:outline-none text-slate-800 transition-all ${showOptions ? 'text-lg' : 'text-base'}`}
                        disabled={isAiLoading}
                        autoComplete="off"
                    />
                </div>
            </div>
          
            {/* Buttons Group */}
            <div className="flex items-center gap-2 flex-shrink-0">
                 {/* Toggle Details Button */}
                <button
                    type="button"
                    onClick={() => setShowOptions(!showOptions)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2
                        ${showOptions 
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700 rotate-180' 
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200'}`}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* AI Button */}
                <button
                    type="button"
                    onClick={handleAiMagic}
                    disabled={isAiLoading || !title.trim()}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90
                        ${isAiLoading ? 'bg-slate-100' : 'bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200'}`}
                >
                    {isAiLoading ? (
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <span className="text-lg duk-dik">✨</span>
                    )}
                </button>
                
                {/* Submit Button (Show if there is text or expanded) */}
                {(title.trim() || showOptions) && (
                    <button
                        type="submit"
                        disabled={!title.trim() || isAiLoading}
                        className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-300 animate-pop"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
        
        {/* Expanded Options */}
        {showOptions && (
            <div className="flex flex-col gap-3 animate-slide-up origin-top">
                 {/* 1. Description */}
                 <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="📝 รายละเอียดเพิ่มเติม..."
                    rows={2}
                    className="w-full text-sm p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl focus:outline-none focus:bg-white focus:border-violet-300 transition-all resize-none placeholder:text-slate-400 text-slate-800"
                 />

                 {/* 2. Controls Grid */}
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    
                    {/* Priority Selector */}
                    <div className="col-span-2 md:col-span-1 bg-white border border-slate-200 rounded-xl p-1 flex items-center justify-between relative overflow-hidden">
                        {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative z-10 
                                    ${priority === p ? 'shadow-sm transform scale-105 ' + priorityConfig[p].color : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {priorityConfig[p].label}
                            </button>
                        ))}
                    </div>

                    {/* Category Selector */}
                    <div className="relative col-span-1">
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full h-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 transition-all cursor-pointer text-xs"
                        >
                            <option value="">📂 ไม่ระบุหมวด</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="relative col-span-1">
                        <input 
                            type="datetime-local" 
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full h-full bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 transition-all text-xs"
                        />
                    </div>
                 </div>
            </div>
        )}
      </form>
    </div>
  );
};

export default AddTask;