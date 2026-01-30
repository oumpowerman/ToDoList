import React, { useState } from 'react';
import { Priority } from '../types';

interface FilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  priorityFilter: 'All' | Priority;
  setPriorityFilter: (val: 'All' | Priority) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onClear: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
    search, setSearch, priorityFilter, setPriorityFilter,
    startDate, setStartDate, endDate, setEndDate, onClear
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
    
  // Check if any filter (excluding search) is active
  const activeFilterCount = [
      priorityFilter !== 'All',
      !!startDate, 
      !!endDate
  ].filter(Boolean).length;

  return (
    <div className="mb-6 relative z-30">
        <div className="flex flex-col gap-3">
            
            {/* Top Row: Search Input & Toggle Button */}
            <div className="flex gap-3 items-stretch">
                {/* Search Input - Always Visible */}
                <div className="relative flex-grow group shadow-sm hover:shadow-md transition-shadow rounded-2xl">
                    <input 
                        type="text"
                        placeholder="🔍 ค้นหาชื่องาน, แท็ก..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 h-14 bg-white border-2 border-slate-100 rounded-2xl text-base text-slate-800 focus:outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-50 transition-all font-medium placeholder:text-slate-400"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Filter Toggle Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`relative w-14 h-14 flex-shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 active:scale-95 shadow-sm
                        ${isExpanded || activeFilterCount > 0
                            ? 'bg-indigo-100 border-indigo-200 text-indigo-600' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-500'}`}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    
                    {/* Badge */}
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pop border-2 border-white">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Collapsible Filter Panel */}
            <div className={`
                overflow-hidden transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) origin-top
                ${isExpanded ? 'max-h-[500px] opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95'}
            `}>
                <div className="bg-white/60 backdrop-blur-xl p-4 rounded-[1.5rem] border border-white shadow-sm flex flex-col md:flex-row gap-3">
                    
                    {/* Priority Filter */}
                    <div className="relative flex-1 min-w-[140px]">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 z-10">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        </div>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value as any)}
                            className="w-full pl-10 pr-8 py-3 bg-indigo-50/80 hover:bg-indigo-50 border border-indigo-100 rounded-2xl text-sm text-indigo-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold cursor-pointer appearance-none transition-all"
                        >
                            <option value="All">ทุกความสำคัญ</option>
                            <option value={Priority.HIGH}>🔥 ด่วนมาก</option>
                            <option value={Priority.MEDIUM}>⚡️ ปานกลาง</option>
                            <option value={Priority.LOW}>☕️ ไม่รีบ</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="flex gap-2 flex-grow-[2] min-w-[200px]">
                        <div className="relative flex-1 group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <input 
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-9 pr-2 py-3 bg-teal-50/80 hover:bg-teal-50 border border-teal-100 rounded-2xl text-xs sm:text-sm text-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-100 font-bold cursor-pointer transition-all placeholder:text-teal-400"
                                placeholder="เริ่ม"
                                style={{ colorScheme: 'light' }}
                            />
                            {!startDate && <span className="absolute left-10 top-1/2 -translate-y-1/2 text-teal-400 text-xs sm:text-sm font-bold pointer-events-none">เริ่ม</span>}
                        </div>

                        <div className="relative flex-1 group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <input 
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-9 pr-2 py-3 bg-rose-50/80 hover:bg-rose-50 border border-rose-100 rounded-2xl text-xs sm:text-sm text-rose-900 focus:outline-none focus:ring-4 focus:ring-rose-100 font-bold cursor-pointer transition-all"
                                placeholder="ถึง"
                                style={{ colorScheme: 'light' }}
                            />
                            {!endDate && <span className="absolute left-10 top-1/2 -translate-y-1/2 text-rose-400 text-xs sm:text-sm font-bold pointer-events-none">ถึง</span>}
                        </div>
                    </div>

                    {/* Clear Button (Inside expanded area) */}
                    {(activeFilterCount > 0 || search) && (
                        <button 
                            onClick={() => { onClear(); if(!search) setIsExpanded(false); }}
                            className="flex-shrink-0 px-4 py-3 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border border-slate-200"
                            title="ล้างตัวกรอง"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            <span className="text-xs sm:text-sm">ล้าง</span>
                        </button>
                    )}
                </div>
            </div>

        </div>
    </div>
  );
};

export default FilterBar;