import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Target, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Trophy, 
  Flame,
  Pin,
  PinOff,
  Trash2
} from "lucide-react";
import { useWellness } from "@/hooks/wellness-context";
import { playClickSound, playTaskCompleteSound } from "@/lib/audio";

interface Task {
  id: string;
  name: string;
  completed: boolean;
}

const categoryColors = {
  mindfulness: "accent",
  health: "primary",
  reflection: "secondary",
  exercise: "stress-low",
  learning: "stress-very-low",
};

export function HabitTracker() {
  const [newHabitName, setNewHabitName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { habits, addHabit, toggleHabit, deleteHabit, getDailyHabitCompletions, tasks, toggleTask, deleteTask, pinnedTasks, pinTask, unpinTask } = useWellness();

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      addHabit(newHabitName.trim(), "health");
      playTaskCompleteSound();
      setNewHabitName("");
      setShowAddForm(false);
    }
  };

  const completedCount = (habits?.filter(h => h.completed) || []).length;
  const totalHabits = habits?.length || 0;
  const completionPercentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  return (
    <div className="space-y-6 wellness-enter">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Habit Tracker</h1>
        <p className="text-muted-foreground">Build healthy habits, one day at a time</p>
      </div>

      {/* Progress Overview */}
      <Card className="wellness-card">
        <div className="flex items-center justify-between text-card-foreground">
          <div>
            <h2 className="text-xl font-semibold mb-2">Today's Progress</h2>
            <p className="text-card-foreground/90">{completedCount} of {totalHabits} habits completed</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{completionPercentage}%</div>
            <div className="text-card-foreground/90">Complete</div>
          </div>
        </div>
        <div className="mt-4 bg-card-foreground/20 rounded-full h-2">
          <div 
            className="bg-card-foreground rounded-full h-2 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </Card>

      {/* Pinned Tasks */}
      <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-400 shadow-lg">
  <h2 className="text-2xl font-bold flex items-center mb-4 text-yellow-800">
    <Pin className="h-6 w-6 mr-3 text-yellow-600" />
    Pinned Tasks
  </h2>
  {(!pinnedTasks || pinnedTasks.length === 0) && (
    <p className="text-yellow-700/80 italic">No tasks have been pinned yet.</p>
  )}
  <div className="space-y-3">
    {(pinnedTasks || []).map((task) => (
      <div key={task.id} className="flex items-center justify-between p-4 border-l-4 border-yellow-500 rounded-lg bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-300">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => {
            if (!task.completed) {
              playTaskCompleteSound();
            } else {
              playClickSound();
            }
            toggleTask(task.id);
          }}
          className="w-6 h-6 rounded-full border-2 border-yellow-500 focus:ring-yellow-400"
        />
        <span className={`flex-1 mx-4 font-semibold text-lg ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {task.name}
        </span>
        <Button
          onClick={() => unpinTask(task.id)}
          variant="ghost"
          size="icon"
          className="text-yellow-600 hover:bg-yellow-200/50 rounded-full h-10 w-10 transition-colors duration-300"
        >
          <PinOff className="h-5 w-5" />
        </Button>
      </div>
    ))}
  </div>
</Card>

      {/* Today's Tasks */}
      <Card className="p-6 bg-white/50 backdrop-blur-md border shadow-lg">
  <h2 className="text-2xl font-bold flex items-center mb-4 text-gray-800">
    <Target className="h-6 w-6 mr-3 text-primary" />
    Today's Tasks
  </h2>
  {(!tasks || tasks.length === 0) && (
    <p className="text-gray-500 italic">No tasks scheduled for today. Enjoy your day!</p>
  )}
  <div className="space-y-3">
    {(tasks || []).map((task) => (
      <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 bg-white/70 shadow-md">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => {
            if (!task.completed) {
              playTaskCompleteSound();
            } else {
              playClickSound();
            }
            toggleTask(task.id);
          }}
          className="w-6 h-6 rounded-full border-2 border-gray-300 focus:ring-primary/50"
        />
        <span className={`flex-1 mx-4 font-medium text-lg ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {task.name}
        </span>
        <Button
          onClick={() => pinTask(task.id)}
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-yellow-500 hover:bg-yellow-100/50 rounded-full h-10 w-10 transition-colors duration-300"
        >
          <Pin className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => deleteTask(task.id)}
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-red-500 hover:bg-red-100/50 rounded-full h-10 w-10 transition-colors duration-300"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    ))}
  </div>
</Card>

      {/* Habits List */}
      <Card className="p-6 bg-white/50 backdrop-blur-md border shadow-lg">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold flex items-center text-gray-800">
      <Target className="h-6 w-6 mr-3 text-primary" />
      Today's Habits
    </h2>
    <Button
      onClick={() => setShowAddForm(!showAddForm)}
      size="lg"
      className="flex items-center space-x-2 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <Plus className="h-5 w-5" />
      <span>{showAddForm ? 'Cancel' : 'Add Habit'}</span>
    </Button>
  </div>

  {/* Add Habit Form */}
  {showAddForm && (
    <div className="mb-6 p-6 rounded-2xl bg-primary/10 border-2 border-primary/20 shadow-inner">
      <div className="flex flex-col space-y-4">
        <Input
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="e.g., Drink 8 glasses of water"
          className="h-12 text-lg rounded-lg"
          onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
        />
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button onClick={handleAddHabit} size="lg" className="rounded-full">
              Add Habit
            </Button>
            <Button 
              onClick={() => setShowAddForm(false)} 
              variant="ghost" 
              size="lg"
              className="rounded-full"
            >
              Cancel
            </Button>
          </div>
          <div className="text-sm text-gray-500">Press Enter to add</div>
        </div>
      </div>
      {/* Quick Add Suggestions */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">Or quick-add a suggestion:</h4>
        <div className="flex flex-wrap gap-2">
          {["Meditate for 10 minutes", "Go for a 20-minute walk", "Read a chapter of a book", "Drink a glass of water"].map(suggestion => (
            <Button 
              key={suggestion}
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                addHabit(suggestion, "health");
                playTaskCompleteSound();
              }}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* Habits */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {(habits || []).map((habit) => (
      <Card key={habit.id} className="p-5 hover:shadow-2xl transition-all duration-300 group rounded-2xl border-2 hover:border-primary/60">
        <div className="flex flex-col h-full">
          {/* Header with checkbox and delete */}
          <div className="flex items-start justify-between mb-4">
            <Checkbox
              checked={habit.completed}
              onCheckedChange={() => {
                if (!habit.completed) {
                  playTaskCompleteSound();
                } else {
                  playClickSound();
                }
                toggleHabit(habit.id);
              }}
              className="w-7 h-7 rounded-full border-2 border-gray-300 group-hover:border-primary/80 transition-colors duration-300"
            />
            <Button
              onClick={() => deleteHabit(habit.id)}
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-100/50 rounded-full h-9 w-9 duration-300"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Habit name */}
          <div className={`font-bold text-xl mb-3 ${habit.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {habit.name}
          </div>
          
          {/* Category and streak info */}
          <div className="mt-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${categoryColors[habit.category as keyof typeof categoryColors]}/20 text-${categoryColors[habit.category as keyof typeof categoryColors]}`}>
                {habit.category}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-md text-gray-500">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">{habit.streak} day streak</span>
            </div>
          </div>
        </div>
      </Card>
    ))}
  </div>
</Card>

      {/* Streak Bar - Daily Habit Completion */}
      <Card className="p-6 bg-gradient-to-br from-orange-100 to-red-200 border-2 border-orange-300 shadow-lg">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold flex items-center text-orange-800">
      <Flame className="h-6 w-6 mr-3 text-orange-600" />
      Habit Streak
    </h2>
    <div className="flex items-center space-x-2 text-sm text-orange-700/80">
      <Trophy className="h-5 w-5 text-yellow-500" />
      <span className="font-semibold">Last 30 days</span>
    </div>
  </div>
  
  <div className="space-y-5">
    {/* Current Streak Info */}
    <div className="flex items-center justify-around p-5 bg-white/70 backdrop-blur-sm rounded-2xl shadow-md">
      <div className="text-center">
        <p className="text-lg font-semibold text-orange-600">Current Streak</p>
        <p className="text-4xl font-bold text-orange-700">
          {(habits && habits.length > 0) ? Math.max(...habits.map(h => h.streak)) : 0} days
        </p>
      </div>
      <div className="border-l-2 border-orange-200 h-16 mx-4"></div>
      <div className="text-center">
        <p className="text-lg font-semibold text-orange-600">Best Streak</p>
        <p className="text-4xl font-bold text-orange-700">
          {(habits && habits.length > 0) ? Math.max(...habits.map(h => h.streak)) : 0} days
        </p>
      </div>
    </div>

    {/* Streak Grid */}
    <div className="grid gap-2 p-4 bg-white/50 rounded-2xl shadow-inner" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
      {getDailyHabitCompletions(30).map((day, index) => {
        const completionRate = day.totalHabits > 0 ? day.habitIds.length / day.totalHabits : 0;
        const isToday = index === 29;
        
        let bgColor = "bg-gray-200/70";
        if (completionRate === 1) bgColor = "bg-green-500 shadow-lg";
        else if (completionRate >= 0.5) bgColor = "bg-green-400";
        else if (completionRate > 0) bgColor = "bg-green-300";
        else if (isToday) bgColor = "bg-blue-300 shadow-lg";
        
        return (
          <div
            key={day.date}
            className={`w-full h-8 rounded-lg ${bgColor} hover:scale-110 transition-transform duration-200 cursor-pointer relative group border-2 border-white/50`}
            title={`${day.date}: ${day.habitIds.length}/${day.totalHabits} habits completed`}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
              {day.date}: {day.habitIds.length}/{day.totalHabits} habits
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800"></div>
            </div>
          </div>
        );
      })}
    </div>
    
    {/* Legend */}
    <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600 mt-4">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-gray-200/70 rounded-md border"></div>
        <span>No habits</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-green-300 rounded-md"></div>
        <span>Some</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-green-400 rounded-md"></div>
        <span>Most</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-green-500 rounded-md"></div>
        <span>All habits</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-blue-300 rounded-md"></div>
        <span>Today</span>
      </div>
    </div>
  </div>
</Card>
    </div>
  );
}