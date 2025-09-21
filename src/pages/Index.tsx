import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/components/Dashboard";
import { StressTracker } from "@/components/StressTracker";
import { SleepTracker } from "@/components/SleepTracker";
import { TaskTracker } from "@/components/TaskTracker";
import { Journal } from "@/components/Journal";
import { CalendarView } from "@/components/CalendarView";
import { ChatBot } from "@/components/ChatBot";
import { HabitTracker } from "@/components/HabitTracker";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard onSectionChange={setActiveSection} />;
        case "habit":
        return <HabitTracker />;
      case "stress":
        return <StressTracker />;
      case "sleep":
        return <SleepTracker />;
      case "tasks":
        return <TaskTracker />;
      case "journal":
        return <Journal />;
      case "calendar":
        return <CalendarView />;
      case "chat":
        return <ChatBot context="tab" />;
      default:
        return <ChatBot context="tab" />;
    }
  };

  return (
    <div className="min-h-screen relative">
      <Navigation 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <main className="relative z-10 p-4 md:p-6 lg:p-12 pt-24 md:pt-28 pb-[7rem] md:pb-[8rem] [padding-top:calc(env(safe-area-inset-top)+6rem)] [padding-bottom:calc(env(safe-area-inset-bottom)+8rem)]">
        {renderSection()}
      </main>
    </div>
  );
};

export default Index;
