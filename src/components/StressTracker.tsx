import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, TrendingUp, BarChart3, Clock, Plus, Brain, ArrowUp, ArrowDown, ArrowRight } from "lucide-react";
import { useWellness } from "@/hooks/wellness-context";

// --- Data & Types (No changes here) ---
const stressOptions = [
  { 
    id: "very-low", 
    label: "Very Low", 
    emoji: "😌", 
    description: "Feeling calm & relaxed",
    value: 1,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-300 dark:border-green-700",
    textColor: "text-green-700 dark:text-green-300",
    gradient: "from-green-400 to-cyan-400"
  },
  { 
    id: "low", 
    label: "Low", 
    emoji: "🙂", 
    description: "Generally at ease",
    value: 2,
    bgColor: "bg-sky-100 dark:bg-sky-900/30",
    borderColor: "border-sky-300 dark:border-sky-700",
    textColor: "text-sky-700 dark:text-sky-300",
    gradient: "from-sky-400 to-blue-400"
  },
  { 
    id: "moderate", 
    label: "Moderate", 
    emoji: "😐", 
    description: "Slightly on edge",
    value: 3,
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-300 dark:border-yellow-600",
    textColor: "text-yellow-700 dark:text-yellow-300",
    gradient: "from-yellow-400 to-amber-400"
  },
  { 
    id: "high", 
    label: "High", 
    emoji: "😰", 
    description: "Feeling overwhelmed",
    value: 4,
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-300 dark:border-orange-600",
    textColor: "text-orange-700 dark:text-orange-300",
    gradient: "from-orange-400 to-red-400"
  },
  { 
    id: "very-high", 
    label: "Very High", 
    emoji: "😱", 
    description: "Extremely stressed",
    value: 5,
    bgColor: "bg-red-100 dark:bg-red-900/30",
    borderColor: "border-red-300 dark:border-red-600",
    textColor: "text-red-700 dark:text-red-300",
    gradient: "from-red-500 to-rose-500"
  },
];

const recentStressEntries = [
  { date: "2025-09-13T10:00:00.000Z", stressLevel: "moderate", note: "Had a productive day at work, but the commute was tiring." },
  { date: "2025-09-12T10:00:00.000Z", stressLevel: "low", note: "Great time with friends over dinner." },
  { date: "2025-09-11T10:00:00.000Z", stressLevel: "high", note: "Feeling a bit overwhelmed with the upcoming project deadline." },
];

// --- Main Component ---
export function StressTracker() {
  const [selectedStressLevel, setSelectedStressLevel] = useState<string>("");
  const [note, setNote] = useState("");
  const { addStressEntry, stressHistory = [] } = useWellness();

  // --- Logic & Handlers (No changes here, just cleaner organization) ---
  const handleSubmit = () => {
    if (selectedStressLevel) {
      addStressEntry(selectedStressLevel as any, note);
      setSelectedStressLevel("");
      setNote("");
    }
  };

  const handleStressSelect = (stressId: string) => {
    // Allow deselecting by clicking the same level again
    setSelectedStressLevel(prev => (prev === stressId ? "" : stressId));
  };

  // --- Derived State & Calculations (No changes here) ---
  const totalEntries = stressHistory.length;
  const averageStressValue = totalEntries > 0 
    ? stressHistory.reduce((acc, entry) => {
        const stress = stressOptions.find(s => s.id === entry.stressLevel);
        return acc + (stress ? stress.value : 3);
      }, 0) / totalEntries
    : 3; // Default to moderate if no entries
  const averageStressLevel = stressOptions[Math.round(averageStressValue) - 1];

  const getStressTrend = () => {
    if (stressHistory.length < 2) return { status: "stable", icon: <ArrowRight className="h-5 w-5" /> };
    const recentEntries = stressHistory.slice(0, 3).reverse();
    const last = stressOptions.find(s => s.id === recentEntries[recentEntries.length - 1]?.stressLevel)?.value ?? 3;
    const first = stressOptions.find(s => s.id === recentEntries[0]?.stressLevel)?.value ?? 3;
    
    if (last < first) return { status: "improving", icon: <ArrowDown className="h-5 w-5 text-green-500" /> };
    if (last > first) return { status: "worsening", icon: <ArrowUp className="h-5 w-5 text-red-500" /> };
    return { status: "stable", icon: <ArrowRight className="h-5 w-5" /> };
  };
  
  const trend = getStressTrend();

  const generateChartData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Handle both date formats (for compatibility with ChatBot entries)
      const entry = stressHistory.find((e: any) => {
        const entryDate = e.date || e.timestamp;
        return entryDate && entryDate.startsWith(dateStr);
      });
      
      const stressValue = entry ? stressOptions.find(s => s.id === entry.stressLevel)?.value : null;
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        stress: stressValue,
      });
    }
    return data;
  };

  const chartData = generateChartData();
  const entriesForList = stressHistory.length > 0 ? stressHistory : recentStressEntries;

  // --- Render JSX ---
  return (
    <div className="wellness-enter max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center animate-in fade-in-50 duration-500">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-secondary-foreground/80 bg-clip-text text-transparent">
          Stress Companion
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Log your daily stress levels to understand your emotional patterns and build resilience.
        </p>
      </div>

      {/* Main Stress Logging Card */}
      <Card className="p-6 md:p-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700 relative overflow-hidden">
         {/* Background Gradient */}
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-background to-background -z-10"></div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            How are you feeling right now?
          </h2>
        </div>

        {/* Stress Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
          {stressOptions.map((stress) => (
            <button
              key={stress.id}
              onClick={() => handleStressSelect(stress.id)}
              className={`
                group p-4 rounded-2xl text-center border-2 transition-all duration-300 ease-in-out
                transform hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                ${selectedStressLevel === stress.id 
                  ? `${stress.bgColor} ${stress.borderColor} shadow-lg scale-105` 
                  : "bg-background/50 border-border hover:border-muted-foreground/40"
                }
              `}
            >
              <div className="text-5xl mb-3 transition-transform duration-300 group-hover:scale-110">
                {stress.emoji}
              </div>
              <div className={`font-semibold mb-1 ${selectedStressLevel === stress.id ? stress.textColor : ''}`}>
                {stress.label}
              </div>
              <div className={`text-xs transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${selectedStressLevel === stress.id ? `${stress.textColor} opacity-100` : 'text-muted-foreground'}`}>
                {stress.description}
              </div>
            </button>
          ))}
        </div>

        {/* Note Input & Submit Button - Animated */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${selectedStressLevel ? "max-h-96 opacity-100 pt-6" : "max-h-0 opacity-0"}`}>
          <div className="space-y-4">
            <label className="text-lg font-medium">Add a note (optional)</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's on your mind? What might be contributing to this feeling?"
              className="min-h-[100px] resize-none text-base"
            />
            <Button 
              onClick={handleSubmit}
              disabled={!selectedStressLevel}
              className="w-full text-lg py-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Log My Current Stress
            </Button>
          </div>
        </div>
      </Card>

      {/* Dashboard Grid - Stats & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Statistics Column */}
        <div className="space-y-6 animate-in fade-in-50 slide-in-from-left-4 duration-700 delay-200">
            {/* Overview Card */}
            <Card className="group relative p-6 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Overview</h3>
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1 text-center p-4 rounded-xl bg-muted/50">
                        <div className="text-4xl font-bold text-primary">{totalEntries}</div>
                        <div className="text-sm text-muted-foreground">Total Logs</div>
                    </div>
                    <div className="flex-1 text-center p-4 rounded-xl bg-muted/50">
                        <div className="text-4xl">{averageStressLevel.emoji}</div>
                        <div className="text-sm text-muted-foreground">Avg. Stress</div>
                    </div>
                </div>
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-center text-primary font-medium p-4">Your average stress level is '{averageStressLevel.label}'.</p>
                </div>
            </Card>

            {/* Trend Card */}
            <Card className="group relative p-6 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Recent Trend</h3>
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/50 flex items-center justify-center gap-4">
                    <div className="text-4xl font-bold">{trend.icon}</div>
                    <div>
                      <div className="text-lg font-semibold capitalize">{trend.status}</div>
                      <div className="text-sm text-muted-foreground">Based on last 3 entries</div>
                    </div>
                </div>
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-center text-primary font-medium p-4">Your stress levels are currently {trend.status}.</p>
                </div>
            </Card>
        </div>

        {/* Trend Chart */}
        <Card className="lg:col-span-2 p-6 animate-in fade-in-50 slide-in-from-right-4 duration-700 delay-200">
            <h2 className="text-xl font-semibold mb-4">Your 14-Day Stress Trend</h2>
            <div className="relative h-64 w-full">
                <div className="grid grid-rows-5 absolute inset-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="border-b border-dashed border-border/50"></div>
                    ))}
                </div>
                <div className="absolute inset-0 flex">
                    {chartData.map((data, i) => (
                        <div key={i} className="flex-1 group relative flex items-end justify-center">
                            {data.stress !== null && (
                                <>
                                    <div 
                                        className="w-1/2 bg-primary/50 rounded-t-lg transition-all duration-300 ease-out group-hover:bg-primary"
                                        style={{ height: `${(data.stress / 5) * 100}%` }}
                                    ></div>
                                    <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        {stressOptions.find(s => s.value === data.stress)?.label}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>14 days ago</span>
                <span>Today</span>
            </div>
        </Card>
      </div>

      {/* Recent Entries List */}
      <Card className="p-6 md:p-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Your Stress Log</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Includes both manual entries and AI-detected stress from chat conversations
            </p>
          </div>
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        
        <div className="space-y-4">
          {entriesForList.slice(0, 5).map((entry: any, index: number) => {
            const stressData = stressOptions.find(s => s.id === entry.stressLevel);
            const isAutoDetected = entry.note && entry.note.includes('Auto-detected from chat');
            
            return (
              <div key={index} className={`flex items-start space-x-4 p-4 rounded-xl border transition-colors duration-200 ${
                isAutoDetected 
                  ? 'border-primary/50 bg-primary/5 hover:bg-primary/10 hover:border-primary/70' 
                  : 'border-border/50 bg-background/30 hover:bg-muted/50 hover:border-primary/50'
              }`}>
                <div className={`text-4xl p-2 rounded-full ${stressData?.bgColor} relative`}>
                  {stressData?.emoji}
                  {isAutoDetected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground">🤖</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${stressData?.bgColor} ${stressData?.textColor}`}>
                      {stressData?.label}
                    </span>
                    {isAutoDetected && (
                      <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
                        AI Detected
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.date || entry.timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-base text-foreground leading-relaxed">
                    {entry.note ? (
                      isAutoDetected ? (
                        <span>
                          <span className="text-primary font-medium">ChatBot Analysis:</span>
                          {' '}
                          {entry.note.replace('Auto-detected from chat: ', '')}
                        </span>
                      ) : (
                        entry.note
                      )
                    ) : (
                      <span className="italic text-muted-foreground">No note added.</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}