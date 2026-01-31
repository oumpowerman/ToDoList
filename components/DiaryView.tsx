import React, { useState } from 'react';
import { useDiary } from '../hooks/useDiary';
import DiaryDateNav from './diary/DiaryDateNav';
import DiaryMoodPicker from './diary/DiaryMoodPicker';
import DiaryThemePicker, { PaperTheme } from './diary/DiaryThemePicker';
import DiaryPaper from './diary/DiaryPaper';
import DiaryGallery from './diary/DiaryGallery';

const DiaryView = ({ session }: { session: any }) => {
  const {
    currentDate, changeDate,
    title, setTitle,
    content, setContent,
    mood, setMood,
    images, setImages,
    loading, saving, isEditable,
    saveDiary
  } = useDiary(session);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [paperTheme, setPaperTheme] = useState<PaperTheme>('classic');
  
  // Accordion State: null = all closed by default
  const [activeAccordion, setActiveAccordion] = useState<'mood' | 'theme' | null>(null);

  const toggleAccordion = (section: 'mood' | 'theme') => {
      setActiveAccordion(prev => prev === section ? null : section);
  };

  const handleChangeDate = (days: number) => {
      setDirection(days > 0 ? 'next' : 'prev');
      changeDate(days);
  };

  const handleAddImage = (url: string) => setImages([...images, url]);
  const handleRemoveImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-1 md:p-0 transition-all duration-500">
      
      {/* Left Column: Controls */}
      <div className={`
          flex flex-col gap-3 transition-all duration-500 ease-in-out overflow-y-auto no-scrollbar
          ${isFocusMode ? 'w-0 opacity-0 -translate-x-full absolute' : 'w-full md:w-[280px] opacity-100 translate-x-0 flex-shrink-0'}
      `}>
        <DiaryDateNav date={currentDate} onChangeDate={handleChangeDate} isEditable={isEditable} />
        
        {/* Accordion: Mood */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
            <button 
                onClick={() => toggleAccordion('mood')}
                className={`w-full flex items-center justify-between p-4 text-left font-bold text-sm transition-colors ${activeAccordion === 'mood' ? 'bg-slate-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <span className="flex items-center gap-2">
                    <span className="text-lg">{mood}</span>
                    <span>อารมณ์วันนี้</span>
                </span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeAccordion === 'mood' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeAccordion === 'mood' ? 'max-h-[300px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0'}`}>
                 <div className="p-3">
                    <DiaryMoodPicker selectedMood={mood} onSelect={setMood} isEditable={isEditable} />
                 </div>
            </div>
        </div>

        {/* Accordion: Theme */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
            <button 
                onClick={() => toggleAccordion('theme')}
                className={`w-full flex items-center justify-between p-4 text-left font-bold text-sm transition-colors ${activeAccordion === 'theme' ? 'bg-slate-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <span className="flex items-center gap-2">
                    <span>🎨</span>
                    <span>โทนสมุด</span>
                </span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeAccordion === 'theme' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeAccordion === 'theme' ? 'max-h-[300px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0'}`}>
                 <div className="p-3">
                    <DiaryThemePicker selectedTheme={paperTheme} onSelect={setPaperTheme} />
                 </div>
            </div>
        </div>

        {/* Save Button - Push to bottom on desktop, sticking naturally */}
        <div className="mt-auto pt-4">
             <button 
                onClick={saveDiary}
                disabled={!isEditable || saving}
                className={`hidden md:flex w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all items-center justify-center gap-2
                    ${isEditable 
                        ? 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-95' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
            >
                {saving ? 'กำลังบันทึก...' : isEditable ? 'บันทึกไดอารี่' : 'แก้ไขไม่ได้แล้ว'}
            </button>
        </div>
      </div>

      {/* Right Column: Paper & Content */}
      <div 
        key={currentDate.toISOString()}
        className={`flex-1 flex flex-col transition-all duration-500 min-w-0 ${isFocusMode ? 'w-full' : ''}`}
        style={{
            animation: direction === 'next' 
                ? 'turnPageNext 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' 
                : 'turnPagePrev 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            transformOrigin: direction === 'next' ? 'left center' : 'right center'
        }}
      >
          <DiaryPaper 
            title={title}
            setTitle={setTitle}
            content={content} 
            setContent={setContent} 
            mood={mood} 
            loading={loading} 
            isEditable={isEditable}
            isFocusMode={isFocusMode}
            toggleFocusMode={() => setIsFocusMode(!isFocusMode)}
            theme={paperTheme}
          >
            <DiaryGallery 
                images={images} 
                onAddImage={handleAddImage} 
                onRemoveImage={handleRemoveImage} 
                isEditable={isEditable} 
            />
          </DiaryPaper>
      </div>
      
      {/* Mobile Save Button */}
      {!isFocusMode && (
        <div className="md:hidden sticky bottom-4 z-40">
            <button 
                onClick={saveDiary}
                disabled={!isEditable || saving}
                className={`w-full py-3 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2 border-2 border-white
                    ${isEditable 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
                {saving ? 'กำลังบันทึก...' : isEditable ? 'บันทึกไดอารี่' : 'แก้ไขไม่ได้แล้ว'}
            </button>
        </div>
      )}
    </div>
  );
};

export default DiaryView;