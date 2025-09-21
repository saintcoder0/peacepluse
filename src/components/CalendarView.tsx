import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  BookText,
  PlusCircle,
  CircleDotDashed, // Icon for in-progress
  Dot, // Icon for journal entry
  Brain, // Icon for stress
  Moon, // Icon for sleep
  Target, // Icon for tasks
  Bot // Icon for AI suggestions
} from "lucide-react";
import { useWellness } from "@/hooks/wellness-context";
import { cn } from "@/lib/utils"; 

// Stress level configuration (matching StressTracker)
const stressOptions = [
  { id: "very-low", label: "Very Low", emoji: "😌", value: 1, color: "text-green-500" },
  { id: "low", label: "Low", emoji: "🙂", value: 2, color: "text-sky-500" },
  { id: "moderate", label: "Moderate", emoji: "😐", value: 3, color: "text-yellow-500" },
  { id: "high", label: "High", emoji: "😰", value: 4, color: "text-orange-500" },
  { id: "very-high", label: "Very High", emoji: "😱", value: 5, color: "text-red-500" },
];

// Sleep quality configuration
const sleepQualityOptions = [
  { value: "excellent", label: "Excellent", emoji: "🤩", color: "text-green-500" },
  { value: "good", label: "Good", emoji: "😊", color: "text-blue-500" },
  { value: "fair", label: "Fair", emoji: "😐", color: "text-yellow-500" },
  { value: "poor", label: "Poor", emoji: "😴", color: "text-red-500" },
];

// Data structure for calendar days
interface DayData {
  date: number;
  isToday: boolean;
  journalEntries: any[];
  habits: any[];
  habitsCompleted: number;
  totalHabitsForDay: number;
  stressEntries: any[];
  sleepEntries: any[];
  todos: any[];
  chatSuggestions: any[];
  completedTasks: number;
}

// --- Helper Component: Habit Progress Ring ---
const HabitProgressRing = ({ completed, total }: { completed: number; total: number }) => {
  if (total === 0) return null;

  const percentage = (completed / total) * 100;
  const circumference = 2 * Math.PI * 12; // 2 * pi * radius
  const offset = circumference - (percentage / 100) * circumference;

  let strokeColor = "text-muted-foreground/50"; // Default/incomplete
  if (percentage > 0 && percentage < 100) strokeColor = "text-yellow-500"; // In progress
  if (percentage === 100) strokeColor = "text-green-500"; // Completed

  return (
    <div className="relative h-7 w-7">
      <svg className="w-full h-full" viewBox="0 0 30 30">
        <circle
          className="text-muted/20"
          strokeWidth="3"
          stroke="currentColor"
          fill="transparent"
          r="12"
          cx="15"
          cy="15"
        />
        <circle
          className={cn("transition-all duration-500", strokeColor)}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="12"
          cx="15"
          cy="15"
          transform="rotate(-90 15 15)"
        />
      </svg>
      {percentage === 100 && <CheckCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />}
    </div>
  );
};


// --- Component: Day Details Sidebar ---
const DayDetailsSidebar = ({ dayData, monthName, year }: { dayData: DayData | null; monthName: string; year: number }) => {
  if (!dayData) {
    return (
      <Card className="h-full flex flex-col items-center justify-center p-6 text-center bg-muted/20 border-dashed transition-all duration-300">
        <CalendarIcon className="h-16 w-16 text-muted-foreground/30 mb-4 transition-transform duration-300 group-hover:scale-110" />
        <h3 className="text-xl font-semibold text-muted-foreground">Select a Day</h3>
        <p className="text-sm text-muted-foreground/80 mt-1">Click on a date to view your wellness log.</p>
      </Card>
    );
  }

  const { 
    date, 
    journalEntries, 
    habits, 
    habitsCompleted, 
    totalHabitsForDay, 
    stressEntries, 
    sleepEntries, 
    todos, 
    chatSuggestions,
    completedTasks
  } = dayData;
  
  const hasData = journalEntries.length > 0 || 
                  totalHabitsForDay > 0 || 
                  stressEntries.length > 0 || 
                  sleepEntries.length > 0 || 
                  todos.length > 0 || 
                  chatSuggestions.length > 0;

  return (
    <Card className="h-full flex flex-col animate-in fade-in-50 duration-500">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {monthName} {date}, {year}
        </CardTitle>
        <div className="text-sm text-muted-foreground space-y-1">
          {totalHabitsForDay > 0 && (
            <p>{habitsCompleted} of {totalHabitsForDay} habits completed</p>
          )}
          {stressEntries.length > 0 && (
            <p>{stressEntries.length} stress log{stressEntries.length > 1 ? 's' : ''}</p>
          )}
          {sleepEntries.length > 0 && (
            <p>{sleepEntries.length} sleep log{sleepEntries.length > 1 ? 's' : ''}</p>
          )}
          {(todos.length + chatSuggestions.length) > 0 && (
            <p>{completedTasks} of {todos.length + chatSuggestions.length} task{(todos.length + chatSuggestions.length) > 1 ? 's' : ''} completed</p>
          )}
        </div>
      </CardHeader>
      
      {/* Added a key here to force re-animation on day change */}
      <CardContent key={date} className="p-6 flex-grow overflow-y-auto animate-in fade-in-50 duration-500">
        {hasData ? (
          <div className="space-y-8">
            {/* Journal Entries Section */}
            {journalEntries.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold tracking-tight flex items-center mb-3">
                  <BookText className="h-5 w-5 mr-3 text-primary" />
                  Journal ({journalEntries.length})
                </h4>
                <div className="space-y-3">
                  {journalEntries.map(entry => (
                    <div key={entry.id} className="p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors duration-200 cursor-pointer">
                      <p className="font-semibold text-sm">{entry.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{entry.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Stress Entries Section */}
            {stressEntries.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold tracking-tight flex items-center mb-3">
                  <Brain className="h-5 w-5 mr-3 text-orange-500" />
                  Stress Logs ({stressEntries.length})
                </h4>
                <div className="space-y-3">
                  {stressEntries.map(entry => {
                    const stressData = stressOptions.find(s => s.id === entry.stressLevel);
                    const isAutoDetected = entry.note && entry.note.includes('Auto-detected from chat');
                    return (
                      <div key={entry.id} className={`p-4 rounded-lg border transition-colors duration-200 ${
                        isAutoDetected ? 'border-primary/50 bg-primary/5' : 'bg-background hover:bg-muted/50'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{stressData?.emoji}</span>
                          <span className="font-semibold text-sm">{stressData?.label}</span>
                          {isAutoDetected && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                              AI Detected
                            </span>
                          )}
                        </div>
                        {entry.note && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {entry.note.replace('Auto-detected from chat: ', '')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Sleep Entries Section */}
            {sleepEntries.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold tracking-tight flex items-center mb-3">
                  <Moon className="h-5 w-5 mr-3 text-blue-500" />
                  Sleep Logs ({sleepEntries.length})
                </h4>
                <div className="space-y-3">
                  {sleepEntries.map(entry => {
                    const qualityData = sleepQualityOptions.find(q => q.value === entry.quality);
                    return (
                      <div key={entry.id} className="p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors duration-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{qualityData?.emoji}</span>
                          <span className="font-semibold text-sm">{qualityData?.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.bedtime && entry.wakeupTime && (
                            <p>Sleep: {entry.bedtime} - {entry.wakeupTime}</p>
                          )}
                          {entry.duration && <p>Duration: {entry.duration} hours</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Tasks Section (Todos + Chat Suggestions) */}
            {(todos.length > 0 || chatSuggestions.length > 0) && (
              <div>
                <h4 className="text-lg font-semibold tracking-tight flex items-center mb-3">
                  <Target className="h-5 w-5 mr-3 text-green-500" />
                  Tasks ({todos.length + chatSuggestions.length})
                </h4>
                <div className="space-y-2">
                  {todos.map(todo => (
                    <div key={todo.id} className="flex items-center space-x-3 p-3 text-sm rounded-lg border bg-background hover:bg-muted/50 transition-colors duration-200">
                      {todo.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <CircleDotDashed className="h-4 w-4 text-muted-foreground/70 flex-shrink-0" />
                      )}
                      <span className={cn("flex-grow", todo.completed && 'line-through text-muted-foreground')}>
                        {todo.title}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {todo.category}
                      </span>
                    </div>
                  ))}
                  {chatSuggestions.map(suggestion => (
                    <div key={suggestion.id} className="flex items-center space-x-3 p-3 text-sm rounded-lg border border-dashed border-primary/40 bg-primary/5 transition-colors duration-200">
                      {suggestion.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <CircleDotDashed className="h-4 w-4 text-muted-foreground/70 flex-shrink-0" />
                      )}
                      <span className={cn("flex-grow", suggestion.completed && 'line-through text-muted-foreground')}>
                        {suggestion.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Bot className="h-3 w-3 text-primary" />
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                          AI Suggested
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Habits Section */}
            {habits.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold tracking-tight flex items-center mb-3">
                   <CheckCircle className="h-5 w-5 mr-3 text-primary" />
                   Daily Habits ({habits.length})
                </h4>
                <div className="space-y-2">
                  {habits.map(habit => (
                    <div key={habit.id} className="flex items-center space-x-3 p-3 text-sm rounded-lg border bg-background hover:bg-muted/50 transition-colors duration-200">
                      {habit.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <CircleDotDashed className="h-5 w-5 text-muted-foreground/70 flex-shrink-0" />
                      )}
                      <span className={cn("flex-grow", habit.completed && 'line-through text-muted-foreground')}>
                        {habit.name}
                      </span>
                       <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap font-medium">
                        {habit.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center h-full flex flex-col justify-center items-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No Logged Activity</h3>
            <p className="text-sm text-muted-foreground max-w-xs">You haven't logged any wellness data for this day.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


// --- Main CalendarView Component ---
export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { 
    journalEntries = [], 
    habits = [], 
    stressEntries = [], 
    sleepEntries = [], 
    todos = [], 
    chatSuggestions = [] 
  } = useWellness();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };
  
  const handleDayClick = (day: number) => setSelectedDate(new Date(year, month, day));
  
  const calendarData = useMemo(() => {
    const data = new Map<number, DayData>();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      // Create dateString in local timezone to match entry timestamps
      const dateString = `${year.toString().padStart(4, '0')}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Journal entries for this day
      const dayJournalEntries = journalEntries.filter(e => {
        if (!e.date) return false;
        // Convert journal entry date to local date string for comparison
        const journalLocalDate = new Date(e.date).toLocaleDateString('en-CA'); // YYYY-MM-DD format
        return journalLocalDate === dateString;
      });
      
      // Habits for this day (since habits don't have dateCompleted, we'll show all current habits)
      const dayHabits = habits.filter(h => {
        // For now, show all active habits since we don't track daily completion dates
        // In a real implementation, you'd want to track daily habit completions
        return true;
      });
      const habitsCompleted = dayHabits.filter(h => h.completed).length;
      
      // Stress entries for this day
      const dayStressEntries = stressEntries.filter(e => {
        const entryDate = e.date || e.timestamp;
        if (!entryDate) return false;
        // Convert entry timestamp to local date string for comparison
        const entryLocalDate = new Date(entryDate).toLocaleDateString('en-CA'); // YYYY-MM-DD format
        return entryLocalDate === dateString;
      });
      
      // Sleep entries for this day
      const daySleepEntries = sleepEntries.filter(e => {
        if (!e.date) return false;
        // Convert sleep entry date to local date string for comparison
        const sleepLocalDate = new Date(e.date).toLocaleDateString('en-CA'); // YYYY-MM-DD format
        return sleepLocalDate === dateString;
      });
      
      // Todos for this day (both created and completed)
      const dayTodos = todos.filter(t => {
        // Include tasks created on this day
        const createdOnThisDay = t.createdAt && new Date(t.createdAt).toLocaleDateString('en-CA') === dateString;
        // Include tasks completed on this day
        const completedOnThisDay = t.completed && t.completedAt && new Date(t.completedAt).toLocaleDateString('en-CA') === dateString;
        return createdOnThisDay || completedOnThisDay;
      });
      
      // Chat suggestions for this day (both created and completed)
      const dayChatSuggestions = chatSuggestions.filter(s => {
        const suggestionDate = s.createdAt || s.timestamp;
        // Include suggestions created on this day
        const createdOnThisDay = suggestionDate && new Date(suggestionDate).toLocaleDateString('en-CA') === dateString;
        // Include suggestions completed on this day
        const completedOnThisDay = s.completed && s.completedAt && new Date(s.completedAt).toLocaleDateString('en-CA') === dateString;
        return createdOnThisDay || completedOnThisDay;
      });
      
      // Calculate completed tasks count (only tasks completed on this specific day)
      const completedTasksCount = dayTodos.filter(t => 
        t.completed && t.completedAt && new Date(t.completedAt).toLocaleDateString('en-CA') === dateString
      ).length + dayChatSuggestions.filter(s => 
        s.completed && s.completedAt && new Date(s.completedAt).toLocaleDateString('en-CA') === dateString
      ).length;

      data.set(day, {
        date: day,
        isToday: date.toDateString() === new Date().toDateString(),
        journalEntries: dayJournalEntries,
        habits: dayHabits,
        habitsCompleted: habitsCompleted,
        totalHabitsForDay: dayHabits.length,
        stressEntries: dayStressEntries,
        sleepEntries: daySleepEntries,
        todos: dayTodos,
        chatSuggestions: dayChatSuggestions,
        completedTasks: completedTasksCount
      });
    }
    return data;
  }, [journalEntries, habits, stressEntries, sleepEntries, todos, chatSuggestions, year, month, daysInMonth]);

  const selectedDayData = selectedDate && selectedDate.getMonth() === month && selectedDate.getFullYear() === year
    ? calendarData.get(selectedDate.getDate()) || null
    : null;

  return (
    <div className="wellness-enter max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="text-center animate-in fade-in-50 duration-500">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-secondary-foreground/80 bg-clip-text text-transparent">
          My Wellness Calendar
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">A complete overview of your journal entries and habit progression.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 lg:gap-8">
        {/* --- Left Column: Day Details Sidebar --- */}
        <div className="lg:col-span-1 animate-in fade-in-50 slide-in-from-left-4 duration-700 delay-200">
          <DayDetailsSidebar dayData={selectedDayData} monthName={monthNames[month]} year={year} />
        </div>

        {/* --- Right Column: Calendar Grid --- */}
        <div className="lg:col-span-1 animate-in fade-in-50 slide-in-from-right-4 duration-700 delay-200">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <h2 className="text-2xl font-bold">{monthNames[month]} {year}</h2>
              <div className="flex items-center space-x-2">
                <Button onClick={goToToday} variant="outline" size="sm">Today</Button>
                <div className="flex space-x-1">
                  <Button onClick={goToPreviousMonth} variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
                  <Button onClick={goToNextMonth} variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-muted-foreground border-b pb-2 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayData = calendarData.get(day);
                  if (!dayData) return null;

                  const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month;
                  
                  // Get stress level for the day (latest entry)
                  const latestStressEntry = dayData.stressEntries.length > 0 
                    ? dayData.stressEntries[dayData.stressEntries.length - 1] 
                    : null;
                  const stressData = latestStressEntry 
                    ? stressOptions.find(s => s.id === latestStressEntry.stressLevel) 
                    : null;
                  
                  // Get sleep quality for the day (latest entry)
                  const latestSleepEntry = dayData.sleepEntries.length > 0 
                    ? dayData.sleepEntries[dayData.sleepEntries.length - 1] 
                    : null;
                  const sleepData = latestSleepEntry 
                    ? sleepQualityOptions.find(q => q.value === latestSleepEntry.quality) 
                    : null;
                  
                  // Calculate total tasks for the day
                  const totalTasks = dayData.todos.length + dayData.chatSuggestions.length;

                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "relative flex flex-col items-center justify-between p-2 h-32 rounded-lg border text-sm text-left transition-all duration-300 ease-in-out",
                        "transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:z-10",
                        dayData.isToday ? "border-primary/60 bg-primary/5 font-bold" : "border-transparent hover:bg-muted",
                        isSelected ? "bg-primary/10 border-primary shadow-md" : ""
                      )}
                    >
                      <span className={cn("self-start font-medium", dayData.isToday && "text-primary")}>{day}</span>
                      
                      <div className="flex flex-col items-center justify-center gap-1 flex-grow">
                        {/* Journal indicator */}
                        {dayData.journalEntries.length > 0 && (
                          <div className="flex items-center gap-1">
                            <BookText className="h-3 w-3 text-blue-500" />
                            <span className="text-xs">{dayData.journalEntries.length}</span>
                          </div>
                        )}
                        
                        {/* Stress indicator */}
                        {stressData && (
                          <div className="flex items-center gap-1">
                            <Brain className="h-3 w-3 text-orange-500" />
                            <span className="text-xs">{stressData.emoji}</span>
                          </div>
                        )}
                        
                        {/* Sleep indicator */}
                        {sleepData && (
                          <div className="flex items-center gap-1">
                            <Moon className="h-3 w-3 text-blue-600" />
                            <span className="text-xs">{sleepData.emoji}</span>
                          </div>
                        )}
                        
                        {/* Tasks indicator */}
                        {totalTasks > 0 && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-green-500" />
                            <span className="text-xs">{dayData.completedTasks}/{totalTasks}</span>
                          </div>
                        )}
                        
                        {/* Habit progress ring */}
                        <HabitProgressRing completed={dayData.habitsCompleted} total={dayData.totalHabitsForDay} />
                      </div>
                      
                      <div className="h-2"></div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}