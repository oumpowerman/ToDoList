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
  const [lastReadCount, setLastReadCount] = useState(0); // For Smart Badge
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({ 
          ...task, 
          activities: task.activities || [], 
          links: task.links || [] 
      });
      // Smart Badge: Load last read count
      const storedCount = localStorage.getItem(`task_read_${task.id}`);
      setLastReadCount(storedCount ? parseInt(storedCount) : 0);
      
      // Reset to info tab when opening a new task, unless needed otherwise
      // But user might want to stay on activity if they just closed it? 
      // Let's default to info for clarity.
      setActiveTab('info');
    }
  }, [task]);

  // Smart Badge Logic: Update read count when switching to activity tab
  useEffect(() => {
      if (activeTab === 'activity' && editedTask) {
          const currentCount = editedTask.activities.length;
          localStorage.setItem(`task_read_${editedTask.id}`, currentCount.toString());
          setLastReadCount(currentCount);
          
          // Scroll to bottom
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
      // Auto-update status if all subtasks are done
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
    
    // Update local state and parent
    const updatedActivities = [...editedTask.activities, newActivity];
    updateField('activities', updatedActivities);
    
    // Auto update read count so badge doesn't appear for own message
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

  // Calculate Badge Count
  const totalActivities = editedTask.activities.length;
  const unreadCount = Math.max(0, totalActivities - lastReadCount);

  const renderInfoTab = () => (
      <div className="flex flex-col gap-6 p-6">
           {/* Header Input Section */}
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <input 
                    type="text" 
                    value={editedTask.title}
                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                    onBlur={() => onUpdate(editedTask)}
                    className="text-xl font-bold text-slate-800 w-full border-b border-transparent focus:border-violet-200 focus:outline-none bg-transparent placeholder-slate-300 pb-2 mb-3 transition-colors"
                    placeholder="ชื่องาน..."
                />
                <div className="flex gap-3">
                    <div className="flex flex-col gap-1 w-1/2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">สถานะ</label>
                        <select 
                            value={editedTask.status}
                            onChange={(e) => updateField('status', e.target.value)}
                            className={`text-xs p-2 rounded-lg font-bold focus:ring-0 cursor-pointer border-0
                                ${editedTask.status === TaskStatus.DONE ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 w-1/2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">ความสำคัญ</label>
                         <select 
                            value={editedTask.priority}
                            onChange={(e) => updateField('priority', e.target.value)}
                            className={`text-xs p-2 rounded-lg font-bold focus:ring-0 cursor-pointer border-0
                                ${editedTask.priority === Priority.HIGH ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}
                        >
                             {Object.values(Priority).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
           </div>

           {/* Description Section */}
            <div className="group">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2 px-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                    บันทึกช่วยจำ
                </label>
                <textarea
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    onBlur={() => onUpdate(editedTask)}
                    placeholder="มีรายละเอียดอะไรไหม?"
                    className="w-full h-24 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all text-sm resize-none"
                />
            </div>

            {/* Subtasks Manager (Refactored) */}
            <SubtaskManager 
                subtasks={editedTask.subtasks} 
                onUpdate={handleSubtasksUpdate} 
            />

             {/* Link Attachments */}
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2 px-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    แนบลิ้งก์
                </label>
                <div className="space-y-2">
                    {editedTask.links.map(link => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl group">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-indigo-700 hover:underline truncate flex-1">
                                <div className="bg-white p-1.5 rounded-lg shadow-sm">🔗</div>
                                <span className="text-sm font-medium truncate">{link.title}</span>
                            </a>
                            <button onClick={() => removeLink(link.id)} className="text-slate-300 hover:text-red-500 p-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                    <form onSubmit={addLink} className="flex gap-2 items-center mt-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <input 
                            className="flex-1 bg-transparent px-2 py-1.5 text-sm focus:outline-none"
                            placeholder="วาง URL ที่นี่..."
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                        />
                         <input 
                            className="w-1/3 bg-slate-50 rounded-lg px-2 py-1.5 text-xs focus:outline-none border border-slate-100"
                            placeholder="ชื่อ (ไม่บังคับ)"
                            value={newLinkTitle}
                            onChange={(e) => setNewLinkTitle(e.target.value)}
                        />
                        <button type="submit" disabled={!newLinkUrl} className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </form>
                </div>
            </div>
            <div className="h-10"></div>
      </div>
  );

  const renderActivityTab = () => (
      <div className="flex flex-col h-full bg-slate-100/50 sm:bg-slate-50">
           <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                <div className="text-center py-4">
                    <span className="text-xs text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">
                        สร้างเมื่อ {new Date(editedTask.createdAt).toLocaleString('th-TH')}
                    </span>
                </div>
                
                {editedTask.activities.sort((a,b) => a.createdAt - b.createdAt).map((log) => {
                    const isSystem = log.type === 'system';
                    return (
                        <div key={log.id} className={`flex ${isSystem ? 'justify-center' : 'justify-end'}`}>
                            {isSystem ? (
                                <div className="text-xs text-slate-400 flex items-center gap-2 my-2">
                                     <span className="h-px w-8 bg-slate-200"></span>
                                     <span>{log.content}</span>
                                     <span className="h-px w-8 bg-slate-200"></span>
                                </div>
                            ) : (
                                <div className="max-w-[85%] flex flex-col items-end">
                                    <div className="bg-white text-slate-700 px-4 py-2.5 rounded-2xl rounded-tr-none shadow-sm border border-slate-100 text-sm leading-relaxed">
                                        {log.content}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 mr-1">
                                        {new Date(log.createdAt).toLocaleString('th-TH', { hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div className="h-4"></div>
           </div>

           <div className="bg-white p-3 border-t border-slate-100 sticky bottom-0 z-20">
               <form onSubmit={addActivityLog} className="flex items-end gap-2">
                    <textarea
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-50 transition-all resize-none max-h-24"
                        placeholder="พิมพ์บันทึก..."
                        rows={1}
                        style={{ minHeight: '44px' }}
                    />
                    <button 
                        type="submit" 
                        disabled={!newLog.trim()}
                        className="p-3 bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:opacity-50 disabled:bg-slate-200 transition-all shadow-lg shadow-violet-200 flex-shrink-0 mb-0.5"
                    >
                        <svg className="w-5 h-5 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
               </form>
           </div>
      </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col h-full sm:h-[600px]">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 bg-white shrink-0 sticky top-0 z-30">
              <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2
                    ${activeTab === 'info' ? 'border-violet-500 text-violet-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  รายละเอียด
              </button>
              <button 
                onClick={() => setActiveTab('activity')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2
                    ${activeTab === 'activity' ? 'border-violet-500 text-violet-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  ประวัติ/แชท
                  {/* Smart Badge: Only show if unreadCount > 0 */}
                  {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                          {unreadCount}
                      </span>
                  )}
              </button>
              <button onClick={onClose} className="sm:hidden px-4 text-slate-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 sm:bg-white relative">
             {activeTab === 'info' ? renderInfoTab() : renderActivityTab()}
          </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;