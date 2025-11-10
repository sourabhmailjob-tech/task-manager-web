import { forwardRef, ReactNode } from 'react';
import type { Status } from '@/lib/types';
import { cn } from '@/lib/utils';

type TaskColumnProps = {
  status: Status;
  children: ReactNode;
  className?: string;
};

const statusConfig = {
  todo: { title: 'To-Do', color: 'bg-primary' },
  'in-progress': { title: 'In Progress', color: 'bg-accent' },
  completed: { title: 'Completed', color: 'bg-chart-2' },
};

export const TaskColumn = forwardRef<HTMLDivElement, TaskColumnProps>(({ status, children, className, ...props }, ref) => {
  const config = statusConfig[status];
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
        <h2 className="text-xl font-bold font-headline text-foreground/90">
          {config.title}
        </h2>
      </div>
      <div 
        ref={ref}
        className={cn("flex flex-col gap-4 rounded-xl bg-card/30 p-4 min-h-[400px] transition-colors duration-300 border", className)}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});

TaskColumn.displayName = 'TaskColumn';
