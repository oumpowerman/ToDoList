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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({ 
          ...task, 
          activities: task.activities || [], 
          links: task.links || [] 
      });
      setActiveTab('info');
    }
  }, [task]);

  useEffect(() => {
      if (activeTab === 'activity' && scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [editedTask?.activities, activeTab]);

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
    
    updateField('activities', [...editedTask.activities, newActivity]);
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

  // --- Content Renderers ---

  const renderInfoTab = () => (
      <div className="flex flex-col gap-6 p-6">
           {/* Top Controls: Status & Priority */}
           <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สถานะ</label>
                    <select 
                        value={editedTask.status}
                        onChange={(e) => updateField('status', e.target.value)}
                        className={`text-sm p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-violet-200 cursor-pointer border border-slate-200 focus:border-violet-300 outline-none
                            ${editedTask.status === TaskStatus.DONE ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-700'}`}
                    >
                        {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ความสำคัญ</label>
                        <select 
                        value={editedTask.priority}
                        onChange={(e) => updateField('priority', e.target.value)}
                        className={`text-sm p-2.5 rounded-xl font-bold focus:ring-2 focus:ring-violet-200 cursor-pointer border border-slate-200 focus:border-violet-300 outline-none
                            ${editedTask.priority === Priority.HIGH ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-700'}`}
                    >
                            {Object.values(Priority).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
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
                    className="w-full h-32 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all text-sm resize-none"
                />
            </div>

            {/* Subtasks Manager */}
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
                        <div key={link.id} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl group hover:bg-white hover:shadow-sm transition-all">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-indigo-700 hover:underline truncate flex-1">
                                <div className="bg-white p-1.5 rounded-lg shadow-sm border border-indigo-50">🔗</div>
                                <span className="text-sm font-medium truncate">{link.title}</span>
                            </a>
                            <button onClick={() => removeLink(link.id)} className="text-slate-300 hover:text-red-500 p-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                    <form onSubmit={addLink} className="flex gap-2 items-center mt-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-50 focus-within:border-indigo-200 transition-all">
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
                        <button type="submit" disabled={!newLinkUrl} className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors">
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
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-5xl" height="sm:h-[85vh]">
      <div className="flex flex-col h-full">
          
          {/* Header (Desktop & Mobile Unified) */}
          <div className="bg-white shrink-0 border-b border-slate-100 flex flex-col">
              {/* Top Bar: Title & Close */}
              <div className="flex items-start justify-between p-4 sm:p-6 pb-2 sm:pb-4 gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">ชื่องาน</label>
                    <input 
                        type="text" 
                        value={editedTask.title}
                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                        onBlur={() => onUpdate(editedTask)}
                        className="text-xl sm:text-2xl font-bold text-slate-800 w-full border border-transparent hover:border-slate-100 focus:border-violet-200 focus:bg-slate-50 rounded-lg px-2 -ml-2 focus:outline-none transition-colors"
                        placeholder="ชื่องาน..."
                    />
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors"
                    title="ปิดหน้าต่าง"
                  >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>

              {/* Tabs */}
              <div className="flex px-4 sm:px-6 gap-6">
                  <button 
                    onClick={() => setActiveTab('info')}
                    className={`py-3 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2
                        ${activeTab === 'info' ? 'border-violet-500 text-violet-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      รายละเอียด
                  </button>
                  <button 
                    onClick={() => setActiveTab('activity')}
                    className={`py-3 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2
                        ${activeTab === 'activity' ? 'border-violet-500 text-violet-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      ประวัติ/แชท
                      {editedTask.activities.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{editedTask.activities.length}</span>}
                  </button>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 sm:bg-white relative">
             {activeTab === 'info' ? renderInfoTab() : renderActivityTab()}
          </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;