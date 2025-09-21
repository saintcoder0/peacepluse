import { Card } from "@/components/ui/card";
import { 
  Heart, 
  Moon, 
  Smile, 
  Target, 
  PenTool, 
  Calendar,
  TrendingUp,
  Sun,
  AlertTriangle,
  MessageCircle,
  BookOpen,
  Activity
} from "lucide-react";
import { Spline } from '@splinetool/react-spline';
import { ChatBot } from "./ChatBot";

interface DashboardProps {
  onSectionChange: (section: string) => void;
}

const quickActions = [
  { id: "tasks", label: "Tasks Tracker", icon: Target, description: "Track your daily habits and build consistency", size: "large" },
  { id: "stress", label: "Stress Manager", icon: Activity, description: "Monitor and manage your stress levels", size: "medium" },
  { id: "journal", label: "Journal", icon: BookOpen, description: "Reflect and document your thoughts", size: "medium" },
];

export function Dashboard({ onSectionChange }: DashboardProps) {
  const handleActionClick = (actionId: string) => {
    onSectionChange(actionId);
  };

  const handleChatClick = () => {
    onSectionChange("chat");
  };

  return (
    <>
      <div className="section-spacing wellness-enter layout-container">
      {/* Enhanced Hero Section with Spline background */}
      <div className="relative rounded-3xl overflow-hidden group h-80 md:h-96">
        <div className="absolute inset-0 z-0">
          <Spline scene="https://prod.spline.design/FCdSLsoYZRtfzat4/scene.splinecode" />
        </div>
        <div className="absolute inset-0 flex items-center z-10 pointer-events-none">
          <div className="p-8 md:p-12 text-white">
            <h1 className="text-hero mb-4 drop-shadow-lg">
              Welcome to <span className="gradient-text bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Peace Pulse</span>
            </h1>
            <p className="text-body-large opacity-95 drop-shadow-md font-light mb-8">Your journey to wellness starts here</p>
            <div className="flex flex-wrap gap-4 pointer-events-auto">
              <div className="glass-card px-6 py-3 backdrop-blur-lg cursor-pointer hover:scale-105 transition-transform">
                <span className="text-sm font-medium">🌟 Track Progress</span>
              </div>
              <div className="glass-card px-6 py-3 backdrop-blur-lg cursor-pointer hover:scale-105 transition-transform">
                <span className="text-sm font-medium">💚 Build Habits</span>
              </div>
              <div className="glass-card px-6 py-3 backdrop-blur-lg cursor-pointer hover:scale-105 transition-transform">
                <span className="text-sm font-medium">🧘 Find Peace</span>
              </div>
            </div>
          </div>
        </div>
        {/* Floating elements for visual interest */}
        <div className="absolute top-8 right-8 w-4 h-4 bg-white/30 rounded-full float z-10" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-16 right-20 w-2 h-2 bg-white/20 rounded-full float z-10" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-12 w-3 h-3 bg-white/25 rounded-full float z-10" style={{animationDelay: '4s'}}></div>
      </div>

      {/* New Layout: Left side tiles + Right side chat */}
      <div className="content-spacing">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left side - Three tiles */}
          <div className="xl:col-span-2 space-y-6">
            {/* Habits Tracker - Horizontal */}
            <Card 
              className="glass-card-intense cursor-pointer group hover:scale-[1.02] transition-all duration-500 p-8 bg-gradient-to-br from-primary/10 to-primary-soft/20 border-0 interactive-card"
              onClick={() => handleActionClick("tasks")}
            >
              <div className="flex items-center space-x-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                    <Target className="h-12 w-12 text-primary drop-shadow-sm" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-sm"></div>
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    Tasks Tracker
                  </h3>
                  <p className="text-xl text-muted-foreground font-medium">
                    Track your daily habits and build consistency
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-4 h-16 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                </div>
              </div>
            </Card>

            {/* Bottom row - Stress Manager and Journal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stress Manager */}
              <Card 
                className="glass-card-intense cursor-pointer group hover:scale-105 transition-all duration-500 p-6 bg-gradient-to-br from-secondary/10 to-secondary-soft/20 border-0 interactive-card"
                onClick={() => handleActionClick("stress")}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                      <Activity className="h-10 w-10 text-secondary drop-shadow-sm" />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-sm"></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-secondary transition-colors duration-300">
                      Stress Manager
                    </h3>
                    <p className="text-lg text-muted-foreground font-medium">
                      Monitor and manage your stress levels
                    </p>
                  </div>
                </div>
              </Card>

              {/* Journal */}
              <Card 
                className="glass-card-intense cursor-pointer group hover:scale-105 transition-all duration-500 p-6 bg-gradient-to-br from-accent/10 to-accent-soft/20 border-0 interactive-card"
                onClick={() => handleActionClick("journal")}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                      <BookOpen className="h-10 w-10 text-accent drop-shadow-sm" />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-sm"></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-accent transition-colors duration-300">
                      Journal
                    </h3>
                    <p className="text-lg text-muted-foreground font-medium">
                      Reflect and document your thoughts
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Right side - Large Chat Tile */}
          <div className="xl:col-span-1">
            <Card 
              className="glass-card-intense cursor-pointer group hover:scale-105 transition-all duration-700 h-full min-h-[400px] bg-gradient-to-br from-primary/15 to-accent/15 border-0 interactive-card overflow-hidden"
              onClick={handleChatClick}
            >
              <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/40 to-accent/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-2xl">
                    <MessageCircle className="h-16 w-16 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-accent/30 rounded-3xl opacity-0 group-hover:opacity-70 transition-opacity duration-700 blur-lg"></div>
                  {/* Floating particles effect */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/40 rounded-full group-hover:animate-ping"></div>
                  <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-white/30 rounded-full group-hover:animate-ping" style={{animationDelay: '0.5s'}}></div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-bold text-foreground group-hover:text-primary transition-colors duration-500">
                    AI Assistant
                  </h3>
                  <p className="text-xl text-muted-foreground font-medium group-hover:text-primary/80 transition-colors duration-500">
                    Chat with your wellness companion
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground group-hover:text-primary/70 transition-colors duration-500">
                    <span>Click to start conversation</span>
                    <div className="w-2 h-2 bg-primary rounded-full group-hover:animate-pulse"></div>
                  </div>
                </div>
                {/* Animated background elements */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute top-4 right-4 w-8 h-8 border-2 border-primary/20 rounded-full animate-spin" style={{animationDuration: '3s'}}></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-2 border-accent/20 rounded-full animate-spin" style={{animationDuration: '4s', animationDirection: 'reverse'}}></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      </div>
    </>
  );
}