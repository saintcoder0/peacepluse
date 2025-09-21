import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, TrendingUp, BarChart3, Clock, Plus, AlertTriangle, Zap, Heart, Brain } from "lucide-react";
import { useWellness } from "@/hooks/wellness-context";
import { playClickSound, playTaskCompleteSound } from "@/lib/audio";

const stressOptions = [
  { 
    id: "very-low", 
    label: "Very Low", 
    emoji: "😌", 
    color: "stress-very-low", 
    description: "Feeling calm & relaxed",
    value: 1,
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    textColor: "text-green-700"
  },
  { 
    id: "low", 
    label: "Low", 
    emoji: "🙂", 
    color: "stress-low", 
    description: "Generally relaxed",
    value: 2,
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    textColor: "text-blue-700"
  },
  { 
    id: "moderate", 
    label: "Moderate", 
    emoji: "😐", 
    color: "stress-moderate", 
    description: "Some stress, manageable",
    value: 3,
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-300",
    textColor: "text-yellow-700"
  },
  { 
    id: "high", 
    label: "High", 
    emoji: "😰", 
    color: "stress-high", 
    description: "Feeling quite stressed",
    value: 4,
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
    textColor: "text-orange-700"
  },
  { 
    id: "very-high", 
    label: "Very High", 
    emoji: "😱", 
    color: "stress-very-high", 
    description: "Extremely stressed",
    value: 5,
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    textColor: "text-red-700"
  },
];

const recentStressEntries = [
  { date: "Today", stressLevel: "moderate", note: "Had a productive day at work" },
  { date: "Yesterday", stressLevel: "low", note: "Great time with friends" },
  { date: "2 days ago", stressLevel: "high", note: "Feeling a bit overwhelmed" },
];

export function StressTracker() {
  const [selectedStressLevel, setSelectedStressLevel] = useState<string>("");
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const { addStressEntry, stressEntries: stressHistory } = useWellness();

  const handleSubmit = () => {
    if (selectedStressLevel) {
      addStressEntry(selectedStressLevel as any, note);
      playTaskCompleteSound();
      setSelectedStressLevel("");
      setNote("");
      setShowNoteInput(false);
    }
  };

  const handleStressSelect = (stressId: string) => {
    playClickSound();
    setSelectedStressLevel(stressId);
    setShowNoteInput(true);
  };

  // Calculate stress statistics
  const totalEntries = stressHistory.length || recentStressEntries.length;
  const averageStress = stressHistory.length > 0 ? 
    stressHistory.reduce((acc, entry) => {
      const stressIndex = stressOptions.findIndex(s => s.id === entry.stressLevel);
      return acc + (stressIndex >= 0 ? stressIndex + 1 : 3);
    }, 0) / stressHistory.length : 3;

  const getStressTrend = () => {
    if (stressHistory.length < 2) return "stable";
    const recent = stressHistory.slice(-3);
    const trend = recent.reduce((acc, entry, i) => {
      if (i === 0) return 0;
      const currentIndex = stressOptions.findIndex(s => s.id === entry.stressLevel);
      const prevIndex = stressOptions.findIndex(s => s.id === recent[i-1].stressLevel);
      return acc + (currentIndex - prevIndex);
    }, 0);
    return trend < 0 ? "improving" : trend > 0 ? "worsening" : "stable";
  };

  // Generate chart data for the last 14 days
  const generateChartData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find stress entry for this date
      const entry = stressHistory.find((e: any) => {
        const entryDate = new Date(e.date);
        return entryDate.toISOString().split('T')[0] === dateStr;
      });
      
      if (entry) {
        const stressIndex = stressOptions.findIndex(s => s.id === entry.stressLevel);
        data.push({
          date: dateStr,
          stress: stressIndex >= 0 ? stressIndex + 1 : 3,
          label: stressOptions[stressIndex]?.label || "Moderate",
          emoji: stressOptions[stressIndex]?.emoji || "😐"
        });
      } else {
        // No entry for this date
        data.push({
          date: dateStr,
          stress: null,
          label: "No entry",
          emoji: "—"
        });
      }
    }
    
    return data;
  };

  const chartData = generateChartData();

  // Calculate current stress level for the stress bar
  const currentStressLevel = stressHistory.length > 0 ? stressHistory[0] : null;
  const currentStressValue = currentStressLevel ? 
    stressOptions.find(s => s.id === currentStressLevel.stressLevel)?.value || 3 : 3;

  return (
    <div className="space-y-6 wellness-enter">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Stress Tracker</h1>
        <p className="text-muted-foreground">Monitor your stress levels and discover patterns</p>
      </div>

      {/* Current Stress Level Bar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Current Stress Level</h2>
          <Brain className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="space-y-4">
          {/* Stress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Very Low</span>
              <span>Very High</span>
            </div>
            <div className="relative">
              <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                {/* Stress Level Indicator */}
                <div 
                  className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-500 ease-out"
                  style={{ width: `${(currentStressValue / 5) * 100}%` }}
                />
                {/* Current Level Marker */}
                <div 
                  className="absolute top-0 w-2 h-8 bg-white border-2 border-gray-800 rounded-full shadow-lg transition-all duration-500 ease-out"
                  style={{ left: `calc(${(currentStressValue / 5) * 100}% - 4px)` }}
                />
              </div>
            </div>
            
            {/* Current Level Display */}
            {currentStressLevel && (
              <div className="text-center mt-4">
                <div className="text-3xl mb-2">
                  {stressOptions.find(s => s.id === currentStressLevel.stressLevel)?.emoji}
                </div>
                <div className="text-lg font-semibold">
                  {stressOptions.find(s => s.id === currentStressLevel.stressLevel)?.label}
                </div>
                {currentStressLevel.note && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {currentStressLevel.note}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Stress Selection & Input */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stress Selection Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">How stressed are you feeling today?</h2>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            
            {/* Stress Grid */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              {stressOptions.map((stress) => (
                <button
                  key={stress.id}
                  onClick={() => handleStressSelect(stress.id)}
                  className={`
                    group relative p-4 rounded-2xl text-center border-2 transition-all duration-300
                    hover:scale-105 hover:shadow-lg
                    ${selectedStressLevel === stress.id 
                      ? `${stress.bgColor} ${stress.borderColor} shadow-lg` 
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/20"
                    }
                  `}
                >
                  <div className="text-4xl mb-3 transition-transform group-hover:scale-110">
                    {stress.emoji}
                  </div>
                  <div className={`text-sm font-semibold mb-1 ${selectedStressLevel === stress.id ? stress.textColor : ''}`}>
                    {stress.label}
                  </div>
                  <div className={`text-xs ${selectedStressLevel === stress.id ? stress.textColor : 'text-muted-foreground'}`}>
                    {stress.description}
                  </div>
                  
                  {/* Selection indicator */}
                  {selectedStressLevel === stress.id && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Plus className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Note Input - Conditional Display */}
            {showNoteInput && (
              <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Add a note about your stress</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNoteInput(false)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </Button>
                </div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's causing your stress? Any triggers or coping strategies you used?"
                  className="min-h-[100px] resize-none"
                />
                <Button 
                  onClick={handleSubmit}
                  disabled={!selectedStressLevel}
                  className="w-full"
                >
                  Save Stress Entry
                </Button>
              </div>
            )}
          </Card>

          {/* Recent Entries Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Entries</h2>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-4">
              {(stressHistory.length ? stressHistory : recentStressEntries).slice(0, 6).map((entry: any, index: number) => {
                const stressData = stressOptions.find(s => s.id === entry.stressLevel);
                return (
                  <div key={index} className="flex items-center space-x-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors duration-200">
                    <div className="text-3xl">{stressData?.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full ${stressData?.bgColor} ${stressData?.textColor} font-medium`}>
                          {stressData?.label}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-foreground leading-relaxed">{entry.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Stress Trend Chart Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Stress Trend (Last 14 Days)</h2>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            
            {/* Chart Container */}
            <div className="relative h-64 bg-muted/10 rounded-xl p-4 border border-border/50">
              {/* Chart Grid Lines */}
              <div className="absolute inset-4 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map((line) => (
                  <div key={line} className="border-t border-border/20" />
                ))}
              </div>
              
              {/* Y-axis Labels */}
              <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between text-xs text-muted-foreground pointer-events-none">
                {stressOptions.map((stress, index) => (
                  <span key={stress.id} className="transform -translate-y-1">
                    {stress.emoji}
                  </span>
                ))}
              </div>
              
              {/* Chart Line */}
              <svg className="absolute inset-4 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="stressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                
                {/* Area fill */}
                <path
                  d={chartData.reduce((path, point, index) => {
                    if (point.stress === null) return path;
                    const x = (index / (chartData.length - 1)) * 100;
                    const y = 100 - ((point.stress / 5) * 100);
                    return path + (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
                  }, "") + " L 100 100 L 0 100 Z"}
                  fill="url(#stressGradient)"
                  opacity="0.3"
                />
                
                {/* Line */}
                <path
                  d={chartData.reduce((path, point, index) => {
                    if (point.stress === null) return path;
                    const x = (index / (chartData.length - 1)) * 100;
                    const y = 100 - ((point.stress / 5) * 100);
                    return path + (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
                  }, "")}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Data Points */}
                {chartData.map((point, index) => {
                  if (point.stress === null) return null;
                  const x = (index / (chartData.length - 1)) * 100;
                  const y = 100 - ((point.stress / 5) * 100);
                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r="3"
                        fill="hsl(var(--primary))"
                        className="hover:r-4 transition-all duration-200"
                      />
                      {/* Tooltip */}
                      <title>{`${point.date}: ${point.label}`}</title>
                    </g>
                  );
                })}
              </svg>
              
              {/* X-axis Labels */}
              <div className="absolute bottom-0 left-4 right-4 flex justify-between text-xs text-muted-foreground">
                {chartData.filter((_, index) => index % 3 === 0).map((point, index) => (
                  <span key={index} className="transform translate-x-2">
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Chart Legend */}
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>Stress Level</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-muted-foreground/30 rounded-full"></div>
                <span>No Entry</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Statistics & Insights */}
        <div className="space-y-6">
          
          {/* Stress Overview Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Stress Overview</h3>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-4">
              <div className="text-center p-4 rounded-xl bg-muted/20">
                <div className="text-2xl font-bold text-primary mb-1">{totalEntries}</div>
                <div className="text-sm text-muted-foreground">Total Entries</div>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-muted/20">
                <div className="text-2xl font-bold text-secondary mb-1">
                  {stressOptions[Math.round(averageStress) - 1]?.emoji}
                </div>
                <div className="text-sm text-muted-foreground">Average Stress</div>
              </div>
            </div>
          </Card>

          {/* Stress Trend Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Stress Trend</h3>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="text-center p-4 rounded-xl bg-muted/20">
              <div className="text-2xl font-bold text-accent mb-1">
                {getStressTrend() === "improving" ? "📉" : 
                 getStressTrend() === "worsening" ? "📈" : "➡️"}
              </div>
              <div className="text-sm text-muted-foreground capitalize">
                Stress is {getStressTrend()}
              </div>
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowNoteInput(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setSelectedStressLevel("")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                View History
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}