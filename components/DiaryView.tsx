import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, uploadFile } from '../services/supabaseClient';
import { uploadToDrive } from '../services/googleDriveService';
import { DiaryEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';
import RichTextEditor from './RichTextEditor';
import PhotoAlbum from './PhotoAlbum';

const MOODS = ['😊', '😴', '😤', '😭', '🥰', '🤔', '🤒', '🥳', '😎'];

// Paper Configurations
const PAPERS: Record<string, { bg: string, overlay: string, name: string }> = {
    'lined': { 
        name: 'สมุดมีเส้น',
        bg: 'bg-amber-50', 
        overlay: 'linear-gradient(#9ca3af 1px, transparent 1px)' 
    },
    'grid': { 
        name: 'ตารางกราฟ',
        bg: 'bg-white', 
        overlay: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)' 
    },
    'dot': { 
        name: 'จุดไข่ปลา',
        bg: 'bg-slate-50', 
        overlay: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)' 
    },
    'plain': { 
        name: 'กระดาษเปล่า',
        bg: 'bg-white', 
        overlay: 'none' 
    },
    'pink': { 
        name: 'ชมพูพาสเทล',
        bg: 'bg-pink-50', 
        overlay: 'linear-gradient(#f9a8d4 1px, transparent 1px)' 
    },
    'dark': { 
        name: 'Dark Mode',
        bg: 'bg-slate-800', 
        overlay: 'linear-gradient(#475569 1px, transparent 1px)' 
    }
};

interface DiaryViewProps {
    session: any;
    onClose?: () => void;
    isFocusMode?: boolean;
    onToggleFocus?: () => void;
}

const DiaryView: React.FC<DiaryViewProps> = ({ session, onClose, isFocusMode = false, onToggleFocus }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('😊');
  const [images, setImages] = useState<string[]>([]);
  const [paperPattern, setPaperPattern] = useState<string>('lined'); // Default
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Media Upload State
  const [uploadingImg, setUploadingImg] = useState(false);
  const [useGoogleDrive, setUseGoogleDrive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  // UI State
  const [showPaperPicker, setShowPaperPicker] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showControls, setShowControls] = useState(true); // Control visibility of left panel
  
  // Animation & Touch State
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Touch Gestures Refs
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // Helper: Normalize date to YYYY-MM-DD
  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

  // Helper: Check if editable (Difference <= 2 days)
  const isEditable = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(currentDate);
    target.setHours(0, 0, 0, 0);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    return target >= twoDaysAgo && target <= today;
  }, [currentDate]);

  const fetchEntry = useCallback(async (date: Date) => {
    if (!session?.user) return;
    setLoading(true);
    const dateKey = formatDateKey(date);

    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('date', dateKey)
      .single();

    if (error && error.code !== 'PGRST116') console.error('Error fetching diary:', error);

    const diaryData = Array.isArray(data) ? data[0] : data;

    if (diaryData) {
       setEntry(diaryData);
       setContent(diaryData.content);
       setSelectedMood(diaryData.mood || '😊');
       setImages(diaryData.images || []);
       setPaperPattern(diaryData.paper_pattern || 'lined');
    } else {
       setEntry(null);
       setContent('');
       setSelectedMood('😊');
       setImages([]);
       setPaperPattern('lined');
    }
    setLoading(false);
  }, [session]);

  // Initial Load
  useEffect(() => {
    fetchEntry(currentDate);
  }, []); // Only on mount

  // Auto-hide controls when entering focus mode (optional UX)
  useEffect(() => {
     if (isFocusMode && window.innerWidth < 768) {
         setShowControls(false);
     }
  }, [isFocusMode]);

  // --- Handlers ---

  const handleSave = async () => {
    if (!session?.user) return;
    setSaving(true);
    const dateKey = formatDateKey(currentDate);
    
    const diaryData = {
        id: entry?.id || uuidv4(),
        user_id: session.user.id,
        date: dateKey,
        content,
        mood: selectedMood,
        images,
        paper_pattern: paperPattern,
        updated_at: Date.now(),
        created_at: entry?.created_at || Date.now()
    };

    const { error } = await supabase.from('diaries').upsert(diaryData);

    if (error) {
        console.error("Save failed", error);
        alert("บันทึกไม่สำเร็จ T_T");
    } else {
        setEntry(diaryData as DiaryEntry);
    }
    setSaving(false);
  };

  const changeDate = (days: number) => {
      if (isAnimating) return;
      const isFuture = formatDateKey(currentDate) === formatDateKey(new Date()) && days > 0;
      if (isFuture) return; 

      const direction = days > 0 ? 'next' : 'prev';
      setFlipDirection(direction);
      setIsAnimating(true);

      setTimeout(async () => {
          const newDate = new Date(currentDate);
          newDate.setDate(newDate.getDate() + days);
          setCurrentDate(newDate);
          await fetchEntry(newDate);
          
          setTimeout(() => {
             setIsAnimating(false);
             setFlipDirection(null);
          }, 300);
      }, 300);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setUploadingImg(true);
        try {
            let url: string | null = null;
            if (useGoogleDrive) {
                url = await uploadToDrive(file);
            } else {
                url = await uploadFile(file);
            }

            if (url) {
                setImages(prev => [...prev, url!]);
            } else {
                alert('อัปโหลดรูปไม่ผ่าน (เช็ค Client ID)');
            }
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการอัปโหลด');
        } finally {
            setUploadingImg(false);
            e.target.value = '';
        }
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    let finalUrl = urlInput.trim();
    const driveMatch = finalUrl.match(/\/file\/d\/(.+?)\//);
    if (driveMatch && driveMatch[1]) {
        finalUrl = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }
    setImages(prev => [...prev, finalUrl]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  // --- Swipe Handlers ---
  const onTouchStart = (e: React.TouchEvent) => {
      touchEnd.current = null;
      touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
      touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
      if (!touchStart.current || !touchEnd.current) return;
      const distance = touchStart.current - touchEnd.current;
      if (distance > minSwipeDistance) changeDate(1);
      else if (distance < -minSwipeDistance) changeDate(-1);
  };

  const getHeaderFromHtml = (html: string) => {
      if (!html) return 'บันทึกประจำวัน';
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      const fullText = tmp.textContent || tmp.innerText || '';
      let firstLine = fullText.split('\n')[0].trim();
      if (firstLine.length > 25) firstLine = firstLine.substring(0, 25) + '...';
      return firstLine || 'บันทึกประจำวัน';
  };

  const currentPaperStyle = PAPERS[paperPattern] || PAPERS['lined'];

  return (
    <div 
        className={`h-full flex flex-col md:flex-row gap-0 md:gap-6 p-2 perspective-container transition-all duration-300
        ${isFocusMode ? 'p-2 md:p-6' : 'md:p-0 relative'}
    `}>
      {/* 1. Controls Column (Left) - COLLAPSIBLE */}
      <div 
        className={`flex flex-col gap-4 relative z-20 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] origin-left
            ${showControls 
                ? (isFocusMode ? 'w-full md:w-[280px] opacity-100' : 'w-full md:w-1/4 opacity-100') 
                : 'w-0 h-0 md:h-auto overflow-hidden opacity-0 md:w-0 p-0 m-0 border-0'
            }
        `}
      >
          {/* Calendar Card */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 text-center flex flex-row md:flex-col items-center justify-between md:justify-center whitespace-nowrap">
              <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <div className="flex flex-col animate-pop" key={currentDate.toString()}>
                  <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">
                      {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-3xl md:text-4xl font-black text-slate-800">
                      {currentDate.getDate()}
                  </span>
                  <span className="text-xs md:text-sm font-medium text-slate-500">
                      {currentDate.toLocaleDateString('th-TH', { weekday: 'long' })}
                  </span>
              </div>
              
              <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors" disabled={formatDateKey(currentDate) === formatDateKey(new Date())}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
          </div>

          {/* Controls Grid: Mood, Paper, and Media */}
          <div className="flex flex-col gap-3">
             <div className="grid grid-cols-2 gap-3">
                {/* Mood Button */}
                <div className="relative">
                    <button 
                        onClick={() => isEditable && setShowMoodPicker(!showMoodPicker)}
                        disabled={!isEditable}
                        className="w-full bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1 hover:border-violet-200 transition-all h-24 active:scale-95 whitespace-nowrap"
                    >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">อารมณ์</span>
                        <span className="text-4xl animate-bounce-short">{selectedMood}</span>
                    </button>

                    {showMoodPicker && (
                        <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMoodPicker(false)}></div>
                        <div className="absolute top-full left-0 mt-2 w-[200px] bg-white p-3 rounded-2xl shadow-xl border border-slate-100 z-50 animate-pop grid grid-cols-3 gap-2">
                            {MOODS.map(m => (
                                <button key={m} onClick={() => { setSelectedMood(m); setShowMoodPicker(false); }} className="text-2xl p-2 hover:bg-slate-50 rounded-xl transition-all hover:scale-110">{m}</button>
                            ))}
                        </div>
                        </>
                    )}
                </div>

                {/* Paper Button */}
                <div className="relative">
                    <button 
                        onClick={() => isEditable && setShowPaperPicker(!showPaperPicker)}
                        disabled={!isEditable}
                        className={`w-full bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-violet-200 transition-all h-24 active:scale-95 whitespace-nowrap
                            ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">กระดาษ</span>
                        <div className={`w-12 h-8 rounded-lg shadow-inner border border-slate-100 ${PAPERS[paperPattern]?.bg || 'bg-white'}`} 
                            style={{ backgroundImage: PAPERS[paperPattern]?.overlay, backgroundSize: '10px 10px' }}></div>
                    </button>

                    {showPaperPicker && (
                        <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowPaperPicker(false)}></div>
                        <div className="absolute top-full right-0 md:left-0 mt-2 w-48 bg-white p-2 rounded-2xl shadow-xl border border-slate-100 z-50 animate-pop grid grid-cols-1 gap-1">
                            {Object.entries(PAPERS).map(([key, style]) => (
                                <button key={key} onClick={() => { setPaperPattern(key); setShowPaperPicker(false); }} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl text-left">
                                    <div className={`w-8 h-8 rounded border ${style.bg}`} style={{backgroundImage: style.overlay}}></div>
                                    <span className="text-xs font-bold text-slate-600">{style.name}</span>
                                </button>
                            ))}
                        </div>
                        </>
                    )}
                </div>
             </div>

             {/* Media Controls (New Location - Side Bar) */}
             <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col gap-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">เพิ่มสื่อ</span>
                 <div className="grid grid-cols-2 gap-2">
                     <label className={`cursor-pointer bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 py-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${uploadingImg || !isEditable ? 'opacity-50 pointer-events-none' : ''}`}>
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         {uploadingImg ? '...' : 'รูปภาพ'}
                         <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg || !isEditable} />
                     </label>
                     <button 
                         onClick={() => setShowUrlInput(true)}
                         disabled={!isEditable}
                         className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-600 py-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                     >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                         ลิ้งก์
                     </button>
                 </div>
                 
                 {/* Drive Switch */}
                 <div 
                    onClick={() => setUseGoogleDrive(!useGoogleDrive)}
                    className="flex items-center justify-between px-2 py-1 cursor-pointer group"
                >
                    <span className="text-[10px] text-slate-400 font-bold group-hover:text-slate-600">Google Drive</span>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${useGoogleDrive ? 'bg-green-500' : 'bg-slate-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${useGoogleDrive ? 'translate-x-4' : ''}`}></div>
                    </div>
                 </div>

                 {/* URL Input Popup (Inline) */}
                 {showUrlInput && (
                    <div className="absolute left-0 right-0 bottom-full mb-2 bg-white p-2 rounded-xl shadow-xl border border-slate-200 z-50 animate-pop mx-2">
                        <form onSubmit={handleAddUrl} className="flex flex-col gap-2">
                            <input 
                                type="text" 
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="https://..."
                                className="text-sm px-3 py-2 bg-slate-50 rounded-lg outline-none text-slate-600 border border-slate-200 focus:border-blue-300"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-blue-500 text-white px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600">เพิ่ม</button>
                                <button type="button" onClick={() => setShowUrlInput(false)} className="flex-1 bg-slate-100 text-slate-500 px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200">ยกเลิก</button>
                            </div>
                        </form>
                    </div>
                 )}
             </div>
          </div>
          
          {/* Save Button (Desktop) */}
          <button 
             onClick={handleSave}
             disabled={!isEditable || saving}
             className={`hidden md:flex w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all items-center justify-center gap-2 whitespace-nowrap
                ${isEditable 
                    ? 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-95' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
          >
             {saving ? 'กำลังบันทึก...' : isEditable ? 'บันทึกไดอารี่' : 'แก้ไขไม่ได้แล้ว'}
          </button>
          
          {/* Exit Fullscreen Button */}
          {isFocusMode && onToggleFocus && (
               <button 
                onClick={onToggleFocus}
                className="hidden md:flex w-full py-3 rounded-2xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 font-bold transition-all items-center justify-center gap-2 whitespace-nowrap"
               >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   ออก
               </button>
          )}
      </div>

      {/* 2. Main Diary Content (The Notebook Page) */}
      <div 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`flex-1 rounded-[2rem] shadow-xl border border-slate-200 relative overflow-hidden flex flex-col min-h-[70vh] transition-colors duration-500
        page-content ${isAnimating ? (flipDirection === 'next' ? 'page-turning-next' : 'page-turning-prev') : ''}`}
      >
          {/* === FIXED TOP AREA (Toolbar & Header) === */}
          <div className={`flex-shrink-0 relative z-30 transition-all duration-500 ${!showControls ? 'md:ml-0' : 'md:ml-12'} ${currentPaperStyle.bg} rounded-t-[2rem]`}>
                
                {/* Toolbar */}
                <div className="flex justify-between items-center mb-2 z-50 pt-6 px-6 md:px-12">
                    {/* Collapse/Expand Sidebar */}
                    <button
                        onClick={() => setShowControls(!showControls)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all group flex items-center gap-2"
                        title={showControls ? "ซ่อนแผงควบคุม" : "แสดงแผงควบคุม"}
                    >
                        {showControls ? (
                            <svg className="w-6 h-6 transform transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        ) : (
                            <svg className="w-6 h-6 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        )}
                        {!showControls && <span className="text-xs font-bold text-slate-500 hidden md:inline animate-pop">เครื่องมือ</span>}
                    </button>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1 md:gap-2">
                        {onToggleFocus && (
                            <button
                                onClick={onToggleFocus}
                                className="hidden md:flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                title={isFocusMode ? "ย่อขนาด" : "ขยายเต็มจอเพื่อโฟกัส"}
                            >
                                {isFocusMode ? (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                )}
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="ปิดสมุด (กลับหน้าหลัก)"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Header (Title & Mood) - Increased side padding */}
                <div className={`flex justify-between items-end pb-4 border-b-2 ${paperPattern === 'dark' ? 'border-slate-600' : 'border-amber-200'} mx-6 md:mx-12`}>
                    <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                        <span className="text-2xl md:text-3xl duk-dik cursor-default animate-wiggle" style={{ animationDuration: '3s' }}>📒</span>
                        <h2 className={`text-xl md:text-3xl font-bold truncate ${paperPattern === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {getHeaderFromHtml(content)}
                        </h2>
                    </div>
                    <span className="text-amber-700 font-handwriting text-2xl animate-bounce-short">{selectedMood}</span>
                </div>
          </div>

          {/* === SCROLLABLE CONTENT AREA === */}
          <div className={`flex-1 overflow-y-auto no-scrollbar relative z-10 transition-all duration-500 ${!showControls ? 'md:ml-0' : 'md:ml-12'}`}>
                
                {/* Content Container with Background - Padding Applied Inside */}
                <div className={`min-h-full ${currentPaperStyle.bg} relative flex flex-col`}
                     style={{ 
                        backgroundImage: currentPaperStyle.overlay, 
                        backgroundSize: (paperPattern === 'grid' || paperPattern === 'dot') ? '20px 20px' : '100% 2rem',
                    }}>
                    
                    {/* Content Wrapper with Padding - Ensures text isn't too close to edge */}
                    <div className="flex-1 px-8 py-8 md:px-20 md:py-12">
                        {/* Editor Zone */}
                        <div className={`relative z-10 ${paperPattern === 'dark' ? 'text-slate-200' : ''} min-h-[500px]`}>
                            {loading ? (
                                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400"></div></div>
                            ) : (
                                <RichTextEditor 
                                    content={content} 
                                    onChange={setContent} 
                                    isEditable={isEditable}
                                    placeholder={isEditable ? "วันนี้เป็นไงบ้าง? เขียนเล่าให้ฟังหน่อย..." : "ว่างเปล่า..."}
                                />
                            )}
                        </div>

                        {/* Photo Scrapbook Section */}
                        <div className="relative z-10 mt-8">
                            <PhotoAlbum images={images} setImages={setImages} isEditable={isEditable} />
                        </div>
                    </div>
                </div>
          </div>
          
          {/* Binder Rings Decor */}
          <div className="hidden md:flex flex-col gap-8 absolute left-3 top-40 bottom-10 z-20 pointer-events-none transition-opacity duration-300" style={{ opacity: showControls ? 1 : 0 }}>
              {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-4 h-4 rounded-full bg-slate-300 shadow-inner ring-4 ring-white"></div>
              ))}
          </div>

      </div>
      
      {/* Mobile Save Button */}
      <div className="md:hidden sticky bottom-4 z-40">
        <button 
             onClick={handleSave}
             disabled={!isEditable || saving}
             className={`w-full py-3 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2 border-2 border-white
                ${isEditable 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
             {saving ? 'กำลังบันทึก...' : isEditable ? 'บันทึกไดอารี่' : 'แก้ไขไม่ได้แล้ว'}
        </button>
      </div>
    </div>
  );
};

export default DiaryView;