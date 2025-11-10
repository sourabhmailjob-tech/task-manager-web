import { ListChecks } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/20 rounded-lg">
        <ListChecks className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-3xl font-bold font-headline text-foreground">
        TaskMaster
      </h1>
    </div>
  );
}
