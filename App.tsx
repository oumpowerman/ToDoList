import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import CategoryManager from './components/CategoryManager';
import TaskDetailModal from './components/TaskDetailModal';
import ConfirmModal from './components/ConfirmModal';
import Modal from './components/Modal';
import Dashboard from './components/Dashboard';
import DiaryView from './components/DiaryView';
import TasksView from './components/TasksView';

import { Task, TaskStatus } from './types';
import { supabase } from './services/supabaseClient';
import { useSmartTask } from './hooks/useSmartTask';

function App() {
  const { 
    session, profile, loading, tasks, categories, pagination, filters, actions 
  } = useSmartTask();

  // View State
  const [currentView, setCurrentView] = useState<'tasks' | 'dashboard' | 'diary'>('tasks');
  
  // Modal & Interaction States
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null); 
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean; confirmText?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  // Helpers
  const showAlert = (message: string) => setAlertState({ isOpen: true, message });
  const confirmAction = (title: string, message: string, action: () => void, isDanger = false, confirmText = 'ยืนยัน') => {
      setConfirmState({ isOpen: true, title, message, onConfirm: action, isDanger, confirmText });
  };

  // Handlers for Confirmation wrapping the Hook actions
  const handleDeleteTask = (id: string) => {
    confirmAction("ลบงานนี้จริงเหรอ?", "ลบแล้วกู้คืนไม่ได้นะ คิดดีๆ", () => {
        actions.deleteTask(id);
        if (activeTask?.id === id) setActiveTask(null);
    }, true, "ลบเลย");
  };

  const handleClearCompleted = () => {
    confirmAction("เคลียร์งานที่เสร็จแล้ว?", "มันจะหายไปหมดเลยนะ", actions.clearCompleted, true, "เคลียร์โลด");
  };

  const handleDeleteCategory = (id: string) => {
    confirmAction("ลบหมวดหมู่นี้?", "งานในหมวดนี้จะไม่มีบ้านอยู่นะ", () => actions.deleteCategory(id), true);
  };

  const handleLogout = () => {
    confirmAction("จะไปแล้วหรอ?", "ไว้เจอกันใหม่นะ ดูแลตัวเองด้วย!", () => supabase.auth.signOut());
  };

  // Helper for Header Title & Greeting
  const currentCategoryName = useMemo(() => {
      const cat = categories.find(c => c.id === filters.sidebarFilter);
      return cat ? cat.name : null;
  }, [categories, filters.sidebarFilter]);
  
  const userName = profile?.full_name || 'เพื่อน';

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-indigo-50/50 flex flex-col md:flex-row font-sans">
      <Sidebar 
        filter={filters.sidebarFilter} 
        setFilter={filters.setSidebarFilter} 
        stats={{ total: 0, completed: 0, percent: 0 }} 
        categories={categories}
        onOpenSettings={() => setShowCategoryManager(true)}
        currentView={currentView}
        onChangeView={setCurrentView}
        userEmail={session.user.email}
        userProfile={profile}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-4 md:p-10 max-w-5xl mx-auto w-full flex flex-col h-[calc(100vh-130px)] md:h-screen relative">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
          <div className="flex items-center justify-between flex-1">
            <div className="animate-pop">
                {currentView === 'tasks' ? (
                    <>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 truncate">
                            {currentCategoryName ? <><span className="text-slate-400">📂</span>{currentCategoryName}</> : 
                             filters.sidebarFilter === TaskStatus.TODO ? `👋 หวัดดี ${userName}! ลุยงานกัน` : filters.sidebarFilter === TaskStatus.DONE ? "🏆 ทำดีมาก! นี่คือผลงานเธอ" : `📝 งานทั้งหมดของ ${userName}`}
                        </h2>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            มี {tasks.length} รายการในหน้านี้นะ
                        </p>
                    </>
                ) : currentView === 'dashboard' ? (
                    <>
                         <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">📊 สรุปชีวิตของ {userName}</h2>
                         <p className="text-slate-500 font-medium text-sm mt-1">มาดูความเทพของเธอกัน</p>
                    </>
                ) : (
                    <>
                         <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">📒 ไดอารี่ของ {userName}</h2>
                         <p className="text-slate-500 font-medium text-sm mt-1">เก็บความทรงจำดีๆ ไว้นะ</p>
                    </>
                )}
            </div>
            <div className="md:hidden flex items-center gap-2">
                 <button onClick={handleLogout} className="p-2 text-slate-300 hover:text-red-500"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
            </div>
          </div>
        </header>

        {currentView === 'tasks' ? (
             <TasksView 
                loading={loading} tasks={tasks} categories={categories} 
                filters={filters} pagination={pagination} actions={actions}
                onShowAlert={showAlert} onConfirmDelete={handleDeleteTask} onConfirmClear={handleClearCompleted} onTaskClick={setActiveTask}
             />
        ) : currentView === 'dashboard' ? (
            <div className="flex-1 overflow-y-auto no-scrollbar"><Dashboard tasks={tasks} nickname={userName} /></div>
        ) : (
            <div className="flex-1 overflow-y-auto no-scrollbar"><DiaryView session={session} /></div>
        )}
      </main>

      {/* Modals */}
      <TaskDetailModal 
          isOpen={!!activeTask} 
          task={activeTask} 
          onClose={() => setActiveTask(null)} 
          onUpdate={(t) => {
              actions.updateTask(t);
              if (activeTask?.id === t.id) setActiveTask(t);
          }} 
      />
      
      {showCategoryManager && (
          <CategoryManager 
              categories={categories} 
              onAddCategory={actions.addCategory} 
              onDeleteCategory={handleDeleteCategory} 
              onClose={() => setShowCategoryManager(false)} 
          />
      )}
      
      <ConfirmModal 
          isOpen={confirmState.isOpen} 
          title={confirmState.title} 
          message={confirmState.message} 
          onConfirm={confirmState.onConfirm} 
          onCancel={() => setConfirmState(prev => ({...prev, isOpen: false}))} 
          isDanger={confirmState.isDanger} 
          confirmText={confirmState.confirmText} 
      />
      
      <Modal isOpen={alertState.isOpen} onClose={() => setAlertState({isOpen: false, message: ''})} title="แจ้งเตือนจ้า">
          <div className="text-center p-4">
              <p className="text-slate-700">{alertState.message}</p>
              <button onClick={() => setAlertState({isOpen: false, message: ''})} className="mt-6 w-full py-2 bg-slate-800 text-white rounded-xl font-bold">โอเค รับทราบ</button>
          </div>
      </Modal>
    </div>
  );
}

export default App;