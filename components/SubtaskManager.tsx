import React, { useState } from 'react';
import { SubTask, Task } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SubtaskManagerProps {
  subtasks: SubTask[];
  onUpdate: (newSubtasks: SubTask[]) => void;
}

const SubtaskManager: React.FC<SubtaskManagerProps> = ({ subtasks, onUpdate }) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: SubTask = {
      id: uuidv4(),
      title: newSubtaskTitle.trim(),
      completed: false
    };

    onUpdate([...subtasks, newSubtask]);
    setNewSubtaskTitle('');
  };

  const handleToggle = (id: string) => {
    const updated = subtasks.map(s => 
      s.id === id ? { ...s, completed: !s.completed } : s
    );
    onUpdate(updated);
  };

  const handleDelete = (id: string) => {
    const updated = subtasks.filter(s => s.id !== id);
    onUpdate(updated);
  };

  // Calculate Progress
  const completedCount = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length === 0 ? 0 : Math.round((completedCount / subtasks.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            เช็คลิสต์งานย่อย ({completedCount}/{subtasks.length})
        </label>
        {subtasks.length > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${progress === 100 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                {progress}%
            </span>
        )}
      </div>

      {/* Progress Bar */}
      {subtasks.length > 0 && (
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
              <div 
                className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-violet-500'}`} 
                style={{ width: `${progress}%` }}
              ></div>
          </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {subtasks.length === 0 && (
            <div className="p-8 text-center bg-slate-50/50">
                <p className="text-sm text-slate-400 italic">ยังไม่มีงานย่อย</p>
                <p className="text-xs text-slate-300 mt-1">เช่น งานตัดต่อ: ตัดชน, ใส่ซับ, เกรดสี</p>
            </div>
        )}
        
        {subtasks.map((st, i) => (
            <div key={st.id} className={`group flex items-center gap-3 p-3 transition-colors hover:bg-slate-50 ${i !== subtasks.length -1 ? 'border-b border-slate-50' : ''}`}>
                <button 
                    onClick={() => handleToggle(st.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-violet-500 border-violet-500' : 'border-slate-200 bg-white hover:border-violet-300'}`}
                >
                    {st.completed && <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
                
                <span 
                    onClick={() => handleToggle(st.id)}
                    className={`text-sm flex-1 cursor-pointer select-none transition-all ${st.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}
                >
                    {st.title}
                </span>

                <button 
                    onClick={() => handleDelete(st.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="ลบรายการย่อย"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        ))}

        {/* Add New Input */}
        <form onSubmit={handleAdd} className="border-t border-slate-100 bg-slate-50 p-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-50 transition-all">
                <span className="text-slate-400 text-lg">+</span>
                <input 
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="เพิ่มรายการย่อย..."
                    className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-slate-400 text-slate-700"
                />
                <button 
                    type="submit" 
                    disabled={!newSubtaskTitle.trim()}
                    className="text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-all"
                >
                    เพิ่ม
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default SubtaskManager;