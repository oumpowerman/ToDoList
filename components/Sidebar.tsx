import React from 'react';
import { TaskStatus, Category } from '../types';

interface SidebarProps {
  filter: 'All' | TaskStatus | string;
  setFilter: (filter: 'All' | TaskStatus | string) => void;
  stats: { total: number; completed: number; percent: number };
  categories: Category[];
  onOpenSettings: () => void;
  currentView: 'tasks' | 'dashboard' | 'diary';
  onChangeView: (view: 'tasks' | 'dashboard' | 'diary') => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    filter, setFilter, stats, categories, onOpenSettings, 
    currentView, onChangeView, onLogout 
}) => {
  const mainMenuItems = [
    { 
      label: 'งานทั้งหมด', 
      value: 'All', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
      color: "text-purple-600 bg-purple-100"
    },
    { 
      label: 'รอสะสาง', 
      value: TaskStatus.TODO, 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
      color: "text-blue-600 bg-blue-100"
    },
    { 
      label: 'เสร็จสิ้น', 
      value: TaskStatus.DONE, 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
      color: "text-green-600 bg-green-100"
    },
  ];

  const views = [
      { id: 'tasks', label: 'งาน', icon: '📝', color: 'text-violet-700' },
      { id: 'dashboard', label: 'สรุป', icon: '📊', color: 'text-orange-600' },
      { id: 'diary', label: 'Diary', icon: '📒', color: 'text-amber-700' },
  ];

  return (
    <aside className="bg-white/95 backdrop-blur-md md:w-80 md:h-screen md:sticky md:top-0 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col z-10 shadow-sm transition-all">
      <div className="p-5 md:p-8 flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {/* Logo */}
        <div className="hidden md:flex items-center gap-4 mb-8 group cursor-pointer">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-all duration-300">
             <span className="text-2xl duk-dik">🎨</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">SmartTask</h1>
            <span className="text-xs font-medium text-slate-500">ศิลปะแห่งการจัดการ</span>
          </div>
        </div>

        {/* --- Elastic View Switcher --- */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-2 mb-8 shadow-inner select-none">
            {views.map((v) => {
                const isActive = currentView === v.id;
                return (
                    <button 
                        key={v.id}
                        onClick={() => onChangeView(v.id as any)}
                        className={`
                            relative rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 
                            transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) overflow-hidden
                            ${isActive 
                                ? `flex-[1.5] bg-white shadow-md ring-1 ring-black/5 ${v.color}` 
                                : 'flex-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 grayscale hover:grayscale-0'
                            }
                        `}
                    >
                        <span className={`text-lg transition-transform duration-300 ${isActive ? 'scale-110 duk-dik' : ''}`}>{v.icon}</span>
                        {isActive && (
                            <span className="animate-slide-up whitespace-nowrap">{v.label}</span>
                        )}
                    </button>
                );
            })}
        </div>

        {/* Progress Card - Desktop Only (Hide if in Dashboard/Diary view) */}
        {currentView === 'tasks' && (
            <div className="hidden md:block mb-10 p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between text-base mb-3 text-slate-700 font-bold">
                <span>ความคืบหน้า</span>
                <span className="text-indigo-700">{stats.percent}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-4 p-0.5 border border-slate-200">
                <div 
                    className="bg-slate-800 h-2.5 rounded-full transition-all duration-700 ease-out relative" 
                    style={{ width: `${stats.percent}%` }}
                >
                </div>
                </div>
            </div>
            </div>
        )}

        {/* Mobile Filter Scroll - Show only on Tasks View */}
        {currentView === 'tasks' && (
            <nav className="flex gap-2 md:flex-col overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory md:pb-0 mb-4 md:mb-6">
            {mainMenuItems.map((item) => {
                const isActive = filter === item.value;
                return (
                <button
                    key={item.label}
                    onClick={() => setFilter(item.value as any)}
                    className={`snap-start flex items-center gap-2 md:gap-4 px-4 md:px-5 py-3 md:py-4 rounded-full md:rounded-2xl text-sm md:text-lg font-bold transition-all duration-200 whitespace-nowrap relative overflow-hidden flex-shrink-0 border md:border-0
                    ${isActive 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg transform scale-105 md:bg-indigo-50 md:text-indigo-800 md:shadow-none md:scale-100 md:border-transparent' 
                        : 'text-slate-600 bg-white border-slate-300 hover:bg-slate-100'}`}
                >
                    <div className={`hidden md:flex w-8 h-8 rounded-xl items-center justify-center transition-all ${isActive ? 'bg-white shadow-sm' : item.color.replace('text-', 'bg-').replace('600', '100') + ' opacity-100'}`}>
                        <svg className={`w-5 h-5 ${isActive ? 'text-indigo-700' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {item.icon}
                        </svg>
                    </div>
                    <span className="relative z-10">{item.label}</span>
                </button>
                );
            })}
            
            <div className="w-px bg-slate-300 mx-1 md:hidden h-10 self-center"></div>

            {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`snap-start flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold border transition-all whitespace-nowrap
                            ${filter === cat.id 
                                ? `bg-${cat.color}-600 text-white border-${cat.color}-600 shadow-md` 
                                : `bg-white text-slate-600 border-slate-300 hover:bg-slate-50`}`}
                    >
                        <div className={`w-3 h-3 rounded-full ${filter === cat.id ? 'bg-white' : `bg-${cat.color}-500`}`}></div>
                        <span>{cat.name}</span>
                    </button>
                ))}
                
                {/* Mobile Settings & Logout */}
                <button onClick={onOpenSettings} className="snap-start flex items-center justify-center w-10 h-10 rounded-full border-2 border-dashed border-slate-400 text-slate-500 hover:border-violet-500 hover:text-violet-600 md:hidden flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
                <div className="w-px bg-slate-300 mx-1 md:hidden h-10 self-center"></div>
                <button onClick={onLogout} className="snap-start flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-500 md:hidden flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </nav>
        )}

        {/* Categories Section Desktop */}
        <div className="hidden md:flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4 px-2 mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">หมวดหมู่งาน</h3>
                <button onClick={onOpenSettings} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-700 transition-colors" title="จัดการหมวดหมู่">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
            </div>
            <div className="space-y-2 flex-1">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            onChangeView('tasks');
                            setFilter(cat.id);
                        }}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-medium transition-all
                            ${filter === cat.id && currentView === 'tasks' ? `bg-${cat.color}-100 text-${cat.color}-900 font-bold shadow-sm ring-1 ring-${cat.color}-200` : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-${cat.color}-500 ${filter === cat.id && currentView === 'tasks' ? 'ring-2 ring-offset-1 ring-' + cat.color + '-300' : ''}`}></div>
                        <span className="truncate">{cat.name}</span>
                        {filter === cat.id && currentView === 'tasks' && <svg className="w-5 h-5 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                    </button>
                ))}
                {categories.length === 0 && (
                    <div onClick={onOpenSettings} className="px-5 py-6 border-2 border-dashed border-slate-300 rounded-2xl text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-colors group">
                        <span className="text-sm text-slate-500 group-hover:text-violet-600 font-bold">+ เพิ่มหมวดหมู่ใหม่</span>
                    </div>
                )}
            </div>
            
            {/* Logout Section Desktop (Bottom of Sidebar) */}
            <div className="mt-auto pt-6 border-t border-slate-100">
                <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl w-full transition-all font-bold group">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </div>
                    <span>ออกจากระบบ</span>
                </button>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;