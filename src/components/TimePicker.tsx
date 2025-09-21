import * as React from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { playClickSound } from "@/lib/audio";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
  compact?: boolean;
}

export function TimePicker({ value, onChange, label, id, compact = false }: TimePickerProps) {
  const [hour, minute] = value.split(":").map(Number);
  const [activeMode, setActiveMode] = React.useState<"hour" | "minute">("hour");
  const [isOpen, setIsOpen] = React.useState(false);

  const handleTimeChange = (type: "hour" | "minute", val: number) => {
    let newHour = isNaN(hour) ? 12 : hour;
    let newMinute = isNaN(minute) ? 0 : minute;

    if (type === "hour") {
      newHour = val;
    } else {
      newMinute = val;
    }

    const formattedHour = String(newHour).padStart(2, "0");
    const formattedMinute = String(newMinute).padStart(2, "0");
    onChange(`${formattedHour}:${formattedMinute}`);
  };

  const incrementValue = (type: "hour" | "minute") => {
    if (type === "hour") {
      const newHour = isNaN(hour) ? 0 : (hour + 1) % 24;
      handleTimeChange("hour", newHour);
    } else {
      const newMinute = isNaN(minute) ? 0 : (minute + 5) % 60;
      handleTimeChange("minute", newMinute);
    }
  };

  const decrementValue = (type: "hour" | "minute") => {
    if (type === "hour") {
      const newHour = isNaN(hour) ? 23 : hour === 0 ? 23 : hour - 1;
      handleTimeChange("hour", newHour);
    } else {
      const newMinute = isNaN(minute) ? 55 : minute === 0 ? 55 : minute - 5;
      handleTimeChange("minute", newMinute);
    }
  };

  const renderDial = (
    count: number,
    currentValue: number,
    onSelect: (value: number) => void,
    step = 1,
    type: "hour" | "minute"
  ) => {
    const items = [];
    const radius = type === "hour" 
      ? (compact ? 78 : 92)  // Increased radius for hour mode to accommodate larger buttons
      : (compact ? 62 : 75); // Keep original radius for minute mode
    const center = compact ? 96 : 104;
    const isActive = activeMode === type;

    // Subtle tick marks around the dial for context
    const tickMarks = Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const outerX = center + (radius + 4) * Math.cos(angle);
      const outerY = center + (radius + 4) * Math.sin(angle);
      const innerX = center + (radius - (i % 5 === 0 ? 8 : 4)) * Math.cos(angle);
      const innerY = center + (radius - (i % 5 === 0 ? 8 : 4)) * Math.sin(angle);
      return (
        <div
          key={`tick-${type}-${i}`}
          className={cn(
            "absolute",
            i % 5 === 0
              ? "w-[2px] h-[9px] bg-muted-foreground/50"
              : "w-[1px] h-[5px] bg-muted-foreground/30"
          )}
          style={{
            left: innerX,
            top: innerY,
            transform: `translate(-50%, -50%) rotate(${(i / count) * 360}deg)`,
          }}
        />
      );
    });

    for (let i = 0; i < count; i += step) {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      const isSelected = i === currentValue;

      items.push(
        <button
          key={i}
          onClick={() => {
            playClickSound();
            onSelect(i);
            if (type === "hour") {
              setActiveMode("minute");
            }
          }}
          className={cn(
            "absolute rounded-full flex items-center justify-center font-medium transition-all duration-300 ease-in-out",
            // Make hour numbers bigger and more visible
            type === "hour" 
              ? (compact ? "w-10 h-10 text-base" : "w-11 h-11 text-lg")
              : (compact ? "w-8 h-8 text-sm" : "w-9 h-9 text-sm"),
            "transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 active:scale-95",
            "border-[1.5px] backdrop-blur-sm",
            isSelected
              ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground border-primary/50 shadow-xl shadow-primary/40 scale-110 ring-2 ring-primary/30"
              : isActive
              ? "bg-gradient-to-br from-card/60 to-card/80 border-border hover:border-primary/40 text-foreground hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary-soft/20 hover:shadow hover:shadow-primary/10"
              : "bg-gradient-to-br from-muted/50 to-muted/70 border-border/50 text-muted-foreground opacity-70 hover:opacity-90"
          )}
          style={{ left: x, top: y }}
        >
          {String(i).padStart(2, "0")}
        </button>
      );
    }
    
    // Add center indicator
    const centerDot = (
      <div 
        key="center"
        className={cn(
          "absolute w-3 h-3 rounded-full transition-all duration-300",
          "transform -translate-x-1/2 -translate-y-1/2",
          isActive 
            ? "bg-gradient-to-br from-primary to-primary-glow shadow-lg shadow-primary/30" 
            : "bg-muted-foreground/40"
        )}
        style={{ left: center, top: center }}
      />
    );
    
    // Add selected value indicator line (hand) pivoted at the dial center
    const selectedLine = currentValue >= 0 ? (() => {
      const handHeight = radius - (compact ? 18 : 22);
      return (
        <div
          key="line"
          className={cn(
            "absolute w-0.5 transition-all duration-500 ease-in-out transform -translate-x-1/2",
            isActive && currentValue >= 0
              ? "bg-gradient-to-t from-primary to-primary-glow shadow-sm shadow-primary/30"
              : "bg-muted-foreground/40 opacity-40"
          )}
          style={{
            left: center,
            top: center - handHeight,
            height: handHeight,
            transformOrigin: "50% 100%",
            transform: `translateX(-50%) rotate(${(currentValue / count) * 360}deg)`,
          }}
        />
      );
    })() : null;

    return (
      <div className={cn("relative my-4", compact ? "w-48 h-48" : "w-52 h-52")}> 
        {/* outer glow ring */}
        <div
          className={cn(
            "absolute rounded-full transition-all duration-500",
            compact ? "inset-[6px]" : "inset-2",
            isActive ? "shadow-[0_0_0_2px_rgba(59,130,246,0.15)]" : ""
          )}
          style={{
            background:
              "radial-gradient(closest-side, rgba(59,130,246,0.08), transparent 70%)",
          }}
        />
        {/* dial boundary */}
        <div className={cn(
          "absolute border-2 rounded-full transition-all duration-500",
          compact ? "inset-5" : "inset-4",
          isActive 
            ? "border-primary/30 shadow-lg shadow-primary/20" 
            : "border-dashed border-border/50"
        )}></div>
        {tickMarks}
        {selectedLine}
        {centerDot}
        {items}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={id} className="flex items-center text-sm font-medium text-foreground">
        <Clock className="h-4 w-4 mr-2 text-primary" />
        {label}
      </Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full h-14 text-lg justify-center font-mono transition-all duration-300",
              "glass-card hover:scale-[1.02] active:scale-[0.98]",
              "border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20",
              "focus:border-primary focus:ring-2 focus:ring-primary/20",
              value && "text-foreground",
              !value && "text-muted-foreground"
            )}
          >
            <Clock className="h-5 w-5 mr-3 text-primary" />
            {value || "Select time"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 glass-card-intense border-border shadow-2xl max-w-[92vw] sm:max-w-[24rem]">
          <div
            className={cn(compact ? "p-4" : "p-5")}
            style={{
              background:
                "radial-gradient(1200px 300px at 50% -10%, rgba(59,130,246,0.10), transparent), radial-gradient(600px 200px at 50% 120%, rgba(59,130,246,0.08), transparent)",
            }}
          >
            {/* Time Display and Controls */}
            <div className={cn("text-center", compact ? "mb-4" : "mb-6")}> 
              {/* Glowing current time header */}
              <div className={cn(compact ? "mb-3" : "mb-5")}> 
                <div className="inline-flex items-baseline px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-inner">
                  <span className={cn("font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary-glow drop-shadow-[0_2px_6px_rgba(59,130,246,0.35)]", compact ? "text-2xl" : "text-3xl")}>
                    {`${String(isNaN(hour) ? "00" : hour).padStart(2, "0")}:${String(isNaN(minute) ? "00" : minute).padStart(2, "0")}`}
                  </span>
                </div>
              </div>
              <div className={cn("flex items-center justify-center", compact ? "space-x-2.5 mb-4" : "space-x-3 mb-5")}> 
                {/* Hour Section */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => incrementValue("hour")}
                    className="p-1 rounded-full hover:bg-primary/10 transition-colors duration-200"
                  >
                    <ChevronUp className="h-4 w-4 text-primary" />
                  </button>
                  <button
                    onClick={() => setActiveMode("hour")}
                    className={cn(
                      "px-4 font-mono rounded-xl transition-all duration-300",
                      compact ? "py-2 text-xl min-w-[64px]" : "py-2.5 text-2xl min-w-[72px]",
                      activeMode === "hour"
                        ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                        : "bg-gradient-to-br from-card/60 to-card/80 text-foreground hover:scale-105 hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary-soft/20"
                    )}
                  >
                    {String(isNaN(hour) ? "00" : hour).padStart(2, "0")}
                  </button>
                  <button
                    onClick={() => decrementValue("hour")}
                    className="p-1 rounded-full hover:bg-primary/10 transition-colors duration-200"
                  >
                    <ChevronDown className="h-4 w-4 text-primary" />
                  </button>
                </div>
                
                {/* Separator */}
                <div className={cn("font-mono text-muted-foreground animate-pulse", compact ? "text-xl" : "text-2xl")}>:</div>
                
                {/* Minute Section */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => incrementValue("minute")}
                    className="p-1 rounded-full hover:bg-primary/10 transition-colors duration-200"
                  >
                    <ChevronUp className="h-4 w-4 text-primary" />
                  </button>
                  <button
                    onClick={() => setActiveMode("minute")}
                    className={cn(
                      "px-4 font-mono rounded-xl transition-all duration-300",
                      compact ? "py-2 text-xl min-w-[64px]" : "py-2.5 text-2xl min-w-[72px]",
                      activeMode === "minute"
                        ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                        : "bg-gradient-to-br from-card/60 to-card/80 text-foreground hover:scale-105 hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary-soft/20"
                    )}
                  >
                    {String(isNaN(minute) ? "00" : minute).padStart(2, "0")}
                  </button>
                  <button
                    onClick={() => decrementValue("minute")}
                    className="p-1 rounded-full hover:bg-primary/10 transition-colors duration-200"
                  >
                    <ChevronDown className="h-4 w-4 text-primary" />
                  </button>
                </div>
              </div>
              
              {/* Mode Indicator */}
              <div className={cn("flex justify-center", compact ? "space-x-3 mb-4" : "space-x-4 mb-6")}> 
                <button
                  onClick={() => setActiveMode("hour")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    activeMode === "hour"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  Select Hour
                </button>
                <button
                  onClick={() => setActiveMode("minute")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    activeMode === "minute"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  Select Minute
                </button>
              </div>
            </div>
            
            {/* Dial */}
            <div className={cn("flex justify-center", compact ? "scale-[0.92]" : "scale-[0.95] md:scale-100")}> 
              {activeMode === "hour" && renderDial(24, isNaN(hour) ? -1 : hour, (h) => handleTimeChange("hour", h), 1, "hour")}
              {activeMode === "minute" && renderDial(60, isNaN(minute) ? -1 : minute, (m) => handleTimeChange("minute", m), 5, "minute")}
            </div>
            
            {/* Action Buttons */}
            <div className={cn("flex justify-center flex-wrap", compact ? "gap-2 mt-4" : "gap-2.5 mt-5")}> 
              <Button
                variant="outline"
                onClick={() => {
                  const now = new Date();
                  const h = String(now.getHours()).padStart(2, "0");
                  const m = String(Math.round(now.getMinutes() / 5) * 5).padStart(2, "0");
                  onChange(`${h}:${m}`);
                }}
                className={cn("glass-card hover:bg-muted/30 transition-all duration-200", compact ? "px-4 py-1.5" : "px-5 py-2")}
              >
                Now
              </Button>
              <Button
                variant="outline"
                onClick={() => onChange("")}
                className={cn("glass-card hover:bg-muted/30 transition-all duration-200", compact ? "px-4 py-1.5" : "px-5 py-2")}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className={cn("glass-card hover:bg-muted/30 transition-all duration-200", compact ? "px-4 py-1.5" : "px-5 py-2")}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className={cn("bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200", compact ? "px-4 py-1.5" : "px-5 py-2")}
              >
                Confirm
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}