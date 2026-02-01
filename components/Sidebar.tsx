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
  userEmail?: string;
  userProfile?: { full_name: string; avatar_url: string } | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    filter, setFilter, stats, categories, onOpenSettings, 
    currentView, onChangeView, userEmail, userProfile, onLogout
}) => {
  
  const displayName = userProfile?.full_name || (userEmail ? userEmail.split('@')[0] : 'เพื่อน');
  const avatar = userProfile?.avatar_url;

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

  return (
    <aside className="bg-white/95 backdrop-blur-md md:h-screen md:sticky md:top-0 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col z-10 shadow-sm transition-all duration-300 ease-in-out flex-shrink-0 md:w-20 xl:w-72">
      <div className="p-3 md:p-4 xl:p-6 flex-1 overflow-y-auto no-scrollbar flex flex-col items-center xl:items-stretch">
        
        {/* Logo */}
        <div className="hidden md:flex items-center gap-4 mb-8 group cursor-pointer justify-center xl:justify-start">
          <div className="w-10 h-10 xl:w-12 xl:h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-all duration-300 flex-shrink-0">
             <span className="text-xl xl:text-2xl">🎨</span>
          </div>
          <div className="hidden xl:block">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">SmartTask</h1>
            <span className="text-xs font-medium text-slate-500">ศิลปะแห่งการจัดการ</span>
          </div>
        </div>

        {/* --- COMPACT VIEW SWITCHER --- */}
        <div className="w-full mb-4 md:mb-8">
            <div className="grid grid-cols-3 md:flex md:flex-col gap-1 bg-slate-50 p-1 rounded-2xl md:rounded-3xl border border-slate-100">
                <button 
                    onClick={() => onChangeView('tasks')}
                    title="งานของฉัน"
                    className={`flex items-center justify-center md:justify-center xl:justify-start gap-1.5 md:gap-3 py-2 md:py-3 px-2 md:px-0 xl:px-4 rounded-xl md:rounded-2xl transition-all duration-300
                        ${currentView === 'tasks' 
                            ? 'bg-white text-violet-700 shadow-sm ring-1 ring-slate-200 font-bold' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 font-medium'}`}
                >
                    <svg className={`w-5 h-5 flex-shrink-0 ${currentView === 'tasks' ? 'text-violet-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <span className="text-xs md:text-sm xl:text-base md:hidden xl:inline">งาน</span>
                </button>
                
                <button 
                    onClick={() => onChangeView('dashboard')}
                    title="ภาพรวม"
                    className={`flex items-center justify-center md:justify-center xl:justify-start gap-1.5 md:gap-3 py-2 md:py-3 px-2 md:px-0 xl:px-4 rounded-xl md:rounded-2xl transition-all duration-300
                        ${currentView === 'dashboard' 
                            ? 'bg-white text-orange-700 shadow-sm ring-1 ring-slate-200 font-bold' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 font-medium'}`}
                >
                    <svg className={`w-5 h-5 flex-shrink-0 ${currentView === 'dashboard' ? 'text-orange-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                    <span className="text-xs md:text-sm xl:text-base md:hidden xl:inline">ภาพรวม</span>
                </button>

                <button 
                    onClick={() => onChangeView('diary')}
                    title="ไดอารี่"
                    className={`flex items-center justify-center md:justify-center xl:justify-start gap-1.5 md:gap-3 py-2 md:py-3 px-2 md:px-0 xl:px-4 rounded-xl md:rounded-2xl transition-all duration-300
                        ${currentView === 'diary' 
                            ? 'bg-white text-amber-800 shadow-sm ring-1 ring-slate-200 font-bold' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 font-medium'}`}
                >
                    <span className="text-lg leading-none md:text-xl">📒</span>
                    <span className="text-xs md:text-sm xl:text-base md:hidden xl:inline">ไดอารี่</span>
                </button>
            </div>
        </div>

        {/* Progress Card - Show only on XL Desktop */}
        {currentView === 'tasks' && (
            <div className="hidden xl:block mb-8 p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner relative overflow-hidden w-full">
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
            <nav className="flex gap-2 md:flex-col overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory md:pb-0 mb-4 md:mb-6 w-full md:items-center xl:items-stretch">
            {mainMenuItems.map((item) => {
                const isActive = filter === item.value;
                return (
                <button
                    key={item.label}
                    onClick={() => setFilter(item.value as any)}
                    title={item.label}
                    className={`snap-start flex items-center justify-center xl:justify-start gap-2 md:gap-4 px-4 xl:px-5 py-2.5 md:py-3 xl:py-4 rounded-full md:rounded-2xl text-sm md:text-base font-bold transition-all duration-200 whitespace-nowrap relative overflow-hidden flex-shrink-0 border md:border-0 w-full
                    ${isActive 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg transform scale-105 md:bg-indigo-50 md:text-indigo-800 md:shadow-none md:scale-100 md:border-transparent' 
                        : 'text-slate-600 bg-white border-slate-300 hover:bg-slate-100'}`}
                >
                    <div className={`hidden md:flex w-8 h-8 rounded-xl items-center justify-center transition-all ${isActive ? 'bg-white shadow-sm' : item.color.replace('text-', 'bg-').replace('600', '100') + ' opacity-100'}`}>
                        <svg className={`w-5 h-5 ${isActive ? 'text-indigo-700' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {item.icon}
                        </svg>
                    </div>
                    <span className="relative z-10 md:hidden xl:inline">{item.label}</span>
                </button>
                );
            })}
            
            <div className="w-px bg-slate-300 mx-1 md:hidden h-8 self-center"></div>

            {/* Mobile/Tablet Category Pills */}
            {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`md:hidden snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition-all whitespace-nowrap
                            ${filter === cat.id 
                                ? `bg-${cat.color}-600 text-white border-${cat.color}-600 shadow-md` 
                                : `bg-white text-slate-600 border-slate-300 hover:bg-slate-50`}`}
                    >
                        <div className={`w-3 h-3 rounded-full ${filter === cat.id ? 'bg-white' : `bg-${cat.color}-500`}`}></div>
                        <span>{cat.name}</span>
                    </button>
                ))}
                <button onClick={onOpenSettings} className="snap-start flex items-center justify-center w-9 h-9 rounded-full border-2 border-dashed border-slate-400 text-slate-500 hover:border-violet-500 hover:text-violet-600 md:hidden flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
            </nav>
        )}

        {/* Categories Section Desktop */}
        <div className="hidden md:flex flex-col flex-1 w-full">
            <div className="flex items-center justify-center xl:justify-between mb-4 px-2 mt-4 border-t border-slate-100 pt-6">
                <h3 className="hidden xl:block text-xs font-extrabold text-slate-500 uppercase tracking-wider">หมวดหมู่งาน</h3>
                <button onClick={onOpenSettings} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-700 transition-colors" title="จัดการหมวดหมู่">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
            </div>
            <div className="space-y-1 mb-auto flex flex-col items-center xl:items-stretch">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            onChangeView('tasks');
                            setFilter(cat.id);
                        }}
                        title={cat.name}
                        className={`w-10 h-10 xl:w-full xl:h-auto flex items-center justify-center xl:justify-start gap-3 xl:px-4 xl:py-3 rounded-full xl:rounded-2xl text-sm font-medium transition-all
                            ${filter === cat.id && currentView === 'tasks' ? `bg-${cat.color}-100 text-${cat.color}-900 font-bold shadow-sm ring-1 ring-${cat.color}-200` : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        <div className={`w-3 h-3 rounded-full bg-${cat.color}-500 ${filter === cat.id && currentView === 'tasks' ? 'ring-2 ring-offset-1 ring-' + cat.color + '-300' : ''}`}></div>
                        <span className="truncate hidden xl:block">{cat.name}</span>
                        {filter === cat.id && currentView === 'tasks' && <svg className="w-4 h-4 ml-auto hidden xl:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                    </button>
                ))}
                {categories.length === 0 && (
                    <div onClick={onOpenSettings} className="w-10 h-10 xl:w-full xl:h-auto flex items-center justify-center xl:px-5 xl:py-6 border-2 border-dashed border-slate-300 rounded-full xl:rounded-2xl text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-colors group">
                        <span className="text-sm text-slate-500 group-hover:text-violet-600 font-bold hidden xl:block">+ เพิ่มหมวดหมู่ใหม่</span>
                        <span className="text-xl xl:hidden">+</span>
                    </div>
                )}
            </div>

            {/* User Profile Section at Bottom */}
            {userEmail && (
                <div className="mt-6 pt-6 border-t border-slate-100 w-full">
                    <div className="flex items-center justify-center xl:justify-start gap-3 p-0 xl:p-3 rounded-2xl xl:bg-slate-50 xl:border xl:border-slate-100 xl:hover:bg-white xl:hover:shadow-sm transition-all group">
                        {avatar ? (
                            <img src={avatar} alt="Profile" className="w-10 h-10 rounded-full bg-indigo-100 flex-shrink-0" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0 hidden xl:block">
                            <p className="text-sm font-bold text-slate-800 truncate">
                                หวัดดี, {displayName}
                            </p>
                            <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1 mt-0.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                ออกจากระบบ
                            </button>
                        </div>
                        {/* Mobile/Tablet Logout Button (Only visible on hover/tap in slim mode) */}
                        <div className="absolute left-14 bg-white shadow-lg p-2 rounded-xl hidden group-hover:md:flex xl:hidden border border-slate-100 z-50 whitespace-nowrap">
                             <button onClick={onLogout} className="text-red-500 font-bold text-xs flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                ออกจากระบบ
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;