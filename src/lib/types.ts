export type Priority = 'low' | 'medium' | 'high';

export type Status = 'todo' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  deadline: Date;
  priority: Priority;
  status: Status;
}
