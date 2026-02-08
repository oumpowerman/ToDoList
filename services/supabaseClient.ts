import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

// ⚠️ ใส่ Supabase URL และ Anon Key ของคุณตรงนี้ (เอาจาก Supabase Dashboard > Settings > API)
const supabaseUrl = "https://hljolqwmpjgeyvdrpkec.supabase.co"; 
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsam9scXdtcGpnZXl2ZHJwa2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODQxNzAsImV4cCI6MjA4NTM2MDE3MH0.Yo8dT78e7cV7XmvqswpZfQeIl2VW1zuDaNrgzo5bCe4";

// Custom Storage Adapter for Capacitor
const CapacitorStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    await Preferences.remove({ key });
  },
};

// Initialize Real Client with Persistent Storage Config
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: CapacitorStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for Capacitor to prevent URL hash issues
  },
});

// Helper for image upload fallback (if needed locally before upload)
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const uploadFile = async (file: File, bucket = 'diary-images'): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
        
        if (uploadError) {
            console.error("Upload Error:", uploadError);
            throw uploadError;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) {
        console.error('File processing error:', error);
        alert('อัปโหลดรูปไม่สำเร็จ กรุณาตรวจสอบ Storage Bucket Policy ใน Supabase');
        return null;
    }
};