
import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { useUpdateTask } from '@/hooks/useTasks';
import { useTags } from '@/hooks/useTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getFocusRing } from '@/lib/theme';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface TaskEditDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskEditDialog = ({ task, open, onOpenChange }: TaskEditDialogProps) => {
  const { data: tags = [] } = useTags();
  const updateTaskMutation = useUpdateTask();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    tags: task.tags,
    dueDate: task.dueDate,
    estimatedPomodoros: task.estimatedPomodoros,
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (open) {
      setEditedTask({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        tags: task.tags,
        dueDate: task.dueDate,
        estimatedPomodoros: task.estimatedPomodoros,
      });
    }
  }, [task, open]);

  const handleSave = async () => {
    if (!editedTask.title.trim()) {
      toast({
        title: 'Error',
        description: 'Task title is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        updates: {
          title: editedTask.title,
          description: editedTask.description || null,
          priority: editedTask.priority,
          dueDate: editedTask.dueDate,
          estimatedPomodoros: editedTask.estimatedPomodoros,
        }
      });
      
      onOpenChange(false);
      
      toast({
        title: 'Task updated',
        description: 'Your task has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update task.',
        variant: 'destructive',
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedTask.tags.includes(newTag.trim())) {
      setEditedTask(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedTask(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-md mx-auto", isMobile && "w-[95vw] max-h-[90vh] overflow-y-auto")}>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to your task here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={editedTask.title}
              onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              className={cn('mt-1', getFocusRing())}
            />
          </div>
          
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={editedTask.description}
              onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              rows={3}
              className={cn('mt-1', getFocusRing())}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={editedTask.priority} onValueChange={(value: any) => setEditedTask(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className={cn('mt-1', getFocusRing())}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-pomodoros">Estimated Pomodoros</Label>
              <Input
                id="edit-pomodoros"
                type="number"
                min="1"
                value={editedTask.estimatedPomodoros}
                onChange={(e) => setEditedTask(prev => ({ ...prev, estimatedPomodoros: parseInt(e.target.value) || 1 }))}
                className={cn('mt-1', getFocusRing())}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-dueDate">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !editedTask.dueDate && "text-muted-foreground",
                    getFocusRing()
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editedTask.dueDate ? format(editedTask.dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={editedTask.dueDate}
                  onSelect={(date) => setEditedTask(prev => ({ ...prev, dueDate: date }))}
                  initialFocus
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label htmlFor="edit-tags">Tags</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="edit-tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className={getFocusRing()}
              />
              <Button type="button" onClick={handleAddTag} size="sm" className={getFocusRing()}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {editedTask.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" 
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handleSave} 
              className={cn('flex-1', getFocusRing())}
              disabled={updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className={cn('flex-1', getFocusRing())}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditDialog;
