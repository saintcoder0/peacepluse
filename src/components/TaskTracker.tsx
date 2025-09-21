import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, Plus, Trash2, Flame, Calendar, Trophy, Pin } from "lucide-react";
import { useWellness } from "@/hooks/wellness-context";
import { playClickSound, playTaskCompleteSound } from "@/lib/audio";

export function TaskTracker() {
  const [compulsoryTasks, setCompulsoryTasks] = useState([
    { id: "compulsory-1", name: "Meditation", completed: false, category: "mindfulness", isCompulsory: true, streak: 0 },
    { id: "compulsory-2", name: "Breathing", completed: false, category: "mindfulness", isCompulsory: true, streak: 0 },
    { id: "compulsory-3", name: "Journaling", completed: false, category: "reflection", isCompulsory: true, streak: 0 },
  ]);
  const { habits, addHabit, toggleHabit, deleteHabit, getDailyHabitCompletions, todos, toggleTodo, deleteTodo, chatSuggestions, setChatSuggestions, clearChatSuggestions, removeChatSuggestion, toggleChatSuggestion } = useWellness();
  const [newTask, setNewTask] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const pinnedTasks = useMemo(() => habits.filter((h) => h.isPermanent), [habits]);
  const userTasks = useMemo(() => habits.filter((h) => !h.isPermanent), [habits]);
  const allPinnedTasks = [...compulsoryTasks, ...pinnedTasks];

  const allTasks = [
    ...allPinnedTasks, 
    ...userTasks, 
    ...(Array.isArray(todos) ? todos : []),
    ...(Array.isArray(chatSuggestions) ? chatSuggestions : [])
  ];
  const completedCount = allTasks.filter((h) => h && h.completed).length;
  const totalTasks = allTasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const handleAdd = () => {
    if (!newTask.trim()) return;
    const added = addHabit(newTask.trim(), "health");
    if (added) {
      playTaskCompleteSound();
      setNewTask("");
      setShowAdd(false);
    }
  };

  const toggleCompulsoryTask = (id) => {
    setCompulsoryTasks(
      compulsoryTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <div className="wellness-enter">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold mb-1">Task Tracker</h1>
          <p className="text-muted-foreground">Stay consistent with small, focused tasks</p>
        </div>

        {/* Minimal Progress - compact and animated */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold mb-1">Today's Progress</h2>
              <p className="text-sm text-card-foreground/80">{completedCount} of {totalTasks} tasks</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completionPercentage}%</div>
            </div>
          </div>
          <div className="mt-3 w-40 sm:w-56 bg-card-foreground/20 rounded-full h-1 overflow-hidden">
            <div
              className="bg-card-foreground h-1 rounded-full transition-[width] duration-500 ease-out relative"
              style={{ width: `${completionPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>
        </Card>

        {/* Permanent (Pinned) Tasks */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Pin className="h-5 w-5" /> Pinned Tasks
            </h2>
          </div>
          <div className="space-y-3">
            {allPinnedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-xl border border-border/60 bg-muted/20">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => {
                      if (!task.completed) {
                        playTaskCompleteSound();
                      } else {
                        playClickSound();
                      }
                      task.isCompulsory
                        ? toggleCompulsoryTask(task.id)
                        : toggleHabit(task.id);
                    }}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Flame className="h-3.5 w-3.5 text-orange-500" />
                      <span>{task.streak} day streak</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Today's Tasks - Chat suggestions and user tasks */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Today's Tasks
            </h2>
            <Button size="sm" onClick={() => setShowAdd(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Task
            </Button>
          </div>

          {showAdd && (
            <div className="mb-4 p-3 rounded-xl bg-muted/30 border border-border">
              <div className="flex gap-2">
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Enter new task..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button size="sm" onClick={handleAdd}>Add</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {userTasks.length === 0 && (!todos || todos.length === 0) && (!chatSuggestions || chatSuggestions.length === 0) && (
              <p className="text-sm text-muted-foreground">No tasks yet. Add one to get started or chat with the AI for suggestions.</p>
            )}

            {/* AI-suggested tasks from chatbot */}
            {chatSuggestions && chatSuggestions.length > 0 && (
              <>
                <div className="mb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      AI Suggested Tasks
                    </h3>
                    {chatSuggestions.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={clearChatSuggestions}
                        className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
                {chatSuggestions.map((task, index) => (
                  <div key={`chat-${task.id}`} className="flex items-center justify-between py-2 px-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => {
                          if (!task.completed) {
                            playTaskCompleteSound();
                          } else {
                            playClickSound();
                          }
                          toggleChatSuggestion(task.id);
                        }}
                        className="w-5 h-5"
                      />
                      <div>
                        <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.name}
                          <span className="ml-2 text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                            AI Suggested
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{task.streak || 0} day streak</span>
                          <span className="text-primary">• From ChatBot Analysis</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeChatSuggestion(task.id)}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                      title="Remove suggestion"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {(chatSuggestions.length > 0 && (todos.length > 0 || userTasks.length > 0)) && (
                  <div className="border-t border-dashed border-border/40 my-3"></div>
                )}
              </>
            )}

            {/* Exercise/Activity tasks from chatbot analysis */}
            {todos && todos.length > 0 && (
              <>
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Exercise & Activities
                  </h3>
                </div>
                {todos.map((todo) => (
                  <div key={todo.id} className="flex items-center justify-between py-2 px-3 rounded-xl border border-border/60 bg-blue-50/50 hover:bg-blue-50 transition-colors dark:bg-blue-950/20 dark:hover:bg-blue-950/30">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="w-5 h-5"
                      />
                      <div>
                        <div className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {todo.title}
                          <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/50 dark:text-blue-300">
                            Exercise/Activity
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Added {new Date(todo.createdAt).toLocaleDateString()}</span>
                          <span className="text-blue-600">• From AI Analysis</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteTodo(todo.id)}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                      title="Remove task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {todos.length > 0 && userTasks.length > 0 && (
                  <div className="border-t border-dashed border-border/40 my-3"></div>
                )}
              </>
            )}

            {/* User-added tasks */}
            {userTasks.length > 0 && (
              <>
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                    Your Tasks
                  </h3>
                </div>
                {userTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-xl border border-border/60 hover:bg-muted/20 transition">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleHabit(task.id)}
                        className="w-5 h-5"
                      />
                      <div>
                        <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{task.streak} day streak</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteHabit(task.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-6 w-6 p-0"
                      title="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>

        {/* Streak Bar - GitHub-like */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" /> Streak Bar
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>Last 30 days</span>
            </div>
          </div>

          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(30, 1fr)' }}>
            {getDailyHabitCompletions(30).map((day, index) => {
              const completionRate = day.totalHabits > 0 ? day.habitIds.length / day.totalHabits : 0;
              const isToday = index === 29;

              let bg = "bg-gray-200";
              if (completionRate === 1) bg = "bg-green-600";
              else if (completionRate >= 0.66) bg = "bg-green-500";
              else if (completionRate >= 0.33) bg = "bg-green-300";
              else if (completionRate > 0) bg = "bg-green-200";
              else if (isToday) bg = "bg-blue-200";

              return (
                <div
                  key={day.date}
                  className={`w-3 h-3 rounded-[2px] ${bg} hover:scale-125 transition-transform cursor-pointer relative group`}
                  title={`${day.date}: ${day.habitIds.length}/${day.totalHabits} tasks completed`}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {day.date}: {day.habitIds.length}/{day.totalHabits} tasks
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}