
import { useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { usePomodoroSessions } from '../hooks/usePomodoro';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react';

const AnalyticsPage = () => {
  const { data: tasks = [] } = useTasks();
  const { data: sessions = [] } = usePomodoroSessions();

  const analytics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.isCompleted).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Priority distribution
    const priorityStats = {
      high: tasks.filter(task => task.priority === 'high').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      low: tasks.filter(task => task.priority === 'low').length,
    };

    // Tag distribution
    const tagStats = tasks.reduce((acc, task) => {
      task.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Pomodoro stats
    const completedSessions = sessions.filter(session => session.isCompleted);
    const totalPomodoros = completedSessions.length;
    const totalFocusTime = completedSessions
      .filter(session => session.sessionType === 'work')
      .reduce((total, session) => total + session.duration, 0);

    // Recent activity (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentTasks = tasks.filter(task => 
      new Date(task.createdAt) >= weekAgo
    );

    const recentCompletions = tasks.filter(task => 
      task.isCompleted && new Date(task.updatedAt) >= weekAgo
    );

    const recentPomodoros = sessions.filter(session => 
      session.isCompleted && new Date(session.startedAt) >= weekAgo
    );

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      priorityStats,
      tagStats,
      totalPomodoros,
      totalFocusTime,
      recentTasks: recentTasks.length,
      recentCompletions: recentCompletions.length,
      recentPomodoros: recentPomodoros.length,
    };
  }, [tasks, sessions]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-600">Track your productivity and performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate.toFixed(0)}%</div>
            <Progress value={analytics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pomodoros</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPomodoros}</div>
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
            <div className="text-2xl font-bold">{formatTime(analytics.totalFocusTime)}</div>
            <p className="text-xs text-muted-foreground">
              Total time focused
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
            <CardDescription>Distribution of tasks across priority levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-red-100 text-red-800">High</Badge>
                  <span className="text-sm">{analytics.priorityStats.high} tasks</span>
                </div>
                <div className="flex-1 mx-4">
                  <Progress 
                    value={analytics.totalTasks > 0 ? (analytics.priorityStats.high / analytics.totalTasks) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {analytics.totalTasks > 0 ? Math.round((analytics.priorityStats.high / analytics.totalTasks) * 100) : 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                  <span className="text-sm">{analytics.priorityStats.medium} tasks</span>
                </div>
                <div className="flex-1 mx-4">
                  <Progress 
                    value={analytics.totalTasks > 0 ? (analytics.priorityStats.medium / analytics.totalTasks) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {analytics.totalTasks > 0 ? Math.round((analytics.priorityStats.medium / analytics.totalTasks) * 100) : 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">Low</Badge>
                  <span className="text-sm">{analytics.priorityStats.low} tasks</span>
                </div>
                <div className="flex-1 mx-4">
                  <Progress 
                    value={analytics.totalTasks > 0 ? (analytics.priorityStats.low / analytics.totalTasks) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {analytics.totalTasks > 0 ? Math.round((analytics.priorityStats.low / analytics.totalTasks) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tag Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Tags</CardTitle>
            <CardDescription>Most used tags across your tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.keys(analytics.tagStats).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tags used yet</p>
              ) : (
                Object.entries(analytics.tagStats)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([tag, count]) => (
                    <div key={tag} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{tag}</Badge>
                        <span className="text-sm">{count} tasks</span>
                      </div>
                      <div className="flex-1 mx-4">
                        <Progress 
                          value={analytics.totalTasks > 0 ? (count / analytics.totalTasks) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {analytics.totalTasks > 0 ? Math.round((count / analytics.totalTasks) * 100) : 0}%
                      </span>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
            <CardDescription>Your productivity in the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tasks Created</span>
                <span className="text-2xl font-bold text-blue-600">{analytics.recentTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tasks Completed</span>
                <span className="text-2xl font-bold text-green-600">{analytics.recentCompletions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pomodoros Completed</span>
                <span className="text-2xl font-bold text-orange-600">{analytics.recentPomodoros}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Your overall productivity metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Task Completion</span>
                  <span>{analytics.completionRate.toFixed(1)}%</span>
                </div>
                <Progress value={analytics.completionRate} className="mt-1" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span>Average Pomodoros per Task</span>
                  <span>
                    {analytics.totalTasks > 0 
                      ? (tasks.reduce((sum, task) => sum + task.completedPomodoros, 0) / analytics.totalTasks).toFixed(1)
                      : '0'
                    }
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  You've completed <strong>{analytics.totalPomodoros}</strong> focus sessions,
                  spending <strong>{formatTime(analytics.totalFocusTime)}</strong> in deep work.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
