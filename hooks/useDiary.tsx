import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { DiaryEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '@supabase/supabase-js';

export const useDiary = (session: Session | null) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('😊');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

  const isEditable = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(currentDate);
    target.setHours(0, 0, 0, 0);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    return target >= twoDaysAgo && target <= today;
  }, [currentDate]);

  const fetchEntry = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    const dateKey = formatDateKey(currentDate);

    // Use maybeSingle() instead of single() to avoid PGRST116 error when no row exists
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('date', dateKey)
      .maybeSingle();

    if (error) {
       console.error('Error fetching diary:', error);
    }

    const diaryData = data;

    if (diaryData) {
       setEntry(diaryData);
       // Handle title if it exists in DB, otherwise default to empty
       setTitle((diaryData as any).title || ''); 
       setContent(diaryData.content);
       setMood(diaryData.mood || '😊');
       setImages(diaryData.images || []);
    } else {
       setEntry(null);
       setTitle('');
       setContent('');
       setMood('😊');
       setImages([]);
    }
    setLoading(false);
  }, [currentDate, session]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const saveDiary = async () => {
    if (!session?.user) return;
    setSaving(true);
    const dateKey = formatDateKey(currentDate);

    const diaryData = {
        id: entry?.id || uuidv4(),
        user_id: session.user.id,
        date: dateKey,
        content,
        mood,
        images,
        // Upsert title (User needs to add column to DB manually if not exists, 
        // but this ensures UI sends it if available)
        title: title, 
        updated_at: Date.now(),
        created_at: entry?.created_at || Date.now()
    };

    const { error } = await supabase
        .from('diaries')
        .upsert(diaryData);

    if (error) {
        console.error("Save failed", error);
        // Fallback: If title column doesn't exist, try saving without it to preserve content
        if (error.message?.includes('column "title" of relation "diaries" does not exist')) {
            const { title, ...backupData } = diaryData;
            await supabase.from('diaries').upsert(backupData);
        }
    } else {
        setEntry(diaryData as DiaryEntry);
    }
    setSaving(false);
  };

  const changeDate = (days: number) => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + days);
      setCurrentDate(newDate);
  };

  return {
      currentDate, changeDate,
      title, setTitle,
      content, setContent,
      mood, setMood,
      images, setImages,
      loading, saving, isEditable,
      saveDiary
  };
};