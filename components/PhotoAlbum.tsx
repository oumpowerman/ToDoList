import React from 'react';

interface PhotoAlbumProps {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  isEditable: boolean;
}

const PhotoAlbum: React.FC<PhotoAlbumProps> = ({ images, setImages, isEditable }) => {
  
  const removeImage = (index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (images.length === 0) return null;

  return (
    <div className="mt-4 relative z-10 w-full">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 opacity-70 text-center md:text-left">
            ความทรงจำ ({images.length})
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {images.map((img, idx) => (
                <div key={idx} className="relative group bg-white p-2 pb-8 shadow-md transform rotate-1 hover:rotate-0 transition-transform duration-300">
                    {/* Tape Effect */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/40 rotate-1 shadow-sm backdrop-blur-[1px] z-20 border-l border-r border-white/20"></div>
                    
                    <img 
                    src={img} 
                    alt="memory" 
                    className="w-full h-32 object-cover grayscale-[20%] group-hover:grayscale-0 transition-all bg-slate-100" 
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Error'; }}
                    />
                    
                    {isEditable && (
                    <button 
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-30"
                        title="ลบรูปภาพ"
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

export default PhotoAlbum;