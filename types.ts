
export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum TaskStatus {
  TODO = 'Todo',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done'
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Hex code or Tailwind class identifier
  isDefault?: boolean;
}

export interface ActivityLog {
  id: string;
  content: string; // e.g., "Called customer", "Updated status to Done"
  type: 'comment' | 'system';
  createdAt: number;
}

export interface LinkAttachment {
  id: string;
  url: string;
  title: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: number;
  dueDate?: number; // timestamp
  subtasks: SubTask[];
  tags: string[];
  categoryId?: string;
  
  // New Fields for Business Flow
  activities: ActivityLog[];
  links: LinkAttachment[];
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  date: string; // Format YYYY-MM-DD
  content: string;
  mood?: string; // e.g., 'Happy', 'Sad'
  images: string[]; // Base64 or URLs
  paper_pattern?: string; // 'lined', 'grid', 'dot', 'plain', 'pink'
  created_at: number;
  updated_at: number;
}

export interface AIResponse {
  subtasks: string[];
  suggestedPriority: Priority;
  suggestedTags: string[];
  suggestedDueDate?: string; // ISO Date string
}