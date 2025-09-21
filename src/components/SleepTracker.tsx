import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Moon, Sun, Clock, TrendingUp, Smile, Frown, Meh, Star } from "lucide-react";
import { TimePicker } from "@/components/TimePicker";
import { useWellness } from "@/hooks/wellness-context";
import { playClickSound, playTaskCompleteSound } from "@/lib/audio";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  ResponsiveContainer,
} from "recharts";

export function SleepTracker() {
  const [bedtime, setBedtime] = useState("");
  const [wakeupTime, setWakeupTime] = useState("");
  const [quality, setQuality] = useState("");
  const { addSleepEntry, sleepEntries = [] } = useWellness();

  const qualityOptions = [
    { value: "excellent", label: "Excellent", emoji: "🤩", icon: <Star className="h-5 w-5 text-yellow-400" /> },
    { value: "good", label: "Good", emoji: "😊", icon: <Smile className="h-5 w-5 text-green-400" /> },
    { value: "fair", label: "Fair", emoji: "😐", icon: <Meh className="h-5 w-5 text-orange-400" /> },
    { value: "poor", label: "Poor", emoji: "😴", icon: <Frown className="h-5 w-5 text-red-400" /> },
  ];

  const calculateDuration = () => {
    if (bedtime && wakeupTime) {
      const bed = new Date(`1970-01-01T${bedtime}:00`);
      const wake = new Date(`1970-01-01T${wakeupTime}:00`);
      if (wake < bed) wake.setDate(wake.getDate() + 1);
      const diff = wake.getTime() - bed.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    return "0h 0m";
  };

  const handleSubmit = () => {
    if (bedtime && wakeupTime && quality) {
      const bed = new Date(`1970-01-01T${bedtime}:00`);
      const wake = new Date(`1970-01-01T${wakeupTime}:00`);
      if (wake < bed) wake.setDate(wake.getDate() + 1);
      const diffMinutes = Math.round((wake.getTime() - bed.getTime()) / (1000 * 60));
      const now = new Date();
      const dateKey = now.toISOString();
      addSleepEntry({
        date: dateKey,
        bedtime,
        wakeup: wakeupTime,
        durationMinutes: diffMinutes,
        quality: quality as any,
      });
      playTaskCompleteSound();
      setBedtime("");
      setWakeupTime("");
      setQuality("");
    }
  };

  const monthData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthEntries = sleepEntries.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const entriesForDay = monthEntries.filter((e) => new Date(e.date).getDate() === day);
      const totalMinutes = entriesForDay.reduce((total, entry) => total + entry.durationMinutes, 0);
      return {
        day: String(day),
        hours: totalMinutes > 0 ? Math.round((totalMinutes / 60) * 100) / 100 : null,
      };
    });
  }, [sleepEntries]);
  
  const getQualityIcon = (qualityValue: string) => {
    return qualityOptions.find(q => q.value === qualityValue)?.icon;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 wellness-enter">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight bg-gradient-to-br from-primary to-primary/60 text-transparent bg-clip-text">
            Sleep Sanctuary
          </h1>
          <p className="text-muted-foreground text-lg">Monitor and understand your sleep patterns for better rest.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Entry Form */}
          <Card className="lg:col-span-2 p-8 glass-card transition-all duration-300 hover:shadow-2xl animate-in fade-in-50 duration-500">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Moon className="h-6 w-6 mr-3 text-primary" />
              Log Your Sleep
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <TimePicker
                id="bedtime"
                label="Went to Bed"
                value={bedtime}
                onChange={setBedtime}
                compact
              />
              <TimePicker
                id="wakeup"
                label="Woke Up"
                value={wakeupTime}
                onChange={setWakeupTime}
                compact
              />
            </div>

            {bedtime && wakeupTime && (
              <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in-50 duration-300">
                <div className="flex items-center justify-center space-x-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <span className="text-xl font-semibold text-primary">
                    {calculateDuration()}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <Label className="text-base">How was your sleep quality?</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {qualityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      playClickSound();
                      setQuality(option.value);
                    }}
                    className={`
                      p-4 rounded-xl text-center border-2 transition-all duration-300 ease-in-out
                      ${quality === option.value 
                        ? "border-primary bg-primary/10 scale-105 shadow-lg" 
                        : "border-border bg-background/50 hover:border-primary/50 hover:scale-105"
                      }
                    `}
                  >
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={!bedtime || !wakeupTime || !quality}
              className="w-full h-14 text-lg font-semibold transition-transform duration-200 hover:scale-105"
            >
              Save Sleep Entry
            </Button>
          </Card>

          {/* Right Column: History and Chart */}
          <div className="lg:col-span-3 space-y-8">
            <Card className="p-8 glass-card transition-all duration-300 hover:shadow-2xl animate-in fade-in-50 duration-500 delay-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Sleep History</h2>
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {sleepEntries.slice().reverse().map((entry, index) => {
                  const hours = Math.floor(entry.durationMinutes / 60);
                  const minutes = entry.durationMinutes % 60;
                  const duration = `${hours}h ${minutes}m`;
                  return (
                    <div 
                      key={entry.id} 
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 animate-in slide-in-from-bottom-4 duration-500"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                    >
                      <div className="flex items-center gap-4">
                         {getQualityIcon(entry.quality)}
                         <div>
                            <div className="font-medium">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.bedtime} - {entry.wakeup}
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary text-lg">{duration}</div>
                        <div className="text-sm capitalize text-muted-foreground">{entry.quality}</div>
                      </div>
                    </div>
                  );
                })}
                 {sleepEntries.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No sleep data yet.</p>
                        <p>Log your first night to get started!</p>
                    </div>
                )}
              </div>
            </Card>

            <Card className="p-6 glass-card transition-all duration-300 hover:shadow-2xl animate-in fade-in-50 duration-500 delay-300">
              <h2 className="text-xl font-semibold mb-4 ml-2">This Month's Sleep Trend</h2>
              <div className="h-64 w-full">
                <ChartContainer
                  config={{ hours: { label: "Hours", color: "hsl(var(--primary))" } }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer>
                    <LineChart data={monthData}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.2)" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={10} unit="h" />
                      <ChartTooltip
                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Area type="monotone" dataKey="hours" stroke="transparent" fillOpacity={1} fill="url(#colorHours)" />
                      <Line connectNulls type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}