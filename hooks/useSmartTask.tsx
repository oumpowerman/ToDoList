import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Task, Category, TaskStatus, Priority } from '../types';
import { NotificationService } from '../services/notificationService';
import { Capacitor } from '@capacitor/core';

const PAGE_SIZE = 20;

export const useSmartTask = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ full_name: string, avatar_url: string } | null>(null);
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters State
  const [sidebarFilter, setSidebarFilter] = useState<'All' | TaskStatus | string>(TaskStatus.TODO);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | Priority>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Notification State
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

  // --- Data Fetching Functions (Defined first to be used in Effect) ---

  const fetchProfile = async (userId: string) => {
      // Use maybeSingle() to avoid error if profile triggers haven't run yet or failed
      const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).maybeSingle();
      if (data) setProfile(data);
  };

  const fetchCategories = async (userId: string) => {
    const { data, error } = await supabase.from('categories').select('*').eq('user_id', userId); 
    if (!error && data) setCategories(data);
  };

  const fetchTasks = useCallback(async (isLoadMore = false) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.user) return;

    if (!isLoadMore) setLoading(true);
    else setIsLoadingMore(true);

    const currentPage = isLoadMore ? page + 1 : 0;
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', currentSession.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (sidebarFilter !== 'All') {
        if (Object.values(TaskStatus).includes(sidebarFilter as TaskStatus)) {
            if (sidebarFilter === TaskStatus.TODO) query = query.neq('status', TaskStatus.DONE); 
            else query = query.eq('status', sidebarFilter);
        } else {
            query = query.eq('category_id', sidebarFilter);
        }
    }
    if (search) query = query.ilike('title', `%${search}%`); 
    if (priorityFilter !== 'All') query = query.eq('priority', priorityFilter);
    if (startDate) query = query.gte('due_date', new Date(startDate).getTime());
    if (endDate) query = query.lte('due_date', new Date(endDate).getTime() + 86400000); 

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching tasks:', error);
    } else {
        const mappedTasks: Task[] = (data || []).map((d: any) => ({
            id: d.id,
            title: d.title,
            description: d.description,
            priority: d.priority,
            status: d.status,
            createdAt: Number(d.created_at), 
            dueDate: d.due_date ? Number(d.due_date) : undefined,
            subtasks: d.subtasks || [],
            tags: d.tags || [],
            categoryId: d.category_id || undefined,
            activities: d.activities || [],
            links: d.links || []
        }));

        if (isLoadMore) {
            setTasks(prev => [...prev, ...mappedTasks]);
            setPage(currentPage);
        } else {
            setTasks(mappedTasks);
            setPage(0);
        }
        setHasMore(mappedTasks.length === PAGE_SIZE);
        
        // Re-schedule notifications for existing tasks on native (in case of restart)
        if (Capacitor.isNativePlatform() && !isLoadMore) {
             mappedTasks.forEach(t => {
                 if(t.status !== TaskStatus.DONE && t.dueDate && t.dueDate > Date.now()) {
                     NotificationService.schedule(t);
                 }
             });
        }
    }
    setLoading(false);
    setIsLoadingMore(false);
  }, [sidebarFilter, search, priorityFilter, startDate, endDate, page]);

  // --- Auth & Init Effect ---
  useEffect(() => {
    // 1. Initial Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
          fetchProfile(session.user.id);
          fetchCategories(session.user.id);
          // Don't need to call fetchTasks here if we rely on the filter-effect below?
          // BUT the filter-effect might run before session is set if we don't depend on session.
          // Since fetchTasks gets session internally, we should call it.
          fetchTasks(false); 
      } else {
          setLoading(false);
      }
    });

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { 
          setTasks([]); 
          setCategories([]); 
          setProfile(null);
      } else { 
          fetchProfile(session.user.id);
          fetchCategories(session.user.id); 
          // IMPORTANT: Trigger fetchTasks when user logs in
          // This ensures tasks load immediately even if filters haven't changed
          fetchTasks(false);
      }
    });
    
    // Request Notification Permissions on Mount
    NotificationService.requestPermissions();

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // --- Filter Change Effect ---
  // Trigger fetch whenever filters change
  useEffect(() => { 
      // Only fetch if we have a session (optimization, though fetchTasks checks too)
      // We don't check session state here to avoid dependency cycles, fetchTasks handles it.
      fetchTasks(false); 
  }, [sidebarFilter, search, priorityFilter, startDate, endDate, fetchTasks]);

  // --- Web Notification Polling (Fallback for non-mobile) ---
  useEffect(() => {
      if (Capacitor.isNativePlatform()) return;

      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission();
      }
      const interval = setInterval(() => {
          if (Notification.permission !== 'granted') return;
          const now = Date.now();
          tasks.forEach(task => {
              if (task.status === TaskStatus.DONE || !task.dueDate) return;
              if (notifiedTasks.has(task.id)) return;
              const timeLeft = task.dueDate - now;
              // Alert 1 hour before
              if (timeLeft > 0 && timeLeft <= 60 * 60 * 1000) {
                  const name = profile?.full_name ? `คุณ${profile.full_name}` : 'เธอ';
                  new Notification(`⏰ ${name}! ใกล้ถึงเวลานัดแล้ว`, {
                      body: `${task.title} ในอีก ${Math.ceil(timeLeft / 60000)} นาทีนะ`,
                      icon: '/favicon.ico'
                  });
                  setNotifiedTasks(prev => new Set(prev).add(task.id));
              }
          });
      }, 60000); 
      return () => clearInterval(interval);
  }, [tasks, notifiedTasks, profile]);

  // --- Actions ---
  const addTask = async (task: Task) => {
    if (!session?.user) return;
    setTasks(prev => [task, ...prev]);
    
    // Schedule Notification
    await NotificationService.schedule(task);

    const { error } = await supabase.from('tasks').insert({
      id: task.id, user_id: session.user.id, title: task.title, description: task.description,
      priority: task.priority, status: task.status, created_at: task.createdAt, due_date: task.dueDate,
      subtasks: task.subtasks, tags: task.tags, category_id: task.categoryId, activities: task.activities, links: task.links
    });
    if (error) { console.error(error); fetchTasks(false); }
  };

  const updateTask = async (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

    // Handle Notification Logic
    if (updatedTask.status === TaskStatus.DONE) {
        await NotificationService.cancel(updatedTask.id);
    } else {
        await NotificationService.schedule(updatedTask);
    }

    const { error } = await supabase.from('tasks').update({
        title: updatedTask.title, description: updatedTask.description, priority: updatedTask.priority,
        status: updatedTask.status, due_date: updatedTask.dueDate, subtasks: updatedTask.subtasks,
        tags: updatedTask.tags, category_id: updatedTask.categoryId, activities: updatedTask.activities, links: updatedTask.links
    }).eq('id', updatedTask.id);
    if (error) console.error(error);
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    
    // Cancel Notification
    await NotificationService.cancel(id);

    await supabase.from('tasks').delete().eq('id', id);
  };

  const addCategory = async (category: Category) => {
      if (!session?.user) return;
      setCategories(prev => [...prev, category]);
      await supabase.from('categories').insert({
          id: category.id, user_id: session.user.id, name: category.name, color: category.color
      });
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setTasks(prev => prev.map(t => t.categoryId === id ? { ...t, categoryId: undefined } : t));
    await supabase.from('categories').delete().eq('id', id);
  };

  const clearCompleted = async () => {
    if (!session?.user) return;
    
    // Cleanup notifications for tasks being removed
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE);
    completedTasks.forEach(t => NotificationService.cancel(t.id));

    setTasks(prev => prev.filter(t => t.status !== TaskStatus.DONE));
    await supabase.from('tasks').delete().eq('status', TaskStatus.DONE).eq('user_id', session.user.id);
    setTimeout(() => fetchTasks(false), 500);
  };

  const resetFilters = () => {
      setSearch(''); setPriorityFilter('All'); setStartDate(''); setEndDate('');
  };

  return {
    session, profile, loading, tasks, categories,
    pagination: { page, hasMore, isLoadingMore, fetchMore: () => fetchTasks(true) },
    filters: { 
        sidebarFilter, setSidebarFilter, 
        search, setSearch, 
        priorityFilter, setPriorityFilter, 
        startDate, setStartDate, 
        endDate, setEndDate, 
        resetFilters 
    },
    actions: { addTask, updateTask, deleteTask, addCategory, deleteCategory, clearCompleted }
  };
};