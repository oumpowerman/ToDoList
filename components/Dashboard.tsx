import React, { useMemo } from 'react';
import { Task, TaskStatus, Priority } from '../types';

interface DashboardProps {
  tasks: Task[];
  nickname?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, nickname }) => {
  const userName = nickname || 'เธอ';

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const pending = total - completed;
    
    // Completion Rate
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    // Life Score Logic (0-100)
    const highPriorityTotal = tasks.filter(t => t.priority === Priority.HIGH).length;
    const highPriorityDone = tasks.filter(t => t.priority === Priority.HIGH && t.status === TaskStatus.DONE).length;
    const highPriorityRate = highPriorityTotal === 0 ? 100 : (highPriorityDone / highPriorityTotal) * 100;
    
    let score = Math.round((completionRate * 0.7) + (highPriorityRate * 0.3));
    if (total === 0) score = 100; // New user bonus

    // Grade & Message - Personalized!
    let grade = 'F';
    let message = `เริ่มจัดระเบียบชีวิตกันเถอะ ${userName}!`;
    let gradient = 'from-slate-400 to-slate-600';

    if (score >= 90) { grade = 'S'; message = `สุดยอด! ${userName} คือเทพเจ้าแห่งความโปรดักทีฟ ⚡️`; gradient = 'from-yellow-400 to-orange-500'; }
    else if (score >= 80) { grade = 'A'; message = `เยี่ยมมาก ${userName}! วินัยดีแบบนี้อนาคตไกล 🌟`; gradient = 'from-emerald-400 to-teal-500'; }
    else if (score >= 60) { grade = 'B'; message = `ใช้ได้เลยนะ ${userName}! เก็บงานค้างอีกนิดจะเป๊ะมาก 👍`; gradient = 'from-blue-400 to-indigo-500'; }
    else if (score >= 40) { grade = 'C'; message = `สู้หน่อย ${userName}! งานเริ่มกองเป็นภูเขาแล้วนะ 🐷`; gradient = 'from-orange-400 to-red-500'; }
    else { grade = 'D'; message = `วิกฤตแล้ว ${userName}! รีบเคลียร์งานด่วนก่อนไฟลนก้น 🔥`; gradient = 'from-red-500 to-rose-700'; }

    // Last 7 Days Activity
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0,0,0,0);
        return d;
    });

    const doneTasks = tasks.filter(t => t.status === TaskStatus.DONE);
    const activityData = last7Days.map(date => {
        const dateStr = date.toLocaleDateString('th-TH', { weekday: 'short' });
        const count = doneTasks.filter(t => {
            const doneLog = t.activities?.find(a => a.content.includes('Finished') || a.content.includes('เสร็จ'));
            const finishTime = doneLog ? doneLog.createdAt : t.createdAt; 
            const finishDate = new Date(finishTime);
            finishDate.setHours(0,0,0,0);
            return finishDate.getTime() === date.getTime();
        }).length;
        return { day: dateStr, count };
    });

    return {
        total, completed, pending, completionRate, 
        score, grade, message, gradient,
        activityData,
        highPriorityTotal, highPriorityDone
    };
  }, [tasks, userName]);

  if (tasks.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-pop">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-4xl">📊</div>
              <h2 className="text-xl font-bold text-slate-700">ยังไม่มีข้อมูลสถิติ</h2>
              <p className="text-slate-500">สร้างงานแรกของคุณ เพื่อให้เราช่วยวิเคราะห์นะ {userName}</p>
          </div>
      );
  }

  return (
    <div className="p-2 space-y-6 animate-slide-up pb-20 md:pb-0">
      
      {/* 1. Hero Score Card */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${stats.gradient} p-6 text-white shadow-xl`}>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                  <h2 className="text-lg font-medium opacity-90 mb-1">คะแนนความระเบียบ (Life Score)</h2>
                  <div className="text-5xl md:text-6xl font-extrabold tracking-tight flex items-center justify-center md:justify-start gap-2">
                      {stats.score}<span className="text-2xl opacity-60">/100</span>
                      <span className="bg-white/20 px-3 py-1 rounded-xl text-3xl md:text-4xl backdrop-blur-md border border-white/30 ml-2">
                          {stats.grade}
                      </span>
                  </div>
                  <p className="mt-3 font-medium bg-black/20 inline-block px-4 py-1.5 rounded-full text-sm">
                      {stats.message}
                  </p>
              </div>

              {/* Circular Progress */}
              <div className="relative w-28 h-28 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-black/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                      <path className="text-white drop-shadow-md transition-all duration-1000 ease-out" 
                            strokeDasharray={`${stats.completionRate}, 100`} 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                            fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-bold opacity-80">งานเสร็จ</span>
                      <span className="text-xl font-bold">{stats.completionRate}%</span>
                  </div>
              </div>
          </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-violet-200 transition-colors">
              <span className="text-3xl mb-2">📝</span>
              <span className="text-xs text-slate-400 uppercase font-bold">งานทั้งหมด</span>
              <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-green-200 transition-colors">
              <span className="text-3xl mb-2">✅</span>
              <span className="text-xs text-slate-400 uppercase font-bold">เสร็จแล้ว</span>
              <span className="text-2xl font-bold text-green-600">{stats.completed}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-orange-200 transition-colors">
              <span className="text-3xl mb-2">⏳</span>
              <span className="text-xs text-slate-400 uppercase font-bold">ค้างคา</span>
              <span className="text-2xl font-bold text-orange-500">{stats.pending}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-red-200 transition-colors">
              <span className="text-3xl mb-2">🔥</span>
              <span className="text-xs text-slate-400 uppercase font-bold">งานด่วนที่จบ</span>
              <span className="text-2xl font-bold text-red-500">{stats.highPriorityDone}/{stats.highPriorityTotal}</span>
          </div>
      </div>

      {/* 3. Weekly Activity Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg text-xs">📅</span>
                  ผลงานย้อนหลัง 7 วัน
              </h3>
              <span className="text-xs text-slate-400">จำนวนงานที่เสร็จ</span>
          </div>
          
          <div className="flex items-end justify-between gap-2 h-32">
              {stats.activityData.map((item, idx) => {
                  const maxH = Math.max(...stats.activityData.map(d => d.count), 1); // Avoid div by zero
                  const heightPerc = (item.count / maxH) * 100;
                  
                  return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="w-full relative flex items-end justify-center h-full bg-slate-50 rounded-xl overflow-hidden">
                              {item.count > 0 && (
                                <div 
                                    className="w-full bg-violet-500 hover:bg-violet-600 transition-all duration-500 rounded-t-xl relative group-hover:scale-110"
                                    style={{ height: `${heightPerc}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.count}
                                    </div>
                                </div>
                              )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{item.day}</span>
                      </div>
                  );
              })}
          </div>
      </div>

    </div>
  );
};

export default Dashboard;