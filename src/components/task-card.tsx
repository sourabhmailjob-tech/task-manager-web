'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronsUp,
  Edit,
  Loader2,
  MoreVertical,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { smartTaskCompletion } from '@/ai/flows/smart-task-completion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Status, Task } from '@/lib/types';

const priorityConfig = {
  low: { label: 'Low', icon: <ChevronDown className="h-4 w-4" />, color: 'bg-chart-2/20 text-chart-2 border-chart-2/20' },
  medium: { label: 'Medium', icon: <ArrowRight className="h-4 w-4 rotate-[-45deg]" />, color: 'bg-chart-4/20 text-chart-4 border-chart-4/20' },
  high: { label: 'High', icon: <ChevronsUp className="h-4 w-4" />, color: 'bg-chart-1/20 text-chart-1 border-chart-1/20' },
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
  calendarHistory: string;
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange, calendarHistory }: TaskCardProps) {
  const [isSmartCompleting, setIsSmartCompleting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ reasoning: string } | null>(null);
  const { toast } = useToast();

  const handleSmartComplete = async () => {
    setIsSmartCompleting(true);
    try {
      const result = await smartTaskCompletion({
        taskDetails: task.title,
        calendarHistory: calendarHistory,
      });

      if (result.shouldCompleteTask && !result.confirmationRequired) {
        onStatusChange(task.id, 'completed');
        toast({
          title: 'Task Auto-Completed!',
          description: result.reasoning,
        });
      } else if (result.confirmationRequired) {
        setConfirmation({ reasoning: result.reasoning });
      } else {
        toast({
          variant: 'default',
          title: 'Could Not Auto-Complete',
          description: result.reasoning,
        });
      }
    } catch (error) {
      console.error('Smart completion failed:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'The smart completion feature failed. Please try again.',
      });
    } finally {
      setIsSmartCompleting(false);
    }
  };

  const currentPriority = priorityConfig[task.priority];

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-300 group bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex justify-between items-start">
            <span className="pr-4">{task.title}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                     <ArrowRight className="mr-2 h-4 w-4" />
                    <span>Move to</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {task.status !== 'todo' && <DropdownMenuItem onClick={() => onStatusChange(task.id, 'todo')}>To-Do</DropdownMenuItem>}
                      {task.status !== 'in-progress' && <DropdownMenuItem onClick={() => onStatusChange(task.id, 'in-progress')}>In Progress</DropdownMenuItem>}
                      {task.status !== 'completed' && <DropdownMenuItem onClick={() => onStatusChange(task.id, 'completed')}>Completed</DropdownMenuItem>}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => onDelete(task.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(task.deadline, 'PPP')}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Badge variant="outline" className={cn('gap-1.5 font-medium', currentPriority.color)}>
            {currentPriority.icon}
            {currentPriority.label}
          </Badge>
          <Button size="sm" variant="ghost" onClick={handleSmartComplete} disabled={isSmartCompleting || task.status === 'completed'}>
            {isSmartCompleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-accent" />
            )}
            Smart Complete
          </Button>
        </CardFooter>
      </Card>
      
      <AlertDialog open={!!confirmation} onOpenChange={(open) => !open && setConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation Required</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.reasoning} Do you want to mark this task as complete?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onStatusChange(task.id, 'completed');
              setConfirmation(null);
              toast({ title: 'Task marked as complete.' });
            }}>
              Mark as Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
