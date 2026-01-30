import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// 👇 2. ใส่ Supabase URL ของคุณที่นี่
// ------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';

// ------------------------------------------------------------------
// 👇 3. ใส่ Supabase Anon Key ของคุณที่นี่
// ------------------------------------------------------------------
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

// Export isMock status so UI knows when to show demo features
export const isMock = (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL_HERE') || (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY_HERE');

let supabaseClient: any;

// Helper for Base64 conversion (Used for Mock or Fallback)
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

if (supabaseUrl && supabaseAnonKey && !isMock) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  if (!isMock) console.warn("⚠️ Supabase credentials invalid. Using Mock Client.");
  
  // --- MOCK IMPLEMENTATION (ระบบจำลองเมื่อยังไม่ได้ใส่ Key) ---
  const USER_KEY = 'smarttask-mock-user';

  // Helper to get key based on table name
  const getStorageKey = (table: string) => `smarttask_table_${table}`;

  const getLocalData = (table: string) => {
    try {
      const key = getStorageKey(table);
      const data = localStorage.getItem(key);
      if (!data && table === 'categories') {
        // Default categories for new users
        const defaults = [
          { id: 'cat-1', name: '🏢 งานหลัก', color: 'blue' },
          { id: 'cat-2', name: '🏠 เรื่องส่วนตัว', color: 'green' },
          { id: 'cat-3', name: '🔥 โปรเจกต์ลับ', color: 'rose' }
        ];
        localStorage.setItem(key, JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(data || '[]');
    } catch { return []; }
  };

  const setLocalData = (table: string, data: any[]) => {
    localStorage.setItem(getStorageKey(table), JSON.stringify(data));
  };

  // Mock Query Builder Chain
  class MockQueryBuilder {
    table: string;
    data: any[];
    filters: ((item: any) => boolean)[];
    sortConfig: { col: string, ascending: boolean } | null;
    rangeConfig: { start: number, end: number } | null;

    constructor(table: string) {
      this.table = table;
      this.data = getLocalData(table);
      this.filters = [];
      this.sortConfig = null;
      this.rangeConfig = null;
    }

    select(cols: string) { return this; }
    single() { return this; } // Mock single

    // Filters
    eq(col: string, val: any) {
      this.filters.push(item => item[col] === val);
      return this;
    }
    neq(col: string, val: any) {
      this.filters.push(item => item[col] !== val);
      return this;
    }
    ilike(col: string, val: string) {
      // Mock ILIKE %value%
      const cleanVal = val.replace(/%/g, '').toLowerCase();
      this.filters.push(item => {
          const itemVal = item[col];
          if (Array.isArray(itemVal)) return itemVal.some((t:string) => t.toLowerCase().includes(cleanVal)); // Handle tags array
          return String(itemVal || '').toLowerCase().includes(cleanVal);
      });
      return this;
    }
    gte(col: string, val: any) {
       this.filters.push(item => item[col] >= val);
       return this;
    }
    lte(col: string, val: any) {
       this.filters.push(item => item[col] <= val);
       return this;
    }
    
    // Sort & Pagination
    order(col: string, { ascending }: any) {
      this.sortConfig = { col, ascending };
      return this;
    }
    
    range(start: number, end: number) {
      this.rangeConfig = { start, end };
      return this;
    }

    // Execution
    then(resolve: any, reject: any) {
        // 1. Apply Filters
        let result = this.data.filter(item => this.filters.every(f => f(item)));

        // 2. Apply Sort
        if (this.sortConfig) {
             const { col, ascending } = this.sortConfig;
             // Sort mapping for created_at if needed
             const sortKey = (col === 'created_at' && result.length > 0 && result[0].createdAt) ? 'createdAt' : col;
             
             result.sort((a, b) => {
                 const valA = a[sortKey] ?? 0;
                 const valB = b[sortKey] ?? 0;
                 return ascending ? valA - valB : valB - valA;
             });
        }

        // 3. Apply Range (Pagination)
        // If range is set, we slice.
        if (this.rangeConfig) {
            // Note: Supabase range is inclusive [start, end]
            result = result.slice(this.rangeConfig.start, this.rangeConfig.end + 1);
        }
        
        // Handle .single() mock - usually checked by checking if multiple results
        const isSingleQuery = this.data.length > 0 && this.filters.length > 0; 
        
        resolve({ data: result.length === 1 && this.table === 'diaries' ? result[0] : result, error: null });
    }
  }


  supabaseClient = {
    auth: {
      getSession: async () => {
        const userStr = localStorage.getItem(USER_KEY);
        const user = userStr ? JSON.parse(userStr) : null;
        return { data: { session: user ? { user } : null }, error: null };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        const userStr = localStorage.getItem(USER_KEY);
        const user = userStr ? JSON.parse(userStr) : null;
        const session = user ? { user } : null;
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        (window as any).__triggerMockAuth = (event: string, s: any) => callback(event, s);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword: async ({ email }: any) => {
        await new Promise(r => setTimeout(r, 500));
        const user = { id: 'mock-user-id', email };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        if ((window as any).__triggerMockAuth) (window as any).__triggerMockAuth('SIGNED_IN', { user });
        return { data: { user, session: { user } }, error: null };
      },
      signUp: async ({ email }: any) => {
        await new Promise(r => setTimeout(r, 500));
        const user = { id: 'mock-user-id', email };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        if ((window as any).__triggerMockAuth) (window as any).__triggerMockAuth('SIGNED_IN', { user });
        return { data: { user, session: { user } }, error: null };
      },
      signOut: async () => {
        localStorage.removeItem(USER_KEY);
        if ((window as any).__triggerMockAuth) (window as any).__triggerMockAuth('SIGNED_OUT', null);
        return { error: null };
      }
    },
    from: (table: string) => {
      // Return query builder for selects
      const builder = new MockQueryBuilder(table);
      
      // Monkey patch insert/update/delete/upsert directly
      const writeOp = (op: string, payload: any) => {
          return {
             select: () => Promise.resolve({ data: payload, error: null }),
             eq: (col: string, val: any) => Promise.resolve({ error: null }) // simple mock
          }
      };

      return {
          select: (cols: string) => builder,
          insert: (row: any) => {
              const data = getLocalData(table);
              const normRow = Array.isArray(row) 
                ? row.map(r => ({...r, activities: r.activities || [], links: r.links || []})) 
                : {...row, activities: row.activities || [], links: row.links || []};
              
              if (Array.isArray(normRow)) data.push(...normRow);
              else data.unshift(normRow);
              
              setLocalData(table, data);
              return Promise.resolve({ error: null });
          },
          update: (updates: any) => ({
            eq: (col: string, val: any) => {
                const data = getLocalData(table);
                const newData = data.map((item: any) => item[col] === val ? { ...item, ...updates } : item);
                setLocalData(table, newData);
                return Promise.resolve({ error: null });
            }
          }),
          delete: () => ({
            eq: (col: string, val: any) => {
                const data = getLocalData(table);
                const newData = data.filter((item: any) => item[col] !== val);
                setLocalData(table, newData);
                return Promise.resolve({ error: null });
            }
          }),
          upsert: (row: any) => {
             // Mock upsert for diary: check if exists by id or composite key logic manually
             const data = getLocalData(table);
             const index = data.findIndex((item: any) => item.id === row.id);
             if (index >= 0) {
                 data[index] = { ...data[index], ...row };
             } else {
                 data.push(row);
             }
             setLocalData(table, data);
             return Promise.resolve({ error: null });
          }
      };
    },
    storage: {
        from: (bucket: string) => ({
            upload: async (path: string, file: File) => {
                console.log(`[Mock Storage] Uploading ${file.name} to ${bucket}/${path}`);
                return { data: { path }, error: null };
            },
            getPublicUrl: (path: string) => {
                return { data: { publicUrl: `https://mock-storage/${path}` } };
            }
        })
    }
  };
}

// ** NEW FUNCTION: Handles Image Upload Smartly **
export const uploadFile = async (file: File, bucket = 'diary-images'): Promise<string | null> => {
    // 1. Mock Mode: Return Base64
    if (isMock) {
        return convertToBase64(file);
    }

    // 2. Real Mode: Upload to Supabase Storage
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            return convertToBase64(file);
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) {
        console.error('File processing error:', error);
        return null;
    }
};

export const supabase = supabaseClient;
