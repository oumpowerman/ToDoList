import React, { useState, useEffect, useRef } from 'react';
import { Task, ActivityLog, LinkAttachment, Priority, TaskStatus, SubTask } from '../types';
import Modal from './Modal';
import SubtaskManager from './SubtaskManager';
import { v4 as uuidv4 } from 'uuid';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose, onUpdate }) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'activity'>('info');
  const [newLog, setNewLog] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [lastReadCount, setLastReadCount] = useState(0); 
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({ 
          ...task, 
          activities: task.activities || [], 
          links: task.links || [] 
      });
      const storedCount = localStorage.getItem(`task_read_${task.id}`);
      setLastReadCount(storedCount ? parseInt(storedCount) : 0);
      setActiveTab('info');
    }
  }, [task]);

  useEffect(() => {
      if (activeTab === 'activity' && editedTask) {
          const currentCount = editedTask.activities.length;
          localStorage.setItem(`task_read_${editedTask.id}`, currentCount.toString());
          setLastReadCount(currentCount);
          if (scrollRef.current) {
              setTimeout(() => {
                 if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }, 100);
          }
      }
  }, [activeTab, editedTask?.activities.length, editedTask?.id]);

  if (!editedTask) return null;

  const updateField = (field: keyof Task, value: any) => {
      const updated = { ...editedTask, [field]: value };
      setEditedTask(updated);
      onUpdate(updated);
  };

  const handleSubtasksUpdate = (newSubtasks: SubTask[]) => {
      let newStatus = editedTask.status;
      if (newSubtasks.length > 0 && newSubtasks.every(s => s.completed)) {
          newStatus = TaskStatus.DONE;
      } else if (newSubtasks.some(s => s.completed) && newStatus === TaskStatus.TODO) {
          newStatus = TaskStatus.IN_PROGRESS;
      }
      const updated = { ...editedTask, subtasks: newSubtasks, status: newStatus };
      setEditedTask(updated);
      onUpdate(updated);
  };

  const addActivityLog = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newLog.trim()) return;

    const newActivity: ActivityLog = {
      id: uuidv4(),
      content: newLog,
      type: 'comment',
      createdAt: Date.now()
    };
    
    const updatedActivities = [...editedTask.activities, newActivity];
    updateField('activities', updatedActivities);
    
    if (activeTab === 'activity') {
        setLastReadCount(updatedActivities.length);
        localStorage.setItem(`task_read_${editedTask.id}`, updatedActivities.length.toString());
    }
    setNewLog('');
  };

  const addLink = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newLinkUrl.trim()) return;

      const link: LinkAttachment = {
          id: uuidv4(),
          url: newLinkUrl.includes('http') ? newLinkUrl : `https://${newLinkUrl}`,
          title: newLinkTitle || newLinkUrl
      };
      updateField('links', [...editedTask.links, link]);
      setNewLinkUrl('');
      setNewLinkTitle('');
  };

  const removeLink = (id: string) => {
      updateField('links', editedTask.links.filter(l => l.id !== id));
  };

  // --- Helpers & UI Config ---
  const totalActivities = editedTask.activities.length;
  const unreadCount = Math.max(0, totalActivities - lastReadCount);

  // Pastel Color Configs
  const statusConfig = {
      [TaskStatus.TODO]: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', icon: '☁️' },
      [TaskStatus.IN_PROGRESS]: { bg: 'bg-peach-50', text: 'text-orange-400', border: 'border-peach-100', icon: '🎨' },
      [TaskStatus.DONE]: { bg: 'bg-mint-50', text: 'text-emerald-500', border: 'border-mint-100', icon: '🌸' },
  };

  const priorityConfig = {
      [Priority.LOW]: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100', label: 'ค่อยๆ ทำ 🍵' },
      [Priority.MEDIUM]: { bg: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-100', label: 'ตั้งใจนะ ✨' },
      [Priority.HIGH]: { bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-100', label: 'สำคัญมาก! 🎀' },
  };

  const totalMinutes = editedTask.subtasks.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const completedMinutes = editedTask.subtasks.filter(s => s.completed).reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const progressPercent = totalMinutes === 0 ? 0 : Math.round((completedMinutes / totalMinutes) * 100);

  const formatTime = (mins: number) => {
      if (mins === 0) return '0 น.';
      const hrs = Math.floor(mins / 60);
      const m = mins % 60;
      return hrs > 0 ? `${hrs} ชม. ${m} น.` : `${m} นาที`;
  };

  const renderInfoTab = () => (
      <div className="flex flex-col gap-6 p-4 sm:p-8 bg-[#FFFAF5]"> {/* Warm Ivory Background */}
           
           {/* Header Area */}
           <div className="relative">
                {/* Title Input - Optimized for Thai with fallback */}
                <input 
                    type="text" 
                    value={editedTask.title}
                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                    onBlur={() => onUpdate(editedTask)}
                    className="text-3xl font-sans font-bold text-slate-800 w-full bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-slate-300 leading-normal"
                    placeholder="วันนี้จะทำอะไรดีนะ..."
                />
                
                {/* Meta Controls (Pill Shapes) */}
                <div className="flex flex-wrap gap-3 mt-4">
                    {/* Status Pill */}
                    <div className="relative group">
                         <select 
                            value={editedTask.status}
                            onChange={(e) => updateField('status', e.target.value)}
                            className={`appearance-none pl-9 pr-8 py-2 rounded-full font-bold text-sm cursor-pointer transition-all border-2
                                ${statusConfig[editedTask.status].bg} 
                                ${statusConfig[editedTask.status].text}
                                ${statusConfig[editedTask.status].border}
                                focus:outline-none focus:ring-0 hover:brightness-95`}
                        >
                            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-base">
                            {statusConfig[editedTask.status].icon}
                        </span>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[10px]">▼</span>
                    </div>

                    {/* Priority Pill */}
                    <div className="relative">
                        <select 
                            value={editedTask.priority}
                            onChange={(e) => updateField('priority', e.target.value)}
                            className={`appearance-none pl-4 pr-8 py-2 rounded-full font-bold text-sm cursor-pointer transition-all border-2
                                ${priorityConfig[editedTask.priority].bg} 
                                ${priorityConfig[editedTask.priority].text}
                                ${priorityConfig[editedTask.priority].border}
                                focus:outline-none focus:ring-0 hover:brightness-95`}
                        >
                             {Object.values(Priority).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[10px]">▼</span>
                    </div>
                </div>
           </div>

           {/* Time Progress (Cute Card) */}
           {totalMinutes > 0 && (
               <div className="bg-gradient-to-tr from-[#FFF0F0] via-[#FFFAF0] to-[#F0FFF4] rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden animate-pop">
                    <div className="flex items-end justify-between mb-3 relative z-10">
                        <div>
                             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">ความพยายามทั้งหมด</p>
                             <div className="text-3xl font-black text-slate-700 font-sans tracking-tight">{formatTime(totalMinutes)}</div>
                        </div>
                        <div className="text-right">
                             <div className="text-[11px] font-bold text-rose-400 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                                เหลืออีก {formatTime(totalMinutes - completedMinutes)}
                             </div>
                        </div>
                    </div>

                    {/* Candy Progress Bar */}
                    <div className="relative h-4 w-full bg-white/50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                         <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-300 via-peach-300 to-amber-300 transition-all duration-1000 ease-out rounded-full"
                            style={{ width: `${progressPercent}%` }}
                         >
                            <div className="w-full h-full opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.8) 10px, rgba(255,255,255,0.8) 20px)' }}></div>
                         </div>
                    </div>
                    <div className="text-center mt-2 text-[11px] font-bold text-slate-400 italic">
                        เก่งมาก! ทำไปได้ {progressPercent}% แล้วนะ 🧸
                    </div>
               </div>
           )}

            {/* Note Section (Softer Memo) */}
            <div className="bg-[#FFFCF5] border-2 border-[#F7EFE0] p-4 rounded-3xl shadow-sm transition-all duration-300 focus-within:border-amber-200 focus-within:shadow-md">
                <label className="text-[11px] font-bold text-amber-500/60 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <span className="text-base">📝</span> บันทึกช่วยจำ
                </label>
                <textarea
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    onBlur={() => onUpdate(editedTask)}
                    placeholder="มีอะไรอยากจดไว้ไหม..."
                    className="w-full h-24 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-600 text-sm resize-none placeholder-amber-200 leading-relaxed font-sans"
                />
            </div>

            {/* Subtasks Area */}
            <div className="bg-white/60 rounded-[2rem] border-2 border-slate-50 shadow-sm p-5 focus-within:bg-white transition-all">
                 <SubtaskManager 
                    subtasks={editedTask.subtasks} 
                    onUpdate={handleSubtasksUpdate} 
                />
            </div>

             {/* Links (Cute Pastel Tags) */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 px-1">
                    <span className="bg-indigo-50 text-indigo-400 p-1 rounded-lg">🔗</span> แหล่งข้อมูล
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {editedTask.links.map(link => (
                        <div key={link.id} className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-500 rounded-2xl border-2 border-indigo-50 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group max-w-full">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:underline truncate">
                                {link.title}
                            </a>
                            <button onClick={() => removeLink(link.id)} className="text-indigo-200 hover:text-rose-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
                
                <form onSubmit={addLink} className="flex gap-2 items-center bg-white/80 p-1.5 rounded-2xl border-2 border-slate-50 focus-within:border-indigo-100 transition-all">
                    <input 
                        className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-0 placeholder-slate-300 font-sans"
                        placeholder="วาง URL ที่นี่..."
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                    />
                     <input 
                        className="w-1/3 bg-slate-50/50 border-none px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-0 placeholder-slate-300 font-sans"
                        placeholder="ตั้งชื่อ..."
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                    />
                    <button type="submit" disabled={!newLinkUrl} className="bg-indigo-400 text-white p-2.5 rounded-xl hover:bg-indigo-500 disabled:opacity-30 shadow-sm transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </button>
                </form>
            </div>
            <div className="h-10"></div>
      </div>
  );

  const renderActivityTab = () => (
      <div className="flex flex-col h-full bg-[#FCFDFE]">
           <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar" ref={scrollRef}>
                <div className="text-center py-4">
                    <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 uppercase tracking-widest">
                        เริ่มต้นบันทึกเมื่อ {new Date(editedTask.createdAt).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}
                    </span>
                </div>
                
                {editedTask.activities.sort((a,b) => a.createdAt - b.createdAt).map((log) => {
                    const isSystem = log.type === 'system';
                    return (
                        <div key={log.id} className={`flex ${isSystem ? 'justify-center' : 'justify-end'}`}>
                            {isSystem ? (
                                <div className="text-xs text-slate-400 flex items-center gap-2 my-2 italic opacity-60">
                                     <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                     <span>{log.content}</span>
                                     <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                </div>
                            ) : (
                                <div className="max-w-[80%] flex flex-col items-end animate-slide-up">
                                    <div className="bg-white text-slate-600 px-5 py-3.5 rounded-3xl rounded-tr-none shadow-sm border border-slate-100 text-sm leading-relaxed relative font-sans">
                                        {log.content}
                                    </div>
                                    <span className="text-[9px] text-slate-300 mt-1.5 mr-2 font-bold uppercase">
                                        {new Date(log.createdAt).toLocaleString('th-TH', { hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div className="h-4"></div>
           </div>

           <div className="bg-white p-4 border-t border-slate-50 sticky bottom-0 z-20">
               <form onSubmit={addActivityLog} className="flex items-end gap-3 bg-slate-50/80 p-2 rounded-[2rem] border-2 border-slate-100 focus-within:bg-white focus-within:border-indigo-100 transition-all">
                    <textarea
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        className="flex-1 bg-transparent border-none rounded-2xl px-4 py-3 text-sm focus:ring-0 focus:outline-none transition-all resize-none max-h-24 placeholder-slate-300 font-sans"
                        placeholder="พิมพ์อัปเดตงานที่นี่..."
                        rows={1}
                        style={{ minHeight: '44px' }}
                    />
                    <button 
                        type="submit" 
                        disabled={!newLog.trim()}
                        className="w-12 h-12 bg-indigo-400 text-white rounded-full hover:bg-indigo-500 disabled:opacity-30 transition-all shadow-md flex items-center justify-center flex-shrink-0"
                    >
                        <svg className="w-6 h-6 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
               </form>
           </div>
      </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col h-full sm:h-[680px] bg-[#FFFAF5] font-sans"> 
          {/* Tabs Navigation */}
          <div className="pt-3 px-3 bg-white sticky top-0 z-30 shadow-sm border-b border-slate-50">
             <div className="flex justify-end items-center mb-2 px-2">
                 <button onClick={onClose} className="sm:hidden p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-400 rounded-full transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
             </div>
             
             {/* Pill Styled Tabs */}
             <div className="flex p-1.5 bg-slate-50 rounded-2xl mx-4 mb-4 relative shadow-inner border border-slate-100">
                 <button 
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all relative z-10 flex items-center justify-center gap-2
                        ${activeTab === 'info' ? 'bg-white text-slate-800 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                     <span className="text-lg">📒</span> รายละเอียด
                 </button>
                 <button 
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all relative z-10 flex items-center justify-center gap-2
                        ${activeTab === 'activity' ? 'bg-white text-slate-800 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                     <span className="text-lg">💬</span> ความคืบหน้า
                     {unreadCount > 0 && (
                        <span className="bg-rose-400 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                            {unreadCount}
                        </span>
                     )}
                 </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar relative">
             {activeTab === 'info' ? renderInfoTab() : renderActivityTab()}
          </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;