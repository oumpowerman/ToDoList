import React, { useMemo } from 'react';
import { Task, Category, TaskStatus, Priority } from '../types';
import AddTask from './AddTask';
import FilterBar from './FilterBar';
import TaskItem from './TaskItem';

interface TasksViewProps {
  loading: boolean;
  tasks: Task[];
  categories: Category[];
  filters: {
    sidebarFilter: 'All' | TaskStatus | string;
    search: string; setSearch: (v: string) => void;
    priorityFilter: 'All' | Priority; setPriorityFilter: (v: 'All' | Priority) => void;
    startDate: string; setStartDate: (v: string) => void;
    endDate: string; setEndDate: (v: string) => void;
    resetFilters: () => void;
  };
  pagination: {
    hasMore: boolean;
    isLoadingMore: boolean;
    fetchMore: () => void;
  };
  actions: {
    addTask: (t: Task) => void;
    updateTask: (t: Task) => void;
    deleteTask: (id: string) => void;
    clearCompleted: () => void;
  };
  onShowAlert: (msg: string) => void;
  onConfirmDelete: (id: string) => void;
  onConfirmClear: () => void;
  onTaskClick: (task: Task) => void;
}

const TasksView: React.FC<TasksViewProps> = ({
  loading, tasks, categories, filters, pagination, actions,
  onShowAlert, onConfirmDelete, onConfirmClear, onTaskClick
}) => {
  const PAGE_SIZE = 20;

  // --- Smart Focus Logic (For Forgetful Users) ---
  const urgentSummary = useMemo(() => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todos = tasks.filter(t => t.status !== TaskStatus.DONE);
      
      const overdue = todos.filter(t => t.dueDate && t.dueDate < now.getTime());
      const dueToday = todos.filter(t => t.dueDate && t.dueDate >= now.getTime() && t.dueDate < tomorrow.getTime());
      
      return {
          count: overdue.length + dueToday.length,
          overdueCount: overdue.length,
          todayCount: dueToday.length,
          hasUrgent: overdue.length > 0 || dueToday.length > 0
      };
  }, [tasks]);

  const handleFocusUrgent = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      filters.setEndDate(todayStr); // Filter up to today
      onShowAlert(`🔥 กรองให้เฉพาะงานที่ต้องเคลียร์ภายในวันนี้แล้วนะ!`);
  };

  return (
    <>
      <div className="sticky top-0 z-40 -mx-4 px-4 pt-1 bg-indigo-50/95 backdrop-blur-md transition-all">
          <AddTask onAdd={actions.addTask} categories={categories} onShowAlert={onShowAlert} />
          
          {/* --- SMART FOCUS BANNER --- */}
          {urgentSummary.hasUrgent && !loading && filters.sidebarFilter === 'All' && !filters.search && (
              <div 
                onClick={handleFocusUrgent}
                className="mb-4 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl p-4 shadow-lg shadow-orange-200 text-white flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-transform animate-pop group relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-20 rounded-full blur-xl"></div>
                  
                  <div className="flex items-center gap-3 relative z-10">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-xl animate-bounce-short">
                          🔥
                      </div>
                      <div>
                          <h3 className="font-bold text-lg leading-tight">งานไฟลนก้น! ({urgentSummary.count})</h3>
                          <p className="text-xs text-white/90 font-medium">
                              {urgentSummary.overdueCount > 0 ? `เลยกำหนด ${urgentSummary.overdueCount} งาน` : ''} 
                              {urgentSummary.overdueCount > 0 && urgentSummary.todayCount > 0 ? ' และ ' : ''}
                              {urgentSummary.todayCount > 0 ? `ต้องทำวันนี้ ${urgentSummary.todayCount} งาน` : ''}
                          </p>
                      </div>
                  </div>
                  
                  <div className="bg-white text-orange-600 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm group-hover:bg-orange-50 transition-colors">
                      ดูเลย
                  </div>
              </div>
          )}

          <FilterBar 
              search={filters.search} setSearch={filters.setSearch}
              priorityFilter={filters.priorityFilter} setPriorityFilter={filters.setPriorityFilter}
              startDate={filters.startDate} setStartDate={filters.setStartDate}
              endDate={filters.endDate} setEndDate={filters.setEndDate}
              onClear={filters.resetFilters}
          />
      </div>

      <div className="pb-4">
      {loading && tasks.length === 0 ? (
          <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
      ) : tasks.length > 0 ? (
          <div className="space-y-2">
              {tasks.map(task => (
                  <TaskItem 
                      key={task.id} task={task} category={categories.find(c => c.id === task.categoryId)}
                      onUpdate={actions.updateTask} onDelete={onConfirmDelete} onClick={() => onTaskClick(task)}
                  />
              ))}
              
              {pagination.hasMore && (
                  <div className="pt-4 pb-2 flex justify-center">
                      <button 
                          onClick={pagination.fetchMore}
                          disabled={pagination.isLoadingMore}
                          className="px-6 py-2 bg-white border border-slate-200 text-slate-500 font-bold rounded-full shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                          {pagination.isLoadingMore ? <span className="animate-spin">⏳</span> : '👇'}
                          โหลดเพิ่มอีก
                      </button>
                  </div>
              )}
              {!pagination.hasMore && tasks.length > PAGE_SIZE && (
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
      
      {filters.sidebarFilter === TaskStatus.DONE && tasks.length > 0 && (
          <button onClick={onConfirmClear} className="mt-8 text-xs text-red-500 hover:text-red-600 font-bold bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl flex items-center gap-2 mx-auto transition-all hover:scale-105">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              ล้างรายการที่เสร็จในหน้านี้
          </button>
      )}
      </div>
    </>
  );
};

export default TasksView;