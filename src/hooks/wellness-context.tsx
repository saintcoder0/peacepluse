import { createContext, useContext, useState } from 'react';

const WellnessContext = createContext(null);

export function WellnessProvider({ children }) {
  const [habits, setHabits] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [stressEntries, setStressEntries] = useState([]);
  const [todos, setTodos] = useState([]);
  const [sleepEntries, setSleepEntries] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [chatSuggestions, setChatSuggestions] = useState([]);

  const addHabit = (name, category) => {
    const newHabit = {
      id: Date.now().toString(),
      name,
      category,
      completed: false,
      isPermanent: false,
      streak: 0,
    };
    setHabits([...habits, newHabit]);
    return true;
  };

  const toggleHabit = (id) => {
    setHabits(
      habits.map((habit) =>
        habit.id === id ? { ...habit, completed: !habit.completed } : habit
      )
    );
  };

  const deleteHabit = (id) => {
    setHabits(habits.filter((habit) => habit.id !== id));
  };

  const getDailyHabitCompletions = (days) => {
    // This is a mock implementation. A real implementation would need to store
    // habit completion history.
    return Array.from({ length: days }, (_, i) => ({
      date: `2025-08-${15 + i}`,
      habitIds: [],
      totalHabits: habits.length,
    }));
  };

  const addPinnedTask = (name) => {
    const newHabit = {
      id: Date.now().toString(),
      name,
      category: 'health',
      completed: false,
      isPermanent: true,
      streak: 0,
    };
    setHabits([...habits, newHabit]);
    return true;
  };

  const updateTaskName = (id, name) => {
    setHabits(
      habits.map((habit) => (habit.id === id ? { ...habit, name } : habit))
    );
  };

  const pinTask = (id) => {
    setHabits(
      habits.map((habit) =>
        habit.id === id ? { ...habit, isPermanent: true } : habit
      )
    );
  };

  const unpinTask = (id) => {
    setHabits(
      habits.map((habit) =>
        habit.id === id ? { ...habit, isPermanent: false } : habit
      )
    );
  };

  const addChatMessage = (message) => {
    setChatMessages(prev => [...prev, message]);
  };

  const addStressEntry = (level, note = "") => {
    const newEntry = {
      id: Date.now().toString(),
      stressLevel: level,
      level, // Keep both for compatibility
      note,
      date: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
    setStressEntries(prev => [newEntry, ...prev]); // Add to beginning for recent-first order
    return newEntry;
  };

  const addTodos = (newTodos) => {
    const addedTodos = [];
    newTodos.forEach((todo, index) => {
      const exists = todos.some(existing => 
        existing.title.toLowerCase().trim() === todo.title.toLowerCase().trim()
      );
      if (!exists) {
        // Generate unique ID with timestamp and index to avoid duplicates
        const uniqueId = `todo-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newTodo = {
          id: uniqueId,
          title: todo.title.trim(),
          category: todo.category || 'health',
          completed: false,
          createdAt: new Date().toISOString(),
        };
        setTodos(prev => [...prev, newTodo]);
        addedTodos.push(todo.title.trim()); // Return task title string, not the full object
      }
    });
    return addedTodos;
  };

  const registerChatSuggestions = (tasks) => {
    const addedTodos = [];
    
    tasks.forEach((task, index) => {
      // Normalize task title for comparison
      const normalizedTitle = task.title.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
      
      // Check if task already exists in chat suggestions
      const existsInSuggestions = chatSuggestions.some(existing => 
        existing.name && existing.name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '') === normalizedTitle
      );
      
      // Check if task already exists in habits
      const existsInHabits = habits.some(existing => 
        existing.name && existing.name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '') === normalizedTitle
      );
      
      // Check if task already exists in todos
      const existsInTodos = todos.some(existing => 
        existing.title && existing.title.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '') === normalizedTitle
      );
      
      if (!existsInSuggestions && !existsInHabits && !existsInTodos) {
        // Generate unique ID with timestamp and index to avoid duplicates
        const uniqueId = `chatbot-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newSuggestion = {
          id: uniqueId,
          name: task.title.trim(),
          completed: false,
          streak: 0,
          category: task.category || 'health',
          source: 'chatbot', // Mark as chatbot-generated
          timestamp: new Date().toISOString()
        };
        
        setChatSuggestions(prev => [...prev, newSuggestion]);
        addedTodos.push(task.title.trim());
      }
    });
    
    return addedTodos;
  };

  const clearChatSuggestions = () => {
    setChatSuggestions([]);
  };

  const removeChatSuggestion = (id) => {
    setChatSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
  };
  
  const toggleChatSuggestion = (id) => {
    setChatSuggestions(prev => 
      prev.map(suggestion => 
        suggestion.id === id ? {
          ...suggestion,
          completed: !suggestion.completed,
          completedAt: !suggestion.completed ? new Date().toISOString() : null
        } : suggestion
      )
    );
  };

  const toggleTodo = (id) => {
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { 
          ...todo, 
          completed: !todo.completed,
          completedAt: !todo.completed ? new Date().toISOString() : null
        } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const addSleepEntry = (entry) => {
    setSleepEntries((prevEntries) => [...prevEntries, entry]);
  };

  const addJournalEntry = (entry) => {
    const newEntry = { ...entry, id: Date.now().toString() };
    setJournalEntries((prevEntries) => [...prevEntries, newEntry]);
  };

  const updateJournalEntry = (id, updatedEntry) => {
    setJournalEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updatedEntry } : entry
      )
    );
  };

  const deleteJournalEntry = (id) => {
    setJournalEntries((prevEntries) =>
      prevEntries.filter((entry) => entry.id !== id)
    );
  };

  return (
    <WellnessContext.Provider
      value={{
        habits,
        addHabit,
        toggleHabit,
        deleteHabit,
        getDailyHabitCompletions,
        addPinnedTask,
        updateTaskName,
        pinTask,
        unpinTask,
        chatMessages,
        addChatMessage,
        stressEntries,
        stressHistory: stressEntries, // Alias for compatibility
        addStressEntry,
        todos,
        addTodos,
        toggleTodo,
        deleteTodo,
        chatSuggestions,
        setChatSuggestions,
        registerChatSuggestions,
        clearChatSuggestions,
        removeChatSuggestion,
        toggleChatSuggestion,
        sleepEntries,
        addSleepEntry,
        journalEntries,
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
      }}
    >
      {children}
    </WellnessContext.Provider>
  );
}

export function useWellness() {
  const context = useContext(WellnessContext);
  if (!context) {
    throw new Error('useWellness must be used within a WellnessProvider');
  }
  return context;
}