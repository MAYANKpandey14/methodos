
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '../hooks/useTasks';
import { usePomodoroSessions } from '../hooks/usePomodoro';
import { CheckSquare, Clock, Target, TrendingUp, Loader2 } from 'lucide-react';

const DashboardPage = () => {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: sessions = [], isLoading: sessionsLoading } = usePomodoroSessions();

  if (tasksLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.isCompleted);
  const pendingTasks = tasks.filter(task => !task.isCompleted);
  const highPriorityTasks = tasks.filter(task => task.priority === 'high' && !task.isCompleted);
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  
  const todaySessions = sessions.filter(session => 
    session.startedAt.toDateString() === new Date().toDateString()
  );
  
  const totalFocusTime = sessions
    .filter(session => session.isCompleted && session.sessionType === 'work')
    .reduce((total, session) => total + session.duration, 0);

  const recentTasks = tasks
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bricolage text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your productivity overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bricolage text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bricolage text-2xl font-bold">{completionRate.toFixed(0)}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Pomodoros</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bricolage text-2xl font-bold">{todaySessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Focus sessions completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bricolage text-2xl font-bold">{Math.round(totalFocusTime / 60)}m</div>
            <p className="text-xs text-muted-foreground">
              Total time focused
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your latest task activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className={`font-medium ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {task.completedPomodoros}/{task.estimatedPomodoros} 🍅
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* High Priority Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>High Priority Tasks</CardTitle>
            <CardDescription>Tasks that need your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highPriorityTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No high priority tasks! Great job! 🎉
                </p>
              ) : (
                highPriorityTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {task.dueDate && (
                          <span className="text-xs text-red-600">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {task.completedPomodoros}/{task.estimatedPomodoros} 🍅
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
