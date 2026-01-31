import React, { useState } from 'react';
import { uploadFile } from '../../services/supabaseClient';
import { uploadToDrive } from '../../services/googleDriveService';

interface DiaryGalleryProps {
    images: string[];
    onAddImage: (url: string) => void;
    onRemoveImage: (index: number) => void;
    isEditable: boolean;
}

const DiaryGallery: React.FC<DiaryGalleryProps> = ({ images, onAddImage, onRemoveImage, isEditable }) => {
    const [uploadingImg, setUploadingImg] = useState(false);
    const [useGoogleDrive, setUseGoogleDrive] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');

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

                if (url) onAddImage(url);
                else alert('อัปโหลดรูปไม่ผ่านง่ะ ลองเช็ค Client ID หรือลองใหม่นะ');
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
        onAddImage(finalUrl);
        setUrlInput('');
        setShowUrlInput(false);
    };

    return (
        <div className="mt-8 ml-0 md:ml-12 relative z-10">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">ความทรงจำ ({images.length})</h3>

                {isEditable && !showUrlInput && (
                    <div className="flex gap-2 items-center">
                        <div
                            onClick={() => setUseGoogleDrive(!useGoogleDrive)}
                            className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 text-xs font-bold
                                ${useGoogleDrive ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                            title={useGoogleDrive ? "จะเก็บรูปใน Google Drive ของคุณ" : "จะเก็บรูปในแอพ (Supabase Storage)"}
                        >
                            {useGoogleDrive ? (
                                <>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.46 9.63l-4.75-8.23H5.29l4.75 8.23h9.42zM12.04 14.18L7.29 5.95 2.54 14.18h9.5zm2.74-7.23L10.03 15.3l2.38 4.12h9.5l-7.13-12.47z" /></svg>
                                    <span>ใช้ Drive ส่วนตัว</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                                    <span>ใช้พื้นที่แอพ</span>
                                </>
                            )}
                        </div>

                        <label className={`cursor-pointer bg-white border-2 border-dashed border-slate-300 hover:border-amber-400 text-slate-400 hover:text-amber-500 px-3 py-1 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${uploadingImg ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploadingImg ? <span className="animate-spin">⏳</span> : <span>+ อัปโหลดรูป</span>}
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
                        </label>

                        <button
                            onClick={() => setShowUrlInput(true)}
                            className="bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-400 hover:text-blue-500 px-3 py-1 rounded-lg text-sm font-bold transition-all flex items-center gap-1"
                        >
                            🔗
                        </button>
                    </div>
                )}

                {showUrlInput && (
                    <form onSubmit={handleAddUrl} className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 animate-pop">
                        <input
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://..."
                            className="text-sm px-2 py-1 outline-none text-slate-600 w-48 md:w-64"
                            autoFocus
                        />
                        <button type="submit" className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-bold hover:bg-blue-600">เพิ่ม</button>
                        <button type="button" onClick={() => setShowUrlInput(false)} className="text-slate-400 hover:text-slate-600 px-1">✕</button>
                    </form>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {images.map((img, idx) => (
                    <div key={idx} className="relative group bg-white p-2 pb-8 shadow-md transform rotate-1 hover:rotate-0 transition-transform duration-300">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/40 rotate-1 shadow-sm backdrop-blur-[1px] z-20 border-l border-r border-white/20"></div>
                        <img
                            src={img}
                            alt="memory"
                            className="w-full h-32 object-cover grayscale-[20%] group-hover:grayscale-0 transition-all bg-slate-100"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Error'; }}
                        />
                        {isEditable && (
                            <button
                                onClick={() => onRemoveImage(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-30"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiaryGallery;