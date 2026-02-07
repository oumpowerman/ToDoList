import React, { useMemo } from 'react';
import { Task, TaskStatus, Priority, Category } from '../types';

interface TaskItemProps {
  task: Task;
  category?: Category;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}

// --- Helper Components for clean render ---

const TaskActions: React.FC<{ task: Task, onDelete: (id: string) => void }> = ({ task, onDelete }) => {
    const addToGoogleCalendar = (e: React.MouseEvent) => {
        e.stopPropagation();
        const title = encodeURIComponent(task.title);
        const details = encodeURIComponent(
            `สร้างโดย SmartTask AI\n${task.description ? `รายละเอียด: ${task.description}\n` : ''}\nสิ่งที่ต้องทำ:\n${task.subtasks.map(s => `- ${s.title} [${s.completed ? 'x' : ' '}]`).join('\n')}`
        );
        let dates = '';
        if (task.dueDate) {
            const startDate = new Date(task.dueDate);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 
            const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
            dates = `&dates=${format(startDate)}/${format(endDate)}`;
        }
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}${dates}`;
        window.open(url, '_blank');
    };

    return (
        <div className="flex items-center justify-end gap-2 px-6 pb-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 translate-y-0 relative z-10">
           {task.dueDate && (
             <button
                onClick={addToGoogleCalendar}
                className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                title="เพิ่มลง Google Calendar"
             >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                ลงปฏิทิน
             </button>
           )}

           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
             className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 px-3 py-1.5 rounded-xl transition-all hover:scale-105"
             title="ลบ"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>
             ลบ
           </button>
      </div>
    );
};

const TaskBadges: React.FC<{ task: Task, category?: Category, isDone: boolean }> = ({ task, category, isDone }) => {
    const priorityStyles = {
        [Priority.LOW]: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        [Priority.MEDIUM]: 'bg-amber-100 text-amber-800 border-amber-300',
        [Priority.HIGH]: 'bg-rose-100 text-rose-800 border-rose-300',
    };
    const priorityLabel = {
        [Priority.LOW]: 'ไม่รีบ',
        [Priority.MEDIUM]: 'กลางๆ',
        [Priority.HIGH]: 'ด่วนมาก',
    };

    const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleString('th-TH', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    }) : null;

    return (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
             <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-md border font-bold ${priorityStyles[task.priority]}`}>
               {priorityLabel[task.priority]}
             </span>

             {category && (
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 bg-${category.color}-50 text-${category.color}-800 border-${category.color}-200`}>
                     <div className={`w-1.5 h-1.5 rounded-full bg-${category.color}-600`}></div>
                     {category.name}
                 </span>
             )}
             
             {formattedDate && (
                 <span className={`text-[10px] font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${isDone ? 'text-slate-500 bg-slate-100 border-slate-300' : 'text-orange-800 bg-orange-50 border-orange-200'}`} title="เวลานัดหมาย">
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     {formattedDate}
                 </span>
             )}

             {(task.links?.length > 0 || task.activities?.length > 0) && (
                <div className="flex items-center gap-2 ml-1 pl-2 border-l-2 border-slate-200">
                     {task.links?.length > 0 && <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">🔗 {task.links.length}</span>}
                     {task.activities?.length > 0 && <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">💬 {task.activities.length}</span>}
                </div>
             )}

             {task.subtasks.length > 0 && (
                <span className={`text-[10px] font-bold flex items-center gap-1.5 ml-auto ${isDone ? 'text-slate-500' : 'text-violet-700'}`}>
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                   </svg>
                   {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </span>
             )}
        </div>
    );
};

// --- Main Component ---

const TaskItem: React.FC<TaskItemProps> = ({ task, category, onUpdate, onDelete, onClick }) => {
  const isDone = task.status === TaskStatus.DONE;

  const { daysOld, isStale, isVeryStale } = useMemo(() => {
      const createdDate = new Date(task.createdAt);
      createdDate.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(todayDate.getTime() - createdDate.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return {
          daysOld: days,
          isStale: days > 0 && !isDone,
          isVeryStale: days >= 3 && !isDone
      };
  }, [task.createdAt, isDone]);

  const toggleStatus = () => {
    const newStatus = isDone ? TaskStatus.TODO : TaskStatus.DONE;
    onUpdate({ 
        ...task, 
        status: newStatus,
        activities: [...(task.activities || []), { id: Date.now().toString(), content: newStatus === TaskStatus.DONE ? 'Finished task' : 'Reopened task', type: 'system', createdAt: Date.now()}]
    });
  };

  return (
    <div className={`animate-pop group transition-all duration-300 bg-white border-2 rounded-2xl shadow-sm hover:shadow-lg mb-3 overflow-visible relative
      ${isDone ? 'border-slate-200 opacity-60 bg-slate-50' : isVeryStale ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-200 hover:border-violet-300 hover:-translate-y-1'}`}>
      
      {/* Age Badge */}
      {isStale && (
         <div className={`absolute -top-2 -right-1 px-3 py-1 rounded-full text-[10px] font-black text-white z-20 shadow-md flex items-center gap-1 border-2 border-white transform rotate-3
            ${isVeryStale ? 'bg-red-500 animate-bounce-short' : 'bg-orange-400'}`}>
             <span>⏰</span>
             <span>ค้างมา {daysOld} วัน</span>
         </div>
      )}

      {/* Main Task Row */}
      <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={onClick}>
        {/* Checkbox - BIGGER for Senior Users */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleStatus(); }}
          className={`mt-1 flex-shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 shadow-sm
            ${isDone ? 'bg-green-500 border-green-500 rotate-3' : isVeryStale ? 'border-red-300 bg-red-50 hover:border-red-400' : 'border-slate-300 hover:border-violet-500 bg-white'}`}
        >
          {isDone && (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-grow min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2 pr-1"> 
            <h3 className={`font-bold text-lg leading-snug transition-all ${isDone ? 'text-slate-400 line-through decoration-slate-300 decoration-2' : 'text-slate-900'}`}>
              {task.title}
            </h3>
          </div>

          {task.description && !isDone && (
              <p className="text-sm text-slate-600 mt-1.5 font-medium line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {task.description}
              </p>
          )}
          
          <TaskBadges task={task} category={category} isDone={isDone} />
        </div>
      </div>

      <TaskActions task={task} onDelete={onDelete} />
    </div>
  );
};

export default TaskItem;