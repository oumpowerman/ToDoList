import React from 'react';

interface DiaryDateNavProps {
    date: Date;
    onChangeDate: (days: number) => void;
    isEditable: boolean;
}

const DiaryDateNav: React.FC<DiaryDateNavProps> = ({ date, onChangeDate, isEditable }) => {
    const isToday = date.toDateString() === new Date().toDateString();

    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500"></div>
            
            <div className="flex justify-between items-center">
                <button onClick={() => onChangeDate(-1)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <div className="flex flex-col items-center justify-center min-w-[140px]">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                    <div className="text-5xl font-black text-slate-800 leading-none mb-1 tracking-tighter">
                        {date.getDate()}
                    </div>
                    <span className="text-sm font-bold text-violet-600 bg-violet-50 px-3 py-0.5 rounded-full">
                        {date.toLocaleDateString('th-TH', { weekday: 'long' })}
                    </span>
                </div>

                <button 
                    onClick={() => onChangeDate(1)} 
                    disabled={isToday}
                    className={`p-3 rounded-2xl transition-colors ${isToday ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>

            {!isEditable && (
                <div className="mt-3 bg-slate-100 text-slate-500 text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 opacity-80">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span>อ่านได้อย่างเดียว</span>
                </div>
            )}
        </div>
    );
};

export default DiaryDateNav;