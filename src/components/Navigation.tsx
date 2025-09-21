import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { 
  Heart, 
  Moon, 
  AlertTriangle, 
  Target, 
  PenTool, 
  Calendar,
  MessageCircle,
  Menu,
  Settings,
  Sun
} from "lucide-react";
import { Settings as SettingsPanel } from "./Settings";
import { playClickSound } from "@/lib/audio";

interface NavigationProps {
  activeSection: string;

  
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Heart },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "stress", label: "Stress", icon: AlertTriangle },
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "tasks", label: "Tasks", icon: Target },
  { id: "journal", label: "Journal", icon: PenTool },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      {/* Mobile menu button - now positioned at top right for mobile */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-4 right-4 z-50 p-2 bg-card/80 backdrop-blur-sm rounded-full shadow-soft md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      

      {/* Settings Button and Vertical Navigation - Right side */}
      <div className="fixed top-6 right-8 z-50 flex flex-col items-center space-y-6 w-14">
        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="fab group relative flex flex-col items-center justify-center w-full h-14 transition-all duration-500 ease-out hover:scale-110 active:scale-95"
          title="Settings"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary/20 to-tertiary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Settings className="h-6 w-6 text-primary-foreground drop-shadow-sm transition-all duration-300 group-hover:rotate-90 group-hover:scale-110" />
        </button>
        
        {/* Vertical Navigation - Below Settings Button */}
        <nav className="z-40 md:block mt-4">
        <div className="nav-glass flex flex-col items-center space-y-4 px-5 py-8 rounded-3xl opacity-40 hover:opacity-100 focus-within:opacity-100 transition-all duration-500 hover:scale-105">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playClickSound();
                    onSectionChange(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "group relative flex flex-col items-center justify-center w-18 h-18 rounded-2xl",
                    "transition-all duration-500 ease-out hover:scale-125 active:scale-95",
                    "transform-gpu will-change-transform",
                    isActive 
                      ? "bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/20 scale-110" 
                      : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-br hover:from-muted/30 hover:to-muted/10"
                  )}
                  title={item.label}
                >
                  {/* Glow effect for active */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse" />
                  )}
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Icon with enhanced effects */}
                  <Icon className={cn(
                    "relative z-10 h-8 w-8 transition-all duration-300 drop-shadow-sm",
                    isActive ? "text-primary scale-110" : "group-hover:text-foreground group-hover:scale-110",
                    item.id === 'chat' && "group-hover:animate-pulse",
                    item.id === 'dashboard' && "group-hover:animate-bounce"
                  )} />
                  
                  {/* Enhanced tooltip */}
                  <div className={cn(
                    "absolute right-full ml-6 top-1/2 transform -translate-y-1/2 px-4 py-3 text-sm font-medium rounded-xl",
                    "glass-card opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1",
                    "backdrop-blur-xl border border-white/20 text-foreground shadow-lg"
                  )}>
                    {item.label}
                    <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-3 h-3 bg-card/80 border border-white/20 rotate-45"></div>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Mobile Navigation - Full screen overlay */}
      {isMenuOpen && (
        <nav className="fixed inset-0 z-30 md:hidden">
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-card/95 backdrop-blur-xl border-t border-border/50">
            <div className="grid grid-cols-4 gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      playClickSound();
                      onSectionChange(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-5 rounded-2xl transition-all duration-200",
                      isActive 
                        ? "bg-primary/20 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn("h-7 w-7 mb-3", isActive && "text-primary")} />
                    <span className="text-sm font-medium text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}