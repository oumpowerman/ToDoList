import React from 'react';

// Standard Unicode Emojis (High Visibility)
const MOODS = [
    { icon: '😆', label: 'สนุก' },
    { icon: '😍', label: 'เลิฟ' },
    { icon: '😊', label: 'แฮปปี้' },
    { icon: '😴', label: 'ง่วง' },
    { icon: '😤', label: 'โมโห' },
    { icon: '😭', label: 'เศร้า' },
    { icon: '🤒', label: 'ป่วย' },
    { icon: '🤯', label: 'บึ้ม' },
    { icon: '😎', label: 'ชิล' }
];

interface DiaryMoodPickerProps {
    selectedMood: string;
    onSelect: (mood: string) => void;
    isEditable: boolean;
}

const DiaryMoodPicker: React.FC<DiaryMoodPickerProps> = ({ selectedMood, onSelect, isEditable }) => {
    return (
        <div className="grid grid-cols-3 gap-2">
            {MOODS.map(m => (
                <button
                    key={m.icon}
                    onClick={() => isEditable && onSelect(m.icon)}
                    disabled={!isEditable}
                    title={m.label}
                    className={`aspect-square rounded-xl transition-all flex items-center justify-center text-xl sm:text-2xl
                        ${selectedMood === m.icon 
                            ? 'bg-amber-100 scale-110 shadow-sm ring-2 ring-amber-200 z-10' 
                            : 'bg-slate-50 hover:bg-slate-100 hover:scale-105'}`}
                >
                    <span className={`filter ${selectedMood !== m.icon ? 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100' : ''} transition-all`}>
                        {m.icon}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default DiaryMoodPicker;