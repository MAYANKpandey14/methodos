import { useState, useEffect } from 'react';
import { useTasks, useCreateTask } from '../hooks/useTasks';
import { useTagsWithStats, useDeleteTag } from '../hooks/useTags';
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
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Plus, Search, Calendar as CalendarIcon, Loader2, X, Trash2, TrendingUp } from 'lucide-react';
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
  const { data: tagsWithStats = [] } = useTagsWithStats();
  const createTaskMutation = useCreateTask();
  const deleteTagMutation = useDeleteTag();
  const { toast } = useToast();
  
  const [tagToDelete, setTagToDelete] = useState<{ id: string; name: string } | null>(null);

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

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    
    try {
      await deleteTagMutation.mutateAsync(tagToDelete.id);
      toast({
        title: 'Tag deleted',
        description: `Tag "${tagToDelete.name}" has been deleted.`,
      });
      setTagToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete tag.',
        variant: 'destructive',
      });
    }
  };

  // Get recommended tags (top 5 most used)
  const recommendedTags = tagsWithStats
    .filter(tag => tag.usage_count > 0)
    .slice(0, 5)
    .map(tag => tag.name);

  const allTags = Array.from(new Set(tagsWithStats.map(tag => tag.name)));

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
                {recommendedTags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Recommended (most used):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recommendedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={cn(
                            'cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground transition-colors',
                            newTask.tags.includes(tag) && 'bg-primary text-primary-foreground'
                          )}
                          onClick={() => {
                            if (!newTask.tags.includes(tag)) {
                              setNewTask(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                            }
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex space-x-2 mt-3">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                <Label className="text-sm font-medium">Filter by tags:</Label>
                <p className="text-xs text-muted-foreground">
                  Click to filter • Hover to manage
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {tagsWithStats.map((tag) => {
                  const isActive = filters.tags?.includes(tag.name);
                  return (
                    <div
                      key={tag.id}
                      className="relative group"
                    >
                      <Badge
                        variant={isActive ? "default" : "outline"}
                        className={cn(
                          'cursor-pointer transition-all duration-300 ease-out',
                          'min-h-[32px] sm:min-h-[36px]',
                          'pl-3 pr-3',
                          'hover:shadow-lg hover:-translate-y-0.5',
                          'active:scale-95',
                          getFocusRing(),
                          isActive && 'ring-2 ring-primary/20'
                        )}
                        onClick={() => {
                          const currentTags = filters.tags || [];
                          const newTags = currentTags.includes(tag.name)
                            ? currentTags.filter(t => t !== tag.name)
                            : [...currentTags, tag.name];
                          setFilters({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
                        }}
                      >
                        <span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                          {tag.name}
                          {tag.usage_count > 0 && (
                            <span className="text-[10px] sm:text-xs opacity-60 font-normal">({tag.usage_count})</span>
                          )}
                        </span>
                      </Badge>
                      
                      {/* Action buttons - appear on hover */}
                      <div className={cn(
                        "absolute -top-2 -right-2 flex items-center gap-1",
                        "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100",
                        "transition-all duration-200 ease-out",
                        "pointer-events-none group-hover:pointer-events-auto",
                        isMobile && "opacity-100 scale-100 pointer-events-auto"
                      )}>
                        {isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTagFilter(tag.name);
                            }}
                            className={cn(
                              "flex items-center justify-center",
                              "w-6 h-6 sm:w-7 sm:h-7",
                              "bg-background border-2 border-primary/50",
                              "rounded-full shadow-md",
                              "hover:bg-primary hover:border-primary hover:text-primary-foreground",
                              "active:scale-90",
                              "transition-all duration-200",
                              "touch-manipulation"
                            )}
                            aria-label={`Remove ${tag.name} filter`}
                            title="Remove filter"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTagToDelete({ id: tag.id, name: tag.name });
                          }}
                          className={cn(
                            "flex items-center justify-center",
                            "w-6 h-6 sm:w-7 sm:h-7",
                            "bg-background border-2 border-destructive/50",
                            "rounded-full shadow-md",
                            "hover:bg-destructive hover:border-destructive hover:text-destructive-foreground",
                            "active:scale-90",
                            "transition-all duration-200",
                            "touch-manipulation"
                          )}
                          aria-label={`Delete ${tag.name} tag`}
                          title="Delete tag"
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                      </div>
                    </div>
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

      {/* Delete Tag Confirmation Dialog */}
      <AlertDialog open={!!tagToDelete} onOpenChange={() => setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag "{tagToDelete?.name}"? This will remove it from all tasks but won't delete the tasks themselves.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TasksPage;
