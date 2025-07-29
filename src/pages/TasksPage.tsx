import { useState, useEffect } from 'react';
import { useTasks, useCreateTask } from '../hooks/useTasks';
import { useTags } from '../hooks/useTags';
import { useTasksStore } from '../stores/tasksStore';
import { useDebounce } from '../hooks/useDebounce';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Search, Calendar as CalendarIcon, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getFocusRing } from '@/lib/theme';
import TaskCard from '@/components/TaskCard';

const TasksPage = () => {
  const { filters, setFilters } = useTasksStore();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const isMobile = useIsMobile();
  
  // Use debounced search term for actual filtering
  const searchFilters = { ...filters, search: debouncedSearchTerm || undefined };
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(searchFilters);
  const { data: tags = [] } = useTags();
  const createTaskMutation = useCreateTask();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    tags: [] as string[],
    dueDate: undefined as Date | undefined,
    estimatedPomodoros: 1,
  });

  const [newTag, setNewTag] = useState('');

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      await createTaskMutation.mutateAsync({
        ...newTask,
      });
      
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        tags: [],
        dueDate: undefined,
        estimatedPomodoros: 1,
      });
      setIsAddDialogOpen(false);
      
      toast({
        title: 'Task created',
        description: 'Your new task has been added successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create task.',
        variant: 'destructive',
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newTask.tags.includes(newTag.trim())) {
      setNewTask(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTask(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Keyboard shortcut for Add Task (ALT+T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsAddDialogOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Remove tag filter function
  const handleRemoveTagFilter = (tagToRemove: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.filter(t => t !== tagToRemove);
    setFilters({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
  };

  const allTags = Array.from(new Set(tags.map(tag => tag.name)));

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your to-do list and track progress</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className={cn('w-full md:w-auto', getFocusRing())}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className={cn("max-w-md mx-auto", isMobile && "w-[95vw] max-h-[90vh] overflow-y-auto")}>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Create a new task to add to your to-do list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  className={cn('mt-1', getFocusRing())}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={3}
                  className={cn('mt-1', getFocusRing())}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
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
                  <Label htmlFor="pomodoros">Estimated Pomodoros</Label>
                  <Input
                    id="pomodoros"
                    type="number"
                    min="1"
                    value={newTask.estimatedPomodoros}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimatedPomodoros: parseInt(e.target.value) || 1 }))}
                    className={cn('mt-1', getFocusRing())}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !newTask.dueDate && "text-muted-foreground",
                        getFocusRing()
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.dueDate ? format(newTask.dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newTask.dueDate}
                      onSelect={(date) => setNewTask(prev => ({ ...prev, dueDate: date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="tags"
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
                  {newTask.tags.map((tag) => (
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
              <Button 
                onClick={handleAddTask} 
                className={cn('w-full', getFocusRing())}
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? 'Adding...' : 'Add Task'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={cn('pl-10', getFocusRing())}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:flex md:space-x-4">
              <Select value={filters.priority || 'all'} onValueChange={(value: string) => setFilters({ ...filters, priority: value === 'all' ? undefined : value as 'high' | 'medium' | 'low' })}>
                <SelectTrigger className={cn('w-full md:w-[150px]', getFocusRing())}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status || 'all'} onValueChange={(value: string) => setFilters({ ...filters, status: value === 'all' ? undefined : value as 'completed' | 'pending' })}>
                <SelectTrigger className={cn('w-full md:w-[150px]', getFocusRing())}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {allTags.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Filter by tags:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {allTags.map((tag) => {
                  const isActive = filters.tags?.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isActive ? "default" : "outline"}
                      className={cn(
                        'cursor-pointer transition-colors touch-target group relative',
                        getFocusRing(),
                        isActive && 'pr-6'
                      )}
                      onClick={() => {
                        const currentTags = filters.tags || [];
                        const newTags = currentTags.includes(tag)
                          ? currentTags.filter(t => t !== tag)
                          : [...currentTags, tag];
                        setFilters({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
                      }}
                    >
                      {tag}
                      {isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTagFilter(tag);
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 rounded-full p-0.5"
                          aria-label={`Remove ${tag} filter`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-3 md:space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No tasks found. Create your first task to get started!</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
};

export default TasksPage;
