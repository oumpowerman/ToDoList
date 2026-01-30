import React, { useState } from 'react';
import { Category } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onClose: () => void;
}

const COLORS = [
  { name: 'Blue', value: 'blue', bg: 'bg-blue-500' },
  { name: 'Green', value: 'green', bg: 'bg-green-500' },
  { name: 'Red', value: 'rose', bg: 'bg-rose-500' },
  { name: 'Purple', value: 'violet', bg: 'bg-violet-500' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-500' },
  { name: 'Teal', value: 'teal', bg: 'bg-teal-500' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-500' },
  { name: 'Gray', value: 'slate', bg: 'bg-slate-500' },
];

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory, onDeleteCategory, onClose }) => {
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: Category = {
      id: uuidv4(),
      name: newCatName.trim(),
      color: selectedColor
    };

    onAddCategory(newCategory);
    setNewCatName('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-pop">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">จัดการหมวดหมู่</h2>
            <p className="text-xs text-slate-500">สร้างห้องให้งานของคุณเป็นระเบียบ</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 no-scrollbar">
          {/* Add New */}
          <form onSubmit={handleAdd} className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">สร้างหมวดหมู่ใหม่</label>
            <div className="flex gap-2 mb-3">
               <input 
                 type="text" 
                 value={newCatName}
                 onChange={(e) => setNewCatName(e.target.value)}
                 placeholder="ชื่อธุรกิจ / โปรเจกต์..."
                 className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200 text-sm"
               />
               <button 
                 type="submit" 
                 disabled={!newCatName.trim()}
                 className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-700 disabled:opacity-50 transition-all"
               >
                 เพิ่ม
               </button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={`w-8 h-8 rounded-full ${c.bg} flex-shrink-0 transition-transform ${selectedColor === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-70 hover:opacity-100'}`}
                  title={c.name}
                />
              ))}
            </div>
          </form>

          {/* List */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">หมวดหมู่ที่มีอยู่ ({categories.length})</label>
            {categories.length === 0 ? (
                <p className="text-center text-slate-400 py-4 text-sm">ยังไม่มีหมวดหมู่เลยวัยรุ่น สร้างเลย!</p>
            ) : (
                categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-violet-100 hover:bg-violet-50/30 transition-colors group">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-${cat.color}-500 shadow-sm`}></div>
                        <span className="font-medium text-slate-700">{cat.name}</span>
                    </div>
                    <button 
                        onClick={() => onDeleteCategory(cat.id)}
                        className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="ลบหมวดหมู่"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;