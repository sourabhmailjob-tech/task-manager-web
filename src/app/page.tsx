'use client';

import { useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/logo';
import { TaskCard } from '@/components/task-card';
import { TaskColumn } from '@/components/task-column';
import { TaskForm } from '@/components/task-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Status, Task } from '@/lib/types';
import { cn } from '@/lib/utils';

const initialTasks: Task[] = [
  { id: '1', title: 'Finalize Q3 roadmap', deadline: new Date('2024-07-30'), priority: 'high', status: 'todo' },
  { id: '2', title: 'Review marketing campaign assets', deadline: new Date('2024-08-05'), priority: 'medium', status: 'todo' },
  { id: '3', title: 'Update user documentation', deadline: new  Date('2024-08-10'), priority: 'low', status: 'in-progress' },
  { id: '4', title: 'Deploy v2.1 to production', deadline: new Date('2024-07-28'), priority: 'high', status: 'in-progress' },
  { id: '5', title: 'Onboard new design intern', deadline: new Date('2024-07-25'), priority: 'medium', status: 'completed' },
  { id: '6', title: 'Sprint planning meeting', deadline: new Date('2024-07-29'), priority: 'medium', status: 'completed' },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [calendarHistory, setCalendarHistory] = useState<string>('Attended sprint planning meeting on 2024-07-29. Finalized Q3 roadmap on 2024-07-30.');

  const handleSaveTask = (data: Omit<Task, 'id' | 'status'>, id?: string) => {
    if (id) {
      // Update existing task
      setTasks(tasks.map(t => t.id === id ? { ...t, ...data } : t));
    } else {
      // Create new task
      const newTask: Task = {
        id: crypto.randomUUID(),
        status: 'todo',
        ...data,
      };
      setTasks([...tasks, newTask]);
    }
  };
  
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleStatusChange = (id: string, status: Status) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
  };
  
  const filteredTasks = useMemo(() => ({
    todo: tasks.filter(t => t.status === 'todo').sort((a, b) => a.deadline.getTime() - b.deadline.getTime()),
    'in-progress': tasks.filter(t => t.status === 'in-progress').sort((a, b) => a.deadline.getTime() - b.deadline.getTime()),
    completed: tasks.filter(t => t.status === 'completed').sort((a, b) => a.deadline.getTime() - b.deadline.getTime()),
  }), [tasks]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    const startColId = source.droppableId as Status;
    const endColId = destination.droppableId as Status;

    const startCol = [...filteredTasks[startColId]];
    const endCol = startColId === endColId ? startCol : [...filteredTasks[endColId]];

    const [removed] = startCol.splice(source.index, 1);

    if (startColId !== endColId) {
      removed.status = endColId;
    }

    endCol.splice(destination.index, 0, removed);
    
    const newTasks = tasks.map(t => {
      if (t.id === draggableId) return { ...t, status: endColId };
      return t;
    });

    // We need to re-create the full list of tasks to update state correctly
    const allTasksFromCols = [
      ...filteredTasks.todo,
      ...filteredTasks['in-progress'],
      ...filteredTasks.completed,
    ].reduce((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {} as Record<string, Task>);
    
    if (startColId === endColId) {
        const newColTasks = endCol.map(t => allTasksFromCols[t.id]);
        const otherTasks = tasks.filter(t => t.status !== startColId);
        setTasks([...otherTasks, ...newColTasks]);
    } else {
        const newStartColTasks = startCol.map(t => allTasksFromCols[t.id]);
        const newEndColTasks = endCol.map(t => ({...allTasksFromCols[t.id], status: endColId}));
        const otherTasks = tasks.filter(t => t.status !== startColId && t.status !== endColId);
        setTasks([...otherTasks, ...newStartColTasks, ...newEndColTasks]);
    }

    handleStatusChange(draggableId, endColId);
  };


  return (
    <>
      <main className="container mx-auto py-8 px-4 md:px-6">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <Logo />
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Task
          </Button>
        </header>

        <section className="mb-8">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Calendar History for Smart Completion</CardTitle>
              <CardDescription>
                Provide your calendar events here. The AI will use this context to suggest auto-completing tasks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="calendar-history" className="sr-only">Calendar History</Label>
              <Textarea
                id="calendar-history"
                placeholder="e.g., Attended weekly sync on 2024-07-29..."
                value={calendarHistory}
                onChange={(e) => setCalendarHistory(e.target.value)}
                className="min-h-[100px] text-sm bg-gradient-to-br from-primary/10 to-accent/10"
              />
            </CardContent>
          </Card>
        </section>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(['todo', 'in-progress', 'completed'] as Status[]).map(status => (
              <Droppable key={status} droppableId={status}>
                {(provided, snapshot) => (
                  <TaskColumn 
                    status={status}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(snapshot.isDraggingOver && 'bg-accent/10')}
                  >
                    {filteredTasks[status].length > 0 ? (
                      filteredTasks[status].map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(snapshot.isDragging && 'opacity-80 shadow-2xl')}
                            >
                              <TaskCard
                                task={task}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onStatusChange={handleStatusChange}
                                calendarHistory={calendarHistory}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-card/30 rounded-lg">
                        <p className="text-muted-foreground">This column is empty.</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">Move tasks here or create a new one.</p>
                      </div>
                    )}
                    {provided.placeholder}
                  </TaskColumn>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </main>

      <TaskForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </>
  );
}
