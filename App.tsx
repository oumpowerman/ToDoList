import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TaskItem from './components/TaskItem';
import AddTask from './components/AddTask';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import CategoryManager from './components/CategoryManager';
import TaskDetailModal from './components/TaskDetailModal';
import ConfirmModal from './components/ConfirmModal';
import Modal from './components/Modal';
import Dashboard from './components/Dashboard';
import FilterBar from './components/FilterBar';
import DiaryView from './components/DiaryView';

import { Task, TaskStatus, Priority, Category } from './types';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';

const PAGE_SIZE = 20;

function App() {
  const [session, setSession] = useState<Session | null>(null);
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Notification State
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // View & Filter State
  const [currentView, setCurrentView] = useState<'tasks' | 'dashboard' | 'diary'>('tasks');
  const [sidebarFilter, setSidebarFilter] = useState<'All' | TaskStatus | string>(TaskStatus.TODO);
  const [isTransitioning, setIsTransitioning] = useState(false); 
  const [isFocusMode, setIsFocusMode] = useState(false); // NEW: Controls Fullscreen Focus Mode
  
  // Advanced Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | Priority>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(true);
  
  // Modal States
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

  // --- Auth & Init ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
          fetchCategories(session.user.id);
          fetchTasks(false); // Initial Load
      } else {
          setLoading(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { setTasks([]); setCategories([]); }
      else { fetchCategories(session.user.id); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- Notification System ---
  useEffect(() => {
      // Request permission on load
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission();
      }

      // Check loop every 1 minute
      const interval = setInterval(() => {
          if (Notification.permission !== 'granted') return;

          const now = Date.now();
          tasks.forEach(task => {
              if (task.status === TaskStatus.DONE || !task.dueDate) return;
              if (notifiedTasks.has(task.id)) return;

              const timeLeft = task.dueDate - now;
              // Notify if due within 60 minutes (1 hour) and hasn't passed yet
              if (timeLeft > 0 && timeLeft <= 60 * 60 * 1000) {
                  // Trigger Notification
                  new Notification("⏰ ใกล้ถึงเวลานัดแล้ว!", {
                      body: `${task.title} ในอีก ${Math.ceil(timeLeft / 60000)} นาที`,
                      icon: '/favicon.ico' // Assuming standard icon or none
                  });
                  
                  // Mark as notified to prevent spam
                  setNotifiedTasks(prev => new Set(prev).add(task.id));
              }
          });
      }, 60000); 

      return () => clearInterval(interval);
  }, [tasks, notifiedTasks]);


  // --- Core Data Fetching (Server-Side Pagination & Filtering) ---
  
  const fetchTasks = useCallback(async (isLoadMore = false) => {
    if (!session?.user) return;

    if (!isLoadMore) setLoading(true);
    else setIsLoadingMore(true);

    const currentPage = isLoadMore ? page + 1 : 0;
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id) // Filter by user_id
      .order('created_at', { ascending: false })
      .range(from, to);

    // Apply Filters (Server Side)
    
    // 1. Sidebar Filter (Status or Category)
    if (sidebarFilter !== 'All') {
        if (Object.values(TaskStatus).includes(sidebarFilter as TaskStatus)) {
            if (sidebarFilter === TaskStatus.TODO) {
                 query = query.neq('status', TaskStatus.DONE); 
            } else {
                 query = query.eq('status', sidebarFilter);
            }
        } else {
            // It's a category ID
            query = query.eq('category_id', sidebarFilter);
        }
    }

    // 2. Search Text
    if (search) {
        query = query.ilike('title', `%${search}%`); 
    }

    // 3. Priority
    if (priorityFilter !== 'All') {
        query = query.eq('priority', priorityFilter);
    }

    // 4. Date Range
    if (startDate) {
        const startTs = new Date(startDate).getTime();
        query = query.gte('created_at', startTs);
    }
    if (endDate) {
        const endTs = new Date(endDate).getTime() + 86400000; // End of day
        query = query.lte('created_at', endTs);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching tasks:', error);
    } else {
        const mappedTasks: Task[] = (data || []).map((d: any) => ({
            id: d.id,
            title: d.title,
            description: d.description,
            priority: d.priority,
            status: d.status,
            createdAt: Number(d.created_at), 
            dueDate: d.due_date ? Number(d.due_date) : undefined,
            subtasks: d.subtasks || [],
            tags: d.tags || [],
            categoryId: d.category_id || undefined,
            activities: d.activities || [],
            links: d.links || []
        }));

        if (isLoadMore) {
            setTasks(prev => [...prev, ...mappedTasks]);
            setPage(currentPage);
        } else {
            setTasks(mappedTasks);
            setPage(0);
        }

        // Check if we reached the end
        setHasMore(mappedTasks.length === PAGE_SIZE);
    }
    
    setLoading(false);
    setIsLoadingMore(false);
  }, [session, sidebarFilter, search, priorityFilter, startDate, endDate, page]);

  // Trigger Fetch when Filters Change (Reset Page)
  useEffect(() => {
     fetchTasks(false);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarFilter, search, priorityFilter, startDate, endDate]); 

  const fetchCategories = async (userId: string) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId); 
        
    if (!error && data) setCategories(data);
  };

  // --- CRUD Operations ---

  const addTask = async (task: Task) => {
    if (!session?.user) return;
    // Optimistic UI Update (Add to top)
    setTasks(prev => [task, ...prev]);

    const { error } = await supabase.from('tasks').insert({
      id: task.id,
      user_id: session.user.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      created_at: task.createdAt,
      due_date: task.dueDate,
      subtasks: task.subtasks,
      tags: task.tags,
      category_id: task.categoryId,
      activities: task.activities,
      links: task.links
    });

    if (error) {
      console.error('Error adding task:', error);
      showAlert('บันทึกไม่สำเร็จ');
      fetchTasks(false); // Revert/Refresh
    }
  };

  const updateTask = async (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (activeTask?.id === updatedTask.id) setActiveTask(updatedTask);

    const { error } = await supabase.from('tasks').update({
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        status: updatedTask.status,
        due_date: updatedTask.dueDate,
        subtasks: updatedTask.subtasks,
        tags: updatedTask.tags,
        category_id: updatedTask.categoryId,
        activities: updatedTask.activities,
        links: updatedTask.links
    }).eq('id', updatedTask.id);

    if (error) console.error('Error updating task:', error);
  };

  const deleteTask = async (id: string) => {
    confirmAction("ลบงานนี้?", "กู้คืนไม่ได้นะ", async () => {
        setTasks(prev => prev.filter(t => t.id !== id));
        if (activeTask?.id === id) setActiveTask(null);
        await supabase.from('tasks').delete().eq('id', id);
    }, true, "ลบเลย");
  };

  const addCategory = async (category: Category) => {
      if (!session?.user) return;
      setCategories(prev => [...prev, category]);
      await supabase.from('categories').insert({
          id: category.id, user_id: session.user.id, name: category.name, color: category.color
      });
  };

  const deleteCategory = async (id: string) => {
      confirmAction("ลบหมวดหมู่นี้?", "งานจะไม่มีหมวดหมู่", async () => {
        setCategories(prev => prev.filter(c => c.id !== id));
        setTasks(prev => prev.map(t => t.categoryId === id ? { ...t, categoryId: undefined } : t));
        await supabase.from('categories').delete().eq('id', id);
      }, true);
  };

  const clearCompleted = async () => {
    if (!session?.user) return;
    confirmAction("ล้างงานเสร็จแล้ว?", "หายหมดเลยนะ", async () => {
        setTasks(prev => prev.filter(t => t.status !== TaskStatus.DONE));
        await supabase.from('tasks')
            .delete()
            .eq('status', TaskStatus.DONE)
            .eq('user_id', session.user.id); // Secure delete
        setTimeout(() => fetchTasks(false), 500);
    }, true, "ล้างเลย");
  };

  const handleLogout = async () => {
    confirmAction("จะไปแล้วหรอ?", "ไว้เจอกันใหม่นะ", async () => supabase.auth.signOut());
  }

  const resetFilters = () => {
      setSearch('');
      setPriorityFilter('All');
      setStartDate('');
      setEndDate('');
  };

  // --- View Transition Handler ---
  const handleViewChange = (view: 'tasks' | 'dashboard' | 'diary') => {
      if (view === currentView) return;
      
      // Reset focus mode if leaving diary
      if (currentView === 'diary') setIsFocusMode(false);

      // 1. Trigger Exit Animation
      setIsTransitioning(true);
      
      // 2. Wait for exit to finish, then swap view
      setTimeout(() => {
          setCurrentView(view);
          setIsTransitioning(false); // New view will mount with its own "Enter" animation
      }, 400); // Must match CSS animation duration
  };

  const currentCategoryName = useMemo(() => {
      const cat = categories.find(c => c.id === sidebarFilter);
      return cat ? cat.name : null;
  }, [categories, sidebarFilter]);

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-indigo-50/50 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* Sidebar: Conditionally Render */}
      {!isFocusMode && (
        <Sidebar 
            filter={sidebarFilter} 
            setFilter={setSidebarFilter} 
            stats={{ total: 0, completed: 0, percent: 0 }} 
            categories={categories}
            onOpenSettings={() => setShowCategoryManager(true)}
            currentView={currentView}
            onChangeView={handleViewChange}
            onLogout={handleLogout}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col relative transition-all duration-300
          ${isFocusMode 
            ? 'p-0 w-screen h-screen max-w-none fixed inset-0 z-50 bg-indigo-50' 
            : 'p-4 md:p-10 max-w-5xl mx-auto w-full h-[calc(100vh-130px)] md:h-screen'}`
      }>
        
        {/* Header: Hide in Focus Mode */}
        {!isFocusMode && (
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-center justify-between flex-1">
                <div className="animate-pop">
                    {currentView === 'tasks' ? (
                        <>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 truncate">
                                {currentCategoryName ? <><span className="text-slate-400">📂</span>{currentCategoryName}</> : 
                                sidebarFilter === TaskStatus.TODO ? "👋 งานรอเคลียร์" : sidebarFilter === TaskStatus.DONE ? "🏆 ผลงานที่จบแล้ว" : "📝 งานทั้งหมด"}
                            </h2>
                            <p className="text-slate-500 font-medium text-sm mt-1">
                                {tasks.length} รายการในหน้านี้
                            </p>
                        </>
                    ) : currentView === 'dashboard' ? (
                        <>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">📊 Dashboard</h2>
                            <p className="text-slate-500 font-medium text-sm mt-1">สรุปภาพรวมชีวิต</p>
                        </>
                    ) : (
                        <>
                            {/* Diary Header Hidden */}
                        </>
                    )}
                </div>
            </div>
            </header>
        )}

        {/* Content Container */}
        <div className={`flex-1 overflow-hidden relative flex flex-col transition-all duration-300 ${isTransitioning ? 'animate-page-exit' : 'animate-page-enter'}`}>
            {currentView === 'tasks' ? (
                <>
                    {/* Fixed Header Zone (AddTask + Filters) */}
                    <div className="sticky top-0 z-40 -mx-4 px-4 pt-1 bg-indigo-50/95 backdrop-blur-md transition-all">
                        <AddTask onAdd={addTask} categories={categories} onShowAlert={showAlert} />
                        <FilterBar 
                            search={search} setSearch={setSearch}
                            priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
                            startDate={startDate} setStartDate={setStartDate}
                            endDate={endDate} setEndDate={setEndDate}
                            onClear={resetFilters}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar pb-10 pr-1">
                    {loading && page === 0 ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : tasks.length > 0 ? (
                        <div className="space-y-2">
                            {tasks.map(task => (
                                <TaskItem 
                                    key={task.id} task={task} category={categories.find(c => c.id === task.categoryId)}
                                    onUpdate={updateTask} onDelete={deleteTask} onClick={() => setActiveTask(task)}
                                />
                            ))}
                            {hasMore && (
                                <div className="pt-4 pb-2 flex justify-center">
                                    <button 
                                        onClick={() => fetchTasks(true)}
                                        disabled={isLoadingMore}
                                        className="px-6 py-2 bg-white border border-slate-200 text-slate-500 font-bold rounded-full shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isLoadingMore ? <span className="animate-spin">⏳</span> : '👇'}
                                        โหลดเพิ่มอีก
                                    </button>
                                </div>
                            )}
                            {!hasMore && tasks.length > PAGE_SIZE && (
                                <div className="text-center py-4 text-xs text-slate-300 font-bold uppercase tracking-widest">
                                    — หมดแล้วจ้า —
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-60 text-center animate-pop">
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-100 rotate-3"><span className="text-3xl duk-dik">🧐</span></div>
                            <h3 className="text-slate-700 font-bold text-lg">ไม่พบงานที่ค้นหา</h3>
                            <p className="text-slate-400 text-sm mt-1">ลองเปลี่ยนตัวกรอง หรือเพิ่มงานใหม่</p>
                        </div>
                    )}
                    
                    {sidebarFilter === TaskStatus.DONE && tasks.length > 0 && (
                        <button onClick={clearCompleted} className="mt-8 text-xs text-red-500 hover:text-red-600 font-bold bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl flex items-center gap-2 mx-auto transition-all hover:scale-105">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            ล้างรายการที่เสร็จในหน้านี้
                        </button>
                    )}
                    </div>
                </>
            ) : currentView === 'dashboard' ? (
                <div className="flex-1 overflow-y-auto no-scrollbar"><Dashboard tasks={tasks} /></div>
            ) : (
                <div className="flex-1 overflow-y-auto no-scrollbar relative">
                    <DiaryView 
                        session={session} 
                        onClose={() => handleViewChange('tasks')} 
                        isFocusMode={isFocusMode}
                        onToggleFocus={() => setIsFocusMode(!isFocusMode)}
                    />
                </div>
            )}
        </div>
      </main>

      <TaskDetailModal isOpen={!!activeTask} task={activeTask} onClose={() => setActiveTask(null)} onUpdate={updateTask} />
      {showCategoryManager && <CategoryManager categories={categories} onAddCategory={addCategory} onDeleteCategory={deleteCategory} onClose={() => setShowCategoryManager(false)} />}
      <ConfirmModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(prev => ({...prev, isOpen: false}))} isDanger={confirmState.isDanger} confirmText={confirmState.confirmText} />
      <Modal isOpen={alertState.isOpen} onClose={() => setAlertState({isOpen: false, message: ''})} title="แจ้งเตือน"><div className="text-center p-4"><p className="text-slate-700">{alertState.message}</p><button onClick={() => setAlertState({isOpen: false, message: ''})} className="mt-6 w-full py-2 bg-slate-800 text-white rounded-xl font-bold">รับทราบ</button></div></Modal>
    </div>
  );
}

export default App;