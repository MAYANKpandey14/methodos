
import { useState, useEffect } from 'react';
import { useTasks, useUpdateTask } from '../hooks/useTasks';
import { useCreatePomodoroSession, useUpdatePomodoroSession } from '../hooks/usePomodoro';
import { useAuthStore } from '../stores/authStore';
import { usePersistentTimer } from '../hooks/usePersistentTimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Play, Pause, Square, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TimerPage = () => {
  const { profile } = useAuthStore();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({ status: 'pending' });
  const createSessionMutation = useCreatePomodoroSession();
  const updateSessionMutation = useUpdatePomodoroSession();
  const updateTaskMutation = useUpdateTask();
  const { toast } = useToast();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskCompleteDialog, setShowTaskCompleteDialog] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<any>(null);

  const workDuration = (profile?.pomodoro_duration || 25) * 60;
  
  const {
    isRunning,
    timeRemaining,
    sessionId,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setDuration,
  } = usePersistentTimer(workDuration);

  // Update duration when profile loads
  useEffect(() => {
    if (profile) {
      setDuration((profile.pomodoro_duration || 25) * 60);
    }
  }, [profile, setDuration]);

  // Update selected task when tasks load or sessionId changes
  useEffect(() => {
    if (selectedTaskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === selectedTaskId);
      setSelectedTask(task || null);
    }
  }, [selectedTaskId, tasks]);

  const activeTasks = tasks.filter(task => !task.isCompleted);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((workDuration - timeRemaining) / workDuration) * 100;
  };

  const handleTimerComplete = async () => {
    if (sessionId && selectedTask) {
      try {
        // Update session status
        await updateSessionMutation.mutateAsync({
          id: sessionId,
          status: 'completed',
          completedAt: new Date()
        });

        // Increment completed pomodoros for the task
        const newCompletedPomodoros = selectedTask.completedPomodoros + 1;
        await updateTaskMutation.mutateAsync({
          id: selectedTask.id,
          updates: {
            completedPomodoros: newCompletedPomodoros
          }
        });

        // Check if all pomodoros are completed
        if (newCompletedPomodoros >= selectedTask.estimatedPomodoros) {
          setTaskToComplete({ ...selectedTask, completedPomodoros: newCompletedPomodoros });
          setShowTaskCompleteDialog(true);
        }

        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Pomodoro Complete!', {
            body: `${newCompletedPomodoros}/${selectedTask.estimatedPomodoros} pomodoros completed for "${selectedTask.title}"`,
            icon: '/favicon.ico',
          });
        }

        toast({
          title: 'Pomodoro completed!',
          description: `${newCompletedPomodoros}/${selectedTask.estimatedPomodoros} pomodoros completed for "${selectedTask.title}"`,
        });
      } catch (error: any) {
        console.error('Failed to update session:', error);
        toast({
          title: 'Error',
          description: 'Failed to update pomodoro progress.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleStart = async () => {
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task || selectedTaskId === 'no-tasks') return;

    try {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      const session = await createSessionMutation.mutateAsync({
        taskId: task.id,
        durationMinutes: Math.round(workDuration / 60),
        sessionType: 'work'
      });

      setSelectedTask(task);
      startTimer(session.id, handleTimerComplete);
      
      toast({
        title: 'Pomodoro started!',
        description: `Focus time for "${task.title}" has begun.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start session.',
        variant: 'destructive',
      });
    }
  };

  const handlePlayPause = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  };

  const handleComplete = async () => {
    if (sessionId && selectedTask) {
      try {
        // Update session status
        await updateSessionMutation.mutateAsync({
          id: sessionId,
          status: 'completed',
          completedAt: new Date()
        });

        // Increment completed pomodoros for the task
        const newCompletedPomodoros = selectedTask.completedPomodoros + 1;
        await updateTaskMutation.mutateAsync({
          id: selectedTask.id,
          updates: {
            completedPomodoros: newCompletedPomodoros
          }
        });

        // Check if all pomodoros are completed
        if (newCompletedPomodoros >= selectedTask.estimatedPomodoros) {
          setTaskToComplete({ ...selectedTask, completedPomodoros: newCompletedPomodoros });
          setShowTaskCompleteDialog(true);
        }

        toast({
          title: 'Pomodoro completed!',
          description: `${newCompletedPomodoros}/${selectedTask.estimatedPomodoros} pomodoros completed for "${selectedTask.title}"`,
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to complete session.',
          variant: 'destructive',
        });
      }
    }

    resetTimer();
    setSelectedTask(null);
    setSelectedTaskId('');
  };

  const handleReset = async () => {
    if (sessionId) {
      try {
        await updateSessionMutation.mutateAsync({
          id: sessionId,
          status: 'cancelled'
        });
      } catch (error: any) {
        console.error('Failed to update session status:', error);
      }
    }

    resetTimer();
    setSelectedTask(null);
    setSelectedTaskId('');
  };

  const handleMarkTaskComplete = async () => {
    if (taskToComplete) {
      try {
        await updateTaskMutation.mutateAsync({
          id: taskToComplete.id,
          updates: {
            isCompleted: true
          }
        });
        
        toast({
          title: 'Task completed!',
          description: `"${taskToComplete.title}" has been marked as complete.`,
        });
        
        setSelectedTask(null);
        setSelectedTaskId('');
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Failed to mark task as complete.',
          variant: 'destructive',
        });
      }
    }
    setShowTaskCompleteDialog(false);
    setTaskToComplete(null);
  };

  const handleAddMorePomodoros = async () => {
    if (taskToComplete) {
      try {
        await updateTaskMutation.mutateAsync({
          id: taskToComplete.id,
          updates: {
            estimatedPomodoros: taskToComplete.estimatedPomodoros + 1
          }
        });
        
        toast({
          title: 'Pomodoros updated!',
          description: `Added 1 more pomodoro to "${taskToComplete.title}".`,
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Failed to update pomodoros.',
          variant: 'destructive',
        });
      }
    }
    setShowTaskCompleteDialog(false);
    setTaskToComplete(null);
  };

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading tasks">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Skip to main content link for accessibility */}
      <a href="#timer-controls" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50">
        Skip to timer controls
      </a>

      <header>
        <h1 className="text-2xl font-bold text-foreground">Pomodoro Timer</h1>
        <p className="text-muted-foreground">Focus on your tasks with the Pomodoro Technique</p>
      </header>

      {/* Timer Display */}
      <Card>
        <CardHeader>
          {selectedTask ? (
            <div>
              <CardTitle className="text-lg">{selectedTask.title}</CardTitle>
              <CardDescription>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <Badge className={
                    selectedTask.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                    selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                  }>
                    {selectedTask.priority} priority
                  </Badge>
                  <span className="text-sm" aria-label={`Completed ${selectedTask.completedPomodoros} out of ${selectedTask.estimatedPomodoros} pomodoros`}>
                    🍅 {selectedTask.completedPomodoros}/{selectedTask.estimatedPomodoros}
                  </span>
                </div>
              </CardDescription>
            </div>
          ) : (
            <CardTitle>Select a task to begin</CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Timer Circle */}
            <div className="relative w-48 h-48 mx-auto" role="timer" aria-label={`Pomodoro timer: ${formatTime(timeRemaining)} remaining`}>
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-border"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`}
                  className={`transition-all duration-1000 ${
                    sessionId ? 'text-primary' : 'text-muted'
                  }`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold" aria-live="polite">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {sessionId ? (isRunning ? 'Focus Time' : 'Paused') : 'Ready to start'}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress 
                value={getProgressPercentage()} 
                className="h-2" 
                aria-label={`Timer progress: ${Math.round(getProgressPercentage())}% complete`}
              />
              <p className="text-sm text-muted-foreground text-center">
                {Math.round(getProgressPercentage())}% complete
              </p>
            </div>

            {/* Controls */}
            <div id="timer-controls" className="flex justify-center space-x-4">
              {!sessionId ? (
                <Button
                  onClick={handleStart}
                  disabled={!selectedTaskId || selectedTaskId === 'no-tasks' || createSessionMutation.isPending}
                  size="lg"
                  className="px-8"
                  aria-describedby="start-session-description"
                >
                  {createSessionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                      <span>Start Session</span>
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button onClick={handlePlayPause} size="lg" variant="outline">
                    {isRunning ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>Resume</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleComplete} 
                    size="lg" 
                    variant="outline"
                    disabled={updateSessionMutation.isPending}
                  >
                    <Square className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Complete</span>
                  </Button>
                  <Button 
                    onClick={handleReset} 
                    size="lg" 
                    variant="outline"
                    disabled={updateSessionMutation.isPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Reset</span>
                  </Button>
                </>
              )}
            </div>
            <div id="start-session-description" className="sr-only">
              {!selectedTaskId || selectedTaskId === 'no-tasks' 
                ? 'Please select a task before starting a Pomodoro session'
                : 'Start a focused Pomodoro session for the selected task'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Task</CardTitle>
          <CardDescription>Choose a task to focus on during your Pomodoro session</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedTaskId}
            onValueChange={setSelectedTaskId}
            disabled={!!sessionId}
          >
            <SelectTrigger aria-label="Select a task to work on">
              <SelectValue placeholder="Choose a task to work on" />
            </SelectTrigger>
            <SelectContent>
              {activeTasks.length === 0 ? (
                <SelectItem value="no-tasks" disabled>No active tasks available</SelectItem>
              ) : (
                activeTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    <div className="flex items-center space-x-2">
                      <span>{task.title}</span>
                      <Badge
                        variant="outline"
                        className={
                          task.priority === 'high' ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-300' :
                          task.priority === 'medium' ? 'border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-300' :
                          'border-green-200 text-green-700 dark:border-green-800 dark:text-green-300'
                        }
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground" aria-label={`${task.completedPomodoros} completed out of ${task.estimatedPomodoros} estimated pomodoros`}>
                        🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to use the Pomodoro Technique</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Choose a task you want to work on</li>
            <li>Set the timer for {profile?.pomodoro_duration || 25} minutes (1 Pomodoro)</li>
            <li>Work on the task until the timer goes off</li>
            <li>Take a short {profile?.short_break_duration || 5}-minute break</li>
            <li>After {profile?.long_break_interval || 4} Pomodoros, take a longer {profile?.long_break_duration || 15}-minute break</li>
          </ol>
        </CardContent>
      </Card>

      {/* Task Completion Dialog */}
      <AlertDialog open={showTaskCompleteDialog} onOpenChange={setShowTaskCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>All Pomodoros Completed!</AlertDialogTitle>
            <AlertDialogDescription>
              You've completed all {taskToComplete?.estimatedPomodoros} pomodoros for "{taskToComplete?.title}". 
              Is this task complete, or do you need more pomodoros to finish it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleAddMorePomodoros}>
              Add More Pomodoros
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkTaskComplete}>
              Mark Task Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimerPage;
