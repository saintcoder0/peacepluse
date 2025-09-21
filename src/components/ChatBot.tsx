import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Bot, User, GripVertical } from "lucide-react";
import { useWellness } from "@/hooks/wellness-context";
import { motion, AnimatePresence } from "framer-motion";

// Component to format bot messages with bold text
const FormattedText = ({ text }: { text: string }) => {
  const parts = text.split(/(\*.*?\*)/g);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          // Remove asterisks and make bold
          const boldText = part.slice(1, -1);
          return <strong key={index}>{boldText}</strong>;
        }
        return part;
      })}
    </>
  );
};

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface Notification {
  id: string;
  message: string;
  type: "success" | "info";
  timestamp: Date;
}

const botResponses = [
  "• That sounds like you're going through a lot. Remember, it's *okay* to feel this way.\n• What usually helps you feel *better*?\n• Is there someone you can *talk to* about this?",
  "• I hear you. Taking time for yourself is so *important*.\n• Have you tried any *breathing exercises* today?\n• What's one *small thing* you could do for yourself right now?",
  "• It's wonderful that you're *sharing* this with me.\n• What usually helps you feel *better*?\n• Would you like to try a quick *mindfulness exercise*?",
  "• Thank you for being *open* about your feelings.\n• Would you like to try a quick *mindfulness exercise*?\n• Remember, you're *not alone* in this journey.",
  "• I understand. Sometimes just *talking* about it can help.\n• Is there anything *specific* on your mind?\n• What's one thing that would make today a little *better*?",
  "• That's a *great insight*. How can we work together to support your wellbeing today?\n• What *small step* feels manageable right now?\n• You're doing *great* by reaching out.",
  "• I'm glad you're taking care of yourself.\n• What's one *small thing* you could do for yourself right now?\n• Remember to be *kind* to yourself today.",
];

const SYSTEM_PROMPT = `You are mAItri, a supportive, trauma-informed mental health companion.

Your purpose: provide empathetic, evidence-informed support for mental wellbeing (stress, anxiety, stress management, sleep, habits, self-care), encourage healthy coping, and empower users. You are NOT a clinician and do not give medical, diagnostic, legal, or crisis instructions.

IMPORTANT STRESS CLASSIFICATION RULE: When analyzing messages for emotions, ONLY classify or acknowledge "stress" if a clear, explicit reason for the stress is present in the user's message (such as work, relationships, health, finances, deadlines, school, traffic, etc.). If no specific cause is identified, do not mark or discuss stress as an emotion.

STRESS RELIEF ACTIVITIES: When stress is detected as "more than moderate" (high or very-high), ALWAYS suggest practical exercises or activities for stress relief such as breathing techniques, walking, stretching, journaling, mindfulness, progressive muscle relaxation, or gentle exercise. These activities should be added to the user's habit tracker to provide ongoing support.

TASK GENERATION FOR STRESS: When analyzing stress with a clear cause (work, relationships, health, finances, deadlines, etc.), provide SPECIFIC, ACTIONABLE tasks that directly address the stress source. Format these as bullet points (•) so they automatically appear in the user's daily task tracker.

EXERCISE SUGGESTIONS: When users ask for exercises or activities (including phrases like "give me exercise", "I need exercises", "exercise to do", "workout", "activities", etc.), ALWAYS format your response with bullet points (•) for each exercise. This allows the system to automatically add them to the user's habit tracker. 

IMPORTANT EXERCISE GUIDELINES:
- Be HIGHLY SPECIFIC and actionable with exercise descriptions (include duration, technique details, etc.)
- Provide 3-5 exercises that are practical, diverse, and tailored to the user's specific situation
- Vary your suggestions - avoid repetitive recommendations like always suggesting the same breathing technique
- Consider the user's context (work stress = desk exercises, anxiety = calming activities, low energy = gentle movement)
- Include specific techniques, durations, and clear instructions
- Mix different types: breathing techniques, physical movement, mindfulness practices, self-care activities
- ALWAYS use bullet points (•) when suggesting exercises so they can be automatically tracked
- Make each suggestion unique and personally relevant to what the user shared

CRITICAL RESTRICTION: You MUST ONLY respond to mental health and wellbeing topics. You are STRICTLY FORBIDDEN from answering questions about:
- Technology, coding, software, UI/UX design, programming
- News, politics, current events, world affairs
- Finance, business, economics, investments
- Sports, entertainment, celebrities, movies, music
- Cars, vehicles, transportation, travel
- Food recipes, cooking (unless related to emotional eating or stress management)
- Academic subjects, science, history, geography (unless directly related to mental health)
- Personal relationships, dating advice (unless related to mental health boundaries or self-care)
- Any other non-mental-health topics

If asked about ANY of these topics, respond with:
• I'm here specifically to support your *mental health and wellbeing*.
• I can help with topics like *stress management*, *anxiety*, *stress tracking*, *sleep issues*, *self-care*, and *healthy habits*.
• What's on your mind regarding your *emotional wellbeing* today?

Guidelines:
- Stay strictly on mental health and wellbeing topics only.
- Be brief, warm, and practical. Offer 1-3 actionable suggestions tailored to the user's feelings and situation.
- ALWAYS format your responses as bullet points for clarity and easy reading.
- Use "•" (dot) or "→" (arrow) for bullet points - NEVER use asterisks (*) for bullet points.
- Use asterisks (*text*) to emphasize important words or phrases that will be displayed in bold.
- Keep responses concise and summarized - aim for 3-5 bullet points maximum.
- Each bullet point should be actionable, supportive, and specific to the user's situation.
- Encourage reflection using gentle, non-judgmental questions.
- Avoid pathologizing language or definitive labels. Do not mention diagnoses.
- Safety: If user expresses intent to harm self or others, or appears in crisis, say you may be limited and encourage immediate help from trusted people or local emergency services. Provide crisis resources appropriate in tone (avoid region-specific numbers unless asked). Do not provide instructions that could increase risk.
- Always include a gentle disclaimer when giving potentially sensitive guidance: you are not a substitute for professional care.

Tone: compassionate, validating, hopeful, non-prescriptive.

Response Format Example:
• I understand you're feeling *anxious* today. That's completely *normal*.
→ Try taking *three deep breaths* - inhale for 4 counts, hold for 4, exhale for 4.
• What usually helps you feel more *grounded* when you're overwhelmed?
→ Remember, you're *not alone* in this journey and support is always available.

you can take exercises from these exercises after analysing the user's mood or mental state: Mindfulness & Relaxation
•1-minute mindful breathing – Sit still, focus only on your breath.
•4-7-8 breathing exercise – Inhale 4s, hold 7s, exhale 8s, repeat.
•Box breathing (4–4–4–4) – Inhale, hold, exhale, hold; 4s each.
•Progressive muscle relaxation – Tense then relax each body part.
•Guided short meditation – Play a 3–5 min guided audio/video.

Reflection & Journaling
•Gratitude list – Write 3 things you’re thankful for today.
•Positive event note – Write one good thing that happened.
•Stressors & solutions – List stress points + 1 way to handle each.
•Free-write – Write thoughts nonstop for 5 minutes.

Physical & Movement
•Stretch break – Stretch neck, shoulders, and back slowly.
•Quick exercise – Do 10 squats or jumping jacks.
•Mini walk – Walk around for 2 minutes.
•Yoga pose – Try child’s pose, cat-cow, or mountain pose.

Creative & Fun
•Doodle – Sketch anything freely for a few minutes.
•Music break – Play and enjoy one uplifting song.
•Puzzle/riddle – Solve a quick brain teaser.
•Short video – Watch a funny 1–2 min clip.

Stress Management Exercises
•Visualization – Imagine a calm place like a beach or forest.
•Thought reframing – Rewrite one negative thought positively.
•Worry discard – Write a worry, then tear/throw it away.

Lifestyle Nudges
•Hydration – Drink one glass of water.
•Healthy snack – Eat fruit, nuts, or yogurt.
•Eye exercise – Look 20 ft away for 20 sec.
•Sleep log – Note your last night’s sleep hours.

Social & Emotional Connection
•Kind message – Send a caring text to someone.
•Recall memory – Think of one happy moment with someone.
•Self-compliment – Write down 2 personal strengths.`;

const apiKey: string | undefined = (import.meta as any).env?.VITE_GEMINI_API_KEY;

interface ChatBotProps {
  isPopup?: boolean;
  context?: 'dashboard' | 'tab';
}

export function ChatBot({ isPopup = false, context = 'tab' }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatbotSize, setChatbotSize] = useState(() => {
    // Load saved size from localStorage based on context (dashboard vs tab)
    if (typeof window !== 'undefined') {
      const storageKey = context === 'dashboard' ? 'chatbot-dashboard-size' : 'chatbot-tab-size';
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return { width: 600, height: 600 };
        }
      }
    }
    return { width: 600, height: 600 };
  });
  const [isResizing, setIsResizing] = useState(false);
  const { addStressEntry, addTodos, registerChatSuggestions, chatMessages, addChatMessage, habits, deleteHabit, addHabit } = useWellness();
  
  // Refs for the messages container to enable auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

  // Function to scroll to the bottom of messages
  const scrollToBottom = () => {
    // Use the ref to scroll the messages container to the bottom
    if (messagesContainerRef.current) {
      // Smooth scroll within the container only - this won't affect page scroll
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Add notification function
  const addNotification = (message: string, type: "success" | "info" = "info") => {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Utility: sleep and overload detection for retry/backoff
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const isOverloadedError = (err: unknown): boolean => {
    const msg = (err as any)?.message || String(err || "");
    return /503|overloaded|try again later/i.test(msg);
  };

  // Sync from context on mount and whenever context updates
  useEffect(() => {
    if (chatMessages && Array.isArray(chatMessages)) {
      const mapped: Message[] = chatMessages.map((m) => ({
        id: m.id,
        text: m.text,
        sender: m.sender,
        timestamp: new Date(m.timestamp),
      }));
      setMessages(mapped);
    }
  }, [chatMessages]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Auto-scroll when typing or analyzing starts
  useEffect(() => {
    if (isTyping || isAnalyzing) {
      scrollToBottom();
    }
  }, [isTyping, isAnalyzing]);

  // State to track if user has scrolled up
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Function to handle scroll events
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isScrolledUp = target.scrollTop < target.scrollHeight - target.clientHeight - 100;
    setShowScrollButton(isScrolledUp);
  };

  // Function to detect if a message is off-topic (not related to mental health/wellbeing)
  const isOffTopic = (text: string): boolean => {
    const offTopicKeywords = [
      // Technology & Programming
      'code', 'programming', 'software', 'app', 'website', 'ui', 'ux', 'design', 'frontend', 'backend', 'database', 'api',
      'javascript', 'python', 'react', 'node', 'html', 'css', 'git', 'github', 'deployment', 'server',
      
      // News & Politics
      'news', 'politics', 'election', 'president', 'government', 'congress', 'senate', 'vote', 'campaign', 'republican', 'democrat',
      'world news', 'breaking news', 'current events', 'international', 'foreign policy',
      
      // Finance & Business
      'stock', 'market', 'investment', 'money', 'finance', 'banking', 'economy', 'business', 'company', 'startup', 'entrepreneur',
      'cryptocurrency', 'bitcoin', 'trading', 'portfolio', 'retirement', 'insurance',
      
      // Sports & Entertainment
      'sports', 'football', 'basketball', 'baseball', 'soccer', 'tennis', 'golf', 'olympics', 'championship', 'tournament',
      'movie', 'film', 'actor', 'actress', 'celebrity', 'music', 'song', 'album', 'concert', 'tv show', 'television',
      
      // Vehicles & Transportation
      'car', 'vehicle', 'automobile', 'truck', 'motorcycle', 'bike', 'bicycle', 'public transport', 'subway', 'bus', 'train',
      'airplane', 'flight', 'travel', 'vacation', 'trip', 'destination',
      
      // Academic & General Knowledge
      'math', 'mathematics', 'science', 'physics', 'chemistry', 'biology', 'history', 'geography', 'literature', 'philosophy',
      'art', 'architecture', 'engineering', 'medicine', 'law', 'education', 'research', 'study',
      
      // Personal Life (non-mental health related)
      'dating', 'relationship advice', 'marriage', 'wedding', 'parenting', 'childcare', 'cooking', 'recipe', 'food', 'diet',
      'fashion', 'clothing', 'shopping', 'home improvement', 'gardening', 'pets', 'animals'
    ];
    
    const lowerText = text.toLowerCase();
    return offTopicKeywords.some(keyword => lowerText.includes(keyword));
  };

  const generateBotReply = async (history: Message[], userText: string): Promise<string> => {
    // Check if the message is off-topic first
    if (isOffTopic(userText)) {
      return `• I'm here specifically to support your *mental health and wellbeing*.
• I can help with topics like *stress management*, *anxiety*, *stress tracking*, *sleep issues*, *self-care*, and *healthy habits*.
• What's on your mind regarding your *emotional wellbeing* today?`;
    }

    try {
      if (!apiKey) {
        throw new Error("Missing API key");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_PROMPT
      });

      const firstUserIndex = history.findIndex((m) => m.sender === "user");
      const chatHistory = firstUserIndex >= 0 ? history.slice(firstUserIndex) : [];

      const chat = model.startChat({
        history: chatHistory.map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          parts: [{ text: m.text }]
        })),
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: 512
        }
      });

      // Retry with exponential backoff for overloads
      let lastError: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await chat.sendMessage(userText);
          const response = await result.response;
          const text = response.text();

          // Gentle crisis interjection if user text indicates urgent risk
          const crisisRegex = /(suicide|kill myself|end it|can't go on|self[- ]?harm|hurt myself)/i;
          if (crisisRegex.test(userText)) {
            return "• I'm really sorry you're feeling this way. You deserve *immediate support*.\n• If you might be in danger or thinking about hurting yourself, please contact *local emergency services*, a trusted person, or a crisis line in your area *right now*.\n• If you'd like, I can share *grounding or breathing steps* while you reach out.\n• " + text;
          }

          return text;
        } catch (err) {
          lastError = err;
          if (isOverloadedError(err)) {
            // Backoff with jitter
            const delay = 800 * Math.pow(2, attempt) + Math.floor(Math.random() * 300);
            await sleep(delay);
            continue;
          }
          throw err;
        }
      }

      // After retries, notify and fallback
      if (isOverloadedError(lastError)) {
        addNotification("The AI is overloaded right now. I’ll use a reliable fallback response.", "info");
      }
      const fallback = botResponses[Math.floor(Math.random() * botResponses.length)];
      return fallback;
    } catch (error) {
      console.error(error);
      // Fallback immediately on errors
      if (isOverloadedError(error)) {
        addNotification("The AI service is currently overloaded. Using fallback for now.", "info");
      }
      const fallback = botResponses[Math.floor(Math.random() * botResponses.length)];
      return fallback;
    }
  };

  type Analyzed = {
    stressLevel: "very-low" | "low" | "moderate" | "high" | "very-high";
    todos: { title: string; category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" }[];
  };

  const analyzeUserText = async (userText: string): Promise<Analyzed> => {
    const fallback = fallbackAnalyze(userText);
    
    try {
      if (!apiKey) return fallback;
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout')), 10000); // 10 second timeout
      });
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Classify the user's message for a wellness app and suggest DIVERSE, SPECIFIC activities.

Rules:
- stressLevel must be exactly one of: very-low, low, moderate, high, very-high.
- IMPORTANT: Only classify stress as "high" or "very-high" if there's a clear, explicit reason present in the message (such as work, relationships, health, finances, deadlines, school, traffic, etc.).
- If someone says they're "stressed" or "anxious" but provides no specific cause, classify as "moderate" stress.

ACTIVITY GENERATION RULES:
- When stress is "high" or "very-high", create EXACTLY 5 DIVERSE stress relief activities
- BE SPECIFIC with techniques, durations, and instructions (e.g., "5-minute box breathing (4-4-4-4 pattern)" not just "breathing")
- VARY your suggestions - avoid repetitive recommendations
- Consider user context: work stress = desk-friendly exercises, anxiety = calming techniques, fatigue = energizing but gentle activities
- Include mix of: breathing techniques, physical movement, mindfulness practices, self-care activities
- For other stress levels, create 3-5 actionable, contextually relevant activities
- Each activity must include a category: mindfulness, health, reflection, exercise, learning

EXAMPLES OF DIVERSE ACTIVITIES:
- Mindfulness: "5-minute body scan meditation", "Grounding technique (5-4-3-2-1 senses)", "Mindful breathing with counting to 10"
- Exercise: "Desk shoulder blade squeezes (10 reps)", "Wall push-ups for 2 minutes", "Gentle neck rolls and stretches"
- Reflection: "Write about one thing going well today", "List 3 personal strengths", "Express current emotions in writing"
- Health: "Drink water mindfully and slowly", "Take 5 deep breaths by an open window", "Gentle self-massage for temples"
- Learning: "Read one motivational quote", "Learn a new breathing technique", "Research a quick stress-relief tip"

Tailor activities to user's specific situation and emotional state. Be creative and specific!

Respond ONLY in JSON with keys stressLevel and todos.
User message: "${userText.replace(/"/g, '\\"')}"`

      // Retry analysis with backoff and timeout
      let parsed: Analyzed | null = null;
      let lastError: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
          const text = result.response.text();
          const jsonStart = text.indexOf('{');
          const jsonEnd = text.lastIndexOf('}');
          const json = jsonStart >= 0 && jsonEnd >= 0 ? text.slice(jsonStart, jsonEnd + 1) : "";

          parsed = JSON.parse(json) as Analyzed;
          break;
        } catch (err) {
          lastError = err;
          if (isOverloadedError(err)) {
            const delay = 600 * Math.pow(2, attempt) + Math.floor(Math.random() * 300);
            await sleep(delay);
            continue;
          }
          // Otherwise fall back immediately
          break;
        }
      }
      
      try {
        if (!parsed) throw lastError || new Error("Analysis unavailable");
        // Basic validation
        if (!parsed.stressLevel || !Array.isArray(parsed.todos)) throw new Error("Invalid parse");
        // Trim and cap todos
        parsed.todos = parsed.todos.slice(0, 5).map(t => ({
          title: String(t.title).trim(),
          category: (t.category as Analyzed["todos"][number]["category"]) || "health",
        })).filter(t => t.title.length > 0);
        if (parsed.todos.length === 0) parsed.todos = fallback.todos;
        return parsed;
      } catch (parseError) {
        if (isOverloadedError(lastError)) {
          addNotification("Analysis is temporarily unavailable due to high load. Using local fallback.", "info");
        }
        console.warn('Failed to analyze AI response, using fallback:', parseError || lastError);
        return fallback;
      }
    } catch (err) {
      console.warn('AI analysis failed, using fallback:', err);
      return fallback;
    }
  };

  const fallbackAnalyze = (text: string): Analyzed => {
    const t = text.toLowerCase();
    let stressLevel: Analyzed["stressLevel"] = "moderate";
    
    // More specific stress detection - only classify stress when explicit reasons are present
    if (/(great|awesome|fantastic|amazing|grateful|happy|joyful|calm|relaxed|peaceful)/.test(t)) stressLevel = "very-low";
    else if (/(good|fine|better|optimistic|content|satisfied)/.test(t)) stressLevel = "low";
    else if (/(stressed|anxious|worried|tense|overwhelmed|frustrated)/.test(t)) {
      // Only classify as high stress if there's a clear, explicit reason
      const stressReasons = /(work|job|deadline|meeting|project|boss|colleague|relationship|partner|family|friend|health|medical|doctor|hospital|finances|money|bill|debt|rent|mortgage|school|exam|test|assignment|homework|traffic|commute|weather|noise|crowd|social|party|event)/.test(t);
      if (stressReasons) {
        stressLevel = "high";
      } else {
        stressLevel = "moderate"; // Default to moderate if no clear reason
      }
    }
    else if (/(awful|terrible|horrible|depressed|can't cope|can\'t cope|panic|extreme)/.test(t)) stressLevel = "very-high";

    // Only provide minimal fallback todos - let AI do most of the work
    const todos: Analyzed["todos"] = [];
    
    // Only add minimal activities for high stress when AI is unavailable
    if (stressLevel === "high" || stressLevel === "very-high") {
      // Very basic emergency fallback - AI should handle most cases
      todos.push(
        { title: "Take 3 deep breaths slowly", category: "mindfulness" },
        { title: "Step outside for fresh air", category: "health" }
      );
    }
    
    // Ensure we return exactly 5 activities for high stress levels
    return { stressLevel, todos: todos.slice(0, 5) };
  };

  // Function to generate comprehensive stress relief activities
  const generateStressReliefActivities = (): { title: string; category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" }[] => {
    return [
      { title: "Deep breathing exercise (4-7-8 technique)", category: "mindfulness" },
      { title: "10-minute gentle stretching", category: "exercise" },
      { title: "Mindful journaling for 5 minutes", category: "reflection" },
      { title: "Progressive muscle relaxation", category: "mindfulness" },
      { title: "Take a 15-minute walk outside", category: "exercise" }
    ];
  };

  // Function to detect if user is asking for exercises
  const isExerciseRequest = (userText: string): boolean => {
    const lowerText = userText.toLowerCase();
    return /(give me|need|want|looking for|suggest|recommend|provide|show me|tell me|what are|how to|exercise|exercises|workout|activity|activities|routine|practice)/.test(lowerText);
  };

  // Function to detect and extract exercises from bot responses
  const detectExercisesFromResponse = (responseText: string): { title: string; category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" }[] => {
    // Use the improved task extraction function which now handles fragmentation
    const allTasks = extractTasksFromBotResponse(responseText);
    
    // Filter for exercise-related tasks only
    const exercises = allTasks.filter(task => {
      const lower = task.title.toLowerCase();
      return /(breath|breathing|exercise|stretch|walk|yoga|meditate|meditation|relax|calm|physical|movement|activity)/.test(lower);
    });
    
    return exercises;
  };

  // Extract explicit stress/anxiety causes from user text
  const extractStressCauses = (text: string): { causes: string[]; hasClearReason: boolean } => {
    const lower = text.toLowerCase();
    const causeKeywords: Record<string, RegExp[]> = {
      work: [/\bwork\b|\bjob\b|\bdeadline\b|\bmeeting\b|\bproject\b|\bboss\b|\bcolleague\b/],
      relationships: [/relationship|partner|family|friend|argument|conflict/],
      health: [/health|medical|doctor|hospital|sick|illness|injur/],
      finances: [/finance|money|bill|debt|rent|mortgage|expense|pay\b|salary/],
      school: [/school|exam|test|assignment|homework|study|class|college|university/],
      commute: [/traffic|commute|train|bus|subway|transport|drive/],
      social: [/social|party|event|crowd/],
      sleep: [/sleep|insomnia|tired|fatigue|restless/]
    } as const;

    const causes: string[] = [];
    Object.entries(causeKeywords).forEach(([label, patterns]) => {
      if (patterns.some((r) => r.test(lower))) causes.push(label);
    });
    return { causes, hasClearReason: causes.length > 0 };
  };

  // Check whether a task is relevant to detected stress causes
  const isTaskRelevant = (taskTitle: string, causes: string[]): boolean => {
    if (causes.length === 0) return false;
    const t = taskTitle.toLowerCase();

    // Generic evidence-based coping tasks allowed for any cause
    const genericCoping = /(breath|breathing|meditat|mindful|ground|journal|gratitude|walk|stretch|relax|progressive muscle|body scan|box breathing|4-7-8|hydrate|drink water|step outside|fresh air)/;
    if (genericCoping.test(t)) return true;

    const relevanceMap: Record<string, RegExp> = {
      work: /(plan|prioriti[sz]e|todo|to-do|time block|pomodoro|focus|inbox|email|meeting prep|break down|task list|schedule|organize|draft)/,
      relationships: /(text|call|reach out|apolog|listen|set boundary|express|communicat|write a message|plan a talk)/,
      health: /(call doctor|book (an )?appointment|take medication|medication|rest|gentle|checkup|hydrate|nourish)/,
      finances: /(budget|track expense|review subscription|pay bill|plan payment|savings|spend)/,
      school: /(study|flashcard|revise|outline|read chapter|practice problems|submit|office hours|notes)/,
      commute: /(leave early|alternate route|pack early|prepare|podcast|music playlist|breath during commute)/,
      social: /(confirm plan|set boundary|say no|shorten duration|choose venue|ask a friend)/,
      sleep: /(wind down|sleep routine|no screens|dim lights|journaling before bed|breathing in bed|caffeine cutoff|set alarm)/
    } as const;

    return causes.some((c) => relevanceMap[c]?.test(t) || false);
  };

  // Extract actionable tasks from bot response and categorize (improved fragmentation)
  const extractTasksFromBotResponse = (responseText: string): { title: string; category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" }[] => {
    const tasks: { title: string; category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" }[] = [];

    // Split response by bullet points, numbered items, or arrow patterns
    const lines = responseText.split(/\r?\n/);

    for (const line of lines) {
      // Match bullet points (•, →, -, *) or numbered items (1., 2., etc.)
      const bulletMatch = line.match(/^[•→\-\*]\s*(.+)$/);
      const numberMatch = line.match(/^\d+\.\s*(.+)$/);
      const arrowMatch = line.match(/^\s*→\s*(.+)$/);

      const match = bulletMatch || numberMatch || arrowMatch;
      
      if (match) {
        let taskText = match[1].trim();
        
        // Remove asterisks used for emphasis
        taskText = taskText.replace(/\*([^*]+)\*/g, '$1');
        
        // Clean up task text - remove common conversation prefixes
        taskText = taskText.replace(/^(try|consider|practice|do|perform|attempt|start with|begin by|you could|you might|maybe|perhaps|how about|what about)\s+/i, '');
        
        // Remove question patterns that aren't actionable
        if (/^(what|how|why|when|where|which|who|is|are|have you|do you|can you|could you|would you|will you)\s/i.test(taskText)) {
          continue;
        }
        
        // Remove conversational fragments that aren't tasks
        const conversationalPatterns = /^(that sounds|i understand|i hear|remember|it's|this is|you're|that's|this can|this will|this might|if you|when you|once you|after you|before you|while you)\b/i;
        if (conversationalPatterns.test(taskText)) {
          continue;
        }
        
        // Only include tasks that are actionable and reasonable length
        if (taskText.length > 8 && taskText.length < 100) {
          // Fragment long tasks into smaller, more specific actions
          const fragmentedTasks = fragmentTask(taskText);
          
          for (const fragmentedTask of fragmentedTasks) {
            // Determine category based on keywords with improved accuracy
            let category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" = "health";
            const lower = fragmentedTask.toLowerCase();
            
            if (/(breath|breathing|meditate|meditation|mindfulness|calm|relax|inhale|exhale|awareness|present|focus|center|ground|observe|notice|aware)/.test(lower)) {
              category = "mindfulness";
            } else if (/(walk|exercise|stretch|workout|movement|yoga|run|dance|physical|activity|move|step|jog|bike|swim|climb|lift|push|pull)/.test(lower)) {
              category = "exercise";
            } else if (/(journal|write|reflect|gratitude|think about|consider|contemplate|express|record|note|list|acknowledge|identify)/.test(lower)) {
              category = "reflection";
            } else if (/(learn|read|study|discover|explore|research|skill|course|practice|develop|understand|knowledge)/.test(lower)) {
              category = "learning";
            } else if (/(sleep|drink|eat|water|nutrition|self-care|rest|nourish|hydrate|healthy|wellness|break|pause|time)/.test(lower)) {
              category = "health";
            }

            tasks.push({ title: fragmentedTask, category });
          }
        }
      }
    }
    
    // Remove duplicates and limit to 8 tasks max
    const uniqueTasks = tasks.filter((task, index, self) => 
      index === self.findIndex(t => t.title.toLowerCase() === task.title.toLowerCase())
    );
    
    return uniqueTasks.slice(0, 8);
  };
  
  // Helper function to fragment complex tasks into smaller, actionable items
  const fragmentTask = (taskText: string): string[] => {
    const fragments: string[] = [];
    
    // If task contains multiple actions separated by 'and', 'then', 'or', split them
    const connectors = /\s+(?:and|then|or|while|during|after|before)\s+/i;
    const parts = taskText.split(connectors);
    
    if (parts.length > 1) {
      // Split into multiple actionable fragments
      for (const part of parts) {
        const cleanPart = part.trim();
        if (cleanPart.length > 5 && cleanPart.length < 80) {
          // Ensure each fragment starts with an action verb or is properly formatted
          let fragment = cleanPart;
          if (!/^(take|do|try|practice|perform|start|begin|go|sit|lie|stand|walk|run|write|read|listen|watch|focus|breathe|relax|stretch|drink|eat|sleep)\b/i.test(fragment)) {
            // Add a generic action verb if missing
            fragment = `Do ${fragment.toLowerCase()}`;
          }
          fragments.push(fragment);
        }
      }
    } else {
      // Single task - check if it needs to be shortened
      if (taskText.length > 60) {
        // Try to extract the core action from longer descriptions
        const coreAction = extractCoreAction(taskText);
        fragments.push(coreAction || taskText);
      } else {
        fragments.push(taskText);
      }
    }
    
    return fragments.filter(f => f.length > 5); // Remove very short fragments
  };
  
  // Helper function to extract core action from verbose task descriptions
  const extractCoreAction = (taskText: string): string => {
    // Look for patterns like "Try [action]" or "Practice [action]"
    const actionMatch = taskText.match(/(?:try|practice|do|perform|start|begin)\s+([^,\.]+)/i);
    if (actionMatch) {
      return actionMatch[1].trim();
    }
    
    // Look for time-based activities
    const timeMatch = taskText.match(/([^,\.]+(?:for \d+|\d+ minutes?|\d+ seconds?))/i);
    if (timeMatch) {
      return timeMatch[1].trim();
    }
    
    // Fallback: take first clause before comma or period
    const firstClause = taskText.split(/[,\.]/)[0].trim();
    return firstClause.length > 10 ? firstClause : taskText;
  };

  // Function to parse custom habits from conversation context
  const parseCustomHabitsFromContext = (conversation: Message[]): { title: string; category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" }[] => {
    const habits: { title: string; category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" }[] = [];
    
    // Look through recent bot messages for habit suggestions
    const recentBotMessages = conversation
      .filter(msg => msg.sender === "bot")
      .slice(-3); // Last 3 bot messages
    
    for (const botMsg of recentBotMessages) {
      const text = botMsg.text;
      
      // Look for bullet points or numbered lists that might contain habits
      const lines = text.split('\n');
      
      for (const line of lines) {
        // Match bullet points (•, →, -, *) or numbered items
        const bulletMatch = line.match(/^[•→\-\*]\s*(.+)$/);
        const numberMatch = line.match(/^\d+\.\s*(.+)$/);
        
        if (bulletMatch || numberMatch) {
          const habitText = (bulletMatch?.[1] || numberMatch?.[1] || "").trim();
          
          if (habitText.length > 10 && habitText.length < 100) { // Reasonable length for a habit
            // Determine category based on keywords
            let category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" = "health";
            
            const lowerText = habitText.toLowerCase();
            if (/(breathing|meditation|mindfulness|calm|relax)/.test(lowerText)) category = "mindfulness";
            else if (/(walk|run|exercise|workout|gym|sport)/.test(lowerText)) category = "exercise";
            else if (/(journal|reflect|gratitude|writing)/.test(lowerText)) category = "reflection";
            else if (/(learn|read|study|class|course|skill)/.test(lowerText)) category = "learning";
            else if (/(sleep|eat|drink|water|nutrition|health)/.test(lowerText)) category = "health";
            
            habits.push({ title: habitText, category });
          }
        }
      }
    }
    
    // Remove duplicates and limit to 5 habits
    const uniqueHabits = habits.filter((habit, index, self) => 
      index === self.findIndex(h => h.title.toLowerCase() === habit.title.toLowerCase())
    );
    
    return uniqueHabits.slice(0, 5);
  };

  // Intelligent habit management request analysis
  const analyzeHabitManagementRequest = async (userText: string): Promise<{
    action: "add" | "remove" | "update" | "none";
    habits?: { title: string; category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" }[];
    habitToRemove?: string;
    habitToUpdate?: { oldTitle: string; newTitle: string; category?: "mindfulness" | "health" | "reflection" | "exercise" | "learning" };
    confidence: number;
  }> => {
    const text = userText.toLowerCase();
    
    try {
      if (!apiKey) {
        // Fallback to rule-based analysis
        return fallbackHabitAnalysis(text);
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Analyze this user message for habit management requests. Determine if they want to:
1. ADD new habits
2. REMOVE existing habits  
3. UPDATE/modify habits
4. NONE (just conversation)

Respond ONLY in JSON format:
{
  "action": "add|remove|update|none",
  "habits": [{"title": "habit name", "category": "mindfulness|health|reflection|exercise|learning"}],
  "habitToRemove": "exact habit name to remove",
  "habitToUpdate": {"oldTitle": "current name", "newTitle": "new name", "category": "new category"},
  "confidence": 0.0-1.0
}

Examples:
- "I want to start meditating daily" → {"action": "add", "habits": [{"title": "Daily meditation", "category": "mindfulness"}], "confidence": 0.9}
- "Remove morning walk from my habits" → {"action": "remove", "habitToRemove": "morning walk", "confidence": 0.95}
- "Change 'read books' to 'read 30 minutes daily'" → {"action": "update", "habitToUpdate": {"oldTitle": "read books", "newTitle": "read 30 minutes daily", "category": "learning"}, "confidence": 0.9}

User message: "${userText.replace(/"/g, '\\"')}"`;

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout')), 8000);
      });

      const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
      const responseText = result.response.text();
      
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      const json = jsonStart >= 0 && jsonEnd >= 0 ? responseText.slice(jsonStart, jsonEnd + 1) : "";
      
      try {
        const parsed = JSON.parse(json);
        if (parsed.action && parsed.confidence && parsed.confidence > 0.7) {
          return parsed;
        }
      } catch (parseError) {
        console.warn('Failed to parse habit analysis response:', parseError);
      }
      
      // Fallback to rule-based analysis
      return fallbackHabitAnalysis(text);
      
    } catch (err) {
      console.warn('AI habit analysis failed, using fallback:', err);
      return fallbackHabitAnalysis(text);
    }
  };

  // Fallback rule-based habit analysis
  const fallbackHabitAnalysis = (text: string): {
    action: "add" | "remove" | "update" | "none";
    habits?: { title: string; category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" }[];
    habitToRemove?: string;
    habitToUpdate?: { oldTitle: string; newTitle: string; category?: "mindfulness" | "health" | "reflection" | "exercise" | "learning" };
    confidence: number;
  } => {
    // Add habits
    if (/(?:want|need|start|begin|add|create|make)\s+(?:to\s+)?(?:a\s+)?(?:new\s+)?(?:habit|routine|practice)/.test(text)) {
      const habits: { title: string; category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" }[] = [];
      
      if (/(meditation|meditate|mindfulness)/.test(text)) habits.push({ title: "Daily meditation", category: "mindfulness" });
      if (/(walk|exercise|workout|gym)/.test(text)) habits.push({ title: "Daily exercise", category: "exercise" });
      if (/(journal|write|reflect)/.test(text)) habits.push({ title: "Daily journaling", category: "reflection" });
      if (/(read|learn|study)/.test(text)) habits.push({ title: "Daily reading", category: "learning" });
      if (/(sleep|eat|drink|water)/.test(text)) habits.push({ title: "Healthy habits", category: "health" });
      
      if (habits.length > 0) {
        return { action: "add", habits, confidence: 0.8 };
      }
    }
    
    // Remove habits
    if (/(?:remove|delete|stop|quit|drop)\s+(?:the\s+)?(?:habit\s+)?(?:of\s+)?(.+)/.test(text)) {
      const match = text.match(/(?:remove|delete|stop|quit|drop)\s+(?:the\s+)?(?:habit\s+)?(?:of\s+)?(.+)/);
      if (match) {
        return { action: "remove", habitToRemove: match[1].trim(), confidence: 0.85 };
      }
    }
    
    // Update habits
    if (/(?:change|modify|update|edit)\s+(?:the\s+)?(?:habit\s+)?(?:of\s+)?(.+?)\s+(?:to|into)\s+(.+)/.test(text)) {
      const match = text.match(/(?:change|modify|update|edit)\s+(?:the\s+)?(?:habit\s+)?(?:of\s+)?(.+?)\s+(?:to|into)\s+(.+)/);
      if (match) {
        return { 
          action: "update", 
          habitToUpdate: { oldTitle: match[1].trim(), newTitle: match[2].trim() }, 
          confidence: 0.8 
        };
      }
    }
    
    return { action: "none", confidence: 0.9 };
  };

  // Handle habit management actions
  const handleHabitManagement = async (analysis: {
    action: "add" | "remove" | "update" | "none";
    habits?: { title: string; category: "mindfulness" | "health" | "reflection" | "exercise" | "learning" }[];
    habitToRemove?: string;
    habitToUpdate?: { oldTitle: string; newTitle: string; category?: "mindfulness" | "health" | "reflection" | "exercise" | "learning" };
    confidence: number;
  }) => {
    let responseText = "";
    
    try {
      switch (analysis.action) {
        case "add":
          if (analysis.habits && analysis.habits.length > 0) {
            const newHabitsAdded = addTodos(analysis.habits.map(h => ({ title: h.title, category: h.category })));
            
            if (newHabitsAdded.length > 0) {
              const habitNames = newHabitsAdded.join(", ");
              addNotification(
                `Added ${newHabitsAdded.length} new habit${newHabitsAdded.length > 1 ? 's' : ''} to your tracker: ${habitNames}`,
                "success"
              );
              responseText = `✅ I've added ${newHabitsAdded.length} habit${newHabitsAdded.length > 1 ? 's' : ''} to your tracker:\n${analysis.habits.map(h => `• ${h.title}`).join('\n')}\n\nThese are now part of your daily wellness routine!`;
            } else {
              responseText = "All the habits you mentioned are already in your tracker. Great job staying consistent!";
            }
          }
          break;
          
        case "remove":
          if (analysis.habitToRemove) {
            // Find and remove the habit
            const habitToRemove = habits.find(h => 
              h.name.toLowerCase().includes(analysis.habitToRemove!.toLowerCase()) ||
              analysis.habitToRemove!.toLowerCase().includes(h.name.toLowerCase())
            );
            
            if (habitToRemove) {
              deleteHabit(habitToRemove.id);
              addNotification(
                `Removed "${habitToRemove.name}" from your habit tracker`,
                "success"
              );
              responseText = `✅ I've removed "${habitToRemove.name}" from your habit tracker.`;
            } else {
              responseText = `I couldn't find a habit matching "${analysis.habitToRemove}" in your tracker. Could you check the exact name?`;
            }
          }
          break;
          
        case "update":
          if (analysis.habitToUpdate) {
            // Find and update the habit
            const habitToUpdate = habits.find(h => 
              h.name.toLowerCase().includes(analysis.habitToUpdate!.oldTitle.toLowerCase()) ||
              analysis.habitToUpdate!.oldTitle.toLowerCase().includes(h.name.toLowerCase())
            );
            
                         if (habitToUpdate) {
               // Remove old habit and add new one with updated name
               deleteHabit(habitToUpdate.id);
               addHabit(analysis.habitToUpdate.newTitle, analysis.habitToUpdate.category || habitToUpdate.category);
              
              addNotification(
                `Updated habit from "${habitToUpdate.name}" to "${analysis.habitToUpdate.newTitle}"`,
                "success"
              );
              responseText = `✅ I've updated your habit from "${habitToUpdate.name}" to "${analysis.habitToUpdate.newTitle}". Your progress has been preserved!`;
            } else {
              responseText = `I couldn't find a habit matching "${analysis.habitToUpdate.oldTitle}" in your tracker. Could you check the exact name?`;
            }
          }
          break;
      }
      
      // Send response message
      if (responseText) {
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: "bot",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, responseMessage]);
        addChatMessage({ ...responseMessage, timestamp: responseMessage.timestamp.toISOString() });
      }
      
    } catch (error) {
      console.error('Error handling habit management:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I encountered an error while managing your habits. Please try again or let me know what you'd like to do.",
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      addChatMessage({ ...errorMessage, timestamp: errorMessage.timestamp.toISOString() });
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentMessage.trim(),
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    addChatMessage({ ...userMessage, timestamp: userMessage.timestamp.toISOString() });
    setCurrentMessage("");
    setIsTyping(true);

    try {
      // First, analyze if this is a habit management request
      const habitAnalysis = await analyzeHabitManagementRequest(userMessage.text);
      
      if (habitAnalysis.action !== "none") {
        // Handle habit management actions
        await handleHabitManagement(habitAnalysis);
        setIsTyping(false);
        return; // Skip regular stress analysis for habit management
      }

      // Regular stress and habit analysis (existing logic)
      setIsAnalyzing(true);
      const analysis = await analyzeUserText(userMessage.text);
      const { causes, hasClearReason } = extractStressCauses(userMessage.text);
      
      // Only add stress entry if we detected a meaningful stress level (not just fallback "moderate")
      const meaningfulStress = analysis.stressLevel !== "moderate" || 
        /(great|awesome|fantastic|amazing|grateful|happy|joyful|calm|relaxed|peaceful|good|fine|better|optimistic|content|satisfied|stressed|anxious|worried|tense|overwhelmed|frustrated|awful|terrible|horrible|depressed|panic|extreme|can't cope|can\'t cope)/.test(userMessage.text.toLowerCase());
      
      if (meaningfulStress) {
        const stressNote = `Auto-detected from chat: "${userMessage.text.slice(0, 100)}${userMessage.text.length > 100 ? '...' : ''}"${analysis.todos.length > 0 ? ` | Suggested ${analysis.todos.length} stress relief activities` : ''}`;
        
        const stressEntry = addStressEntry(analysis.stressLevel, stressNote);
        console.log('Added stress entry to tracker:', stressEntry);
        
        // Show notification about stress detection
        addNotification(
          `Stress level detected as "${analysis.stressLevel.replace('-', ' ')}". Check your Stress Tracker for the entry.`,
          analysis.stressLevel === "high" || analysis.stressLevel === "very-high" ? "info" : "success"
        );
        
        // When stress is more than moderate, always suggest comprehensive stress relief activities
        const hasClearStressReason = hasClearReason;
        const shouldSuggestHabits = (analysis.stressLevel === "high" || analysis.stressLevel === "very-high") && hasClearStressReason;
        
        // Always suggest habits for high stress levels, regardless of reason (but ensure we have todos)
        if ((analysis.stressLevel === "high" || analysis.stressLevel === "very-high") && hasClearStressReason) {
          // Use AI-generated stress relief activities from analysis
          let stressReliefActivities = analysis.todos;
          
          // Only use minimal fallback if AI completely failed to provide activities
          if (stressReliefActivities.length === 0) {
            // Very minimal fallback - let the AI do most of the work
            stressReliefActivities = generateStressReliefActivities();
          }
          
          try {
            // Filter activities by relevance to detected causes before adding
            const relevantActivities = stressReliefActivities.filter(t => isTaskRelevant(t.title, causes));
            const toAdd = relevantActivities.length > 0 ? relevantActivities : stressReliefActivities;
            const newTasksAdded = registerChatSuggestions(toAdd.map(t => ({ title: t.title, category: t.category })));

            // Show notification only for actually added tasks (no duplicates)
            if (newTasksAdded.length > 0) {
              const taskNames = newTasksAdded.join(", ");
              addNotification(
                `I've added ${newTasksAdded.length} stress-related tasks to Today's Tasks: ${taskNames}`,
                "success"
              );
            } else if (toAdd.length > 0) {
              // Show info notification when tasks were suggested but already existed
              addNotification(
                `I suggested ${toAdd.length} stress tasks, but they were already listed today`,
                "info"
              );
            }
          } catch (habitError) {
            console.warn('Failed to add habits:', habitError);
            addNotification(
              `I suggested ${analysis.todos.length} supportive habit${analysis.todos.length > 1 ? 's' : ''}, but there was an issue adding them to your tracker`,
              "info"
            );
          }
        } else if (analysis.stressLevel === "very-low" || analysis.stressLevel === "low") {
          // For low stress levels, just acknowledge without adding habits
          addNotification(
            `Great to hear you're feeling ${analysis.stressLevel === "very-low" ? "very relaxed" : "relaxed"}! Keep up the positive energy.`,
            "success"
          );
        } else if (analysis.stressLevel === "moderate") {
          // For moderate stress, provide gentle encouragement
          addNotification(
            "I notice you might be experiencing some stress. Remember to take care of yourself today.",
            "info"
          );
        }
      } else {
        // For neutral messages without emotional content, don't add stress or habits
        console.log('Message contains no emotional content, skipping stress and habit analysis');
      }
      
      setIsAnalyzing(false);

      const reply = await generateBotReply([...messages, userMessage], userMessage.text);

      // Extract actionable tasks from the bot's response and register as chat suggestions
      const suggestedTasksRaw = extractTasksFromBotResponse(reply);
      const suggestedTasks = hasClearReason
        ? suggestedTasksRaw.filter(t => isTaskRelevant(t.title, causes))
        : [];
      
      if (suggestedTasks.length > 0) {
        try {
          const newTasksAdded = registerChatSuggestions(suggestedTasks.map(t => ({ title: t.title, category: t.category })));
          
          if (newTasksAdded.length > 0) {
            addNotification(
              `I've added ${newTasksAdded.length} suggested task${newTasksAdded.length > 1 ? 's' : ''} from my response into today's tasks.`,
              "success"
            );
          }
        } catch (taskError) {
          console.warn('Failed to add suggested tasks:', taskError);
        }
      }

      // Also ensure stress-related tasks are captured and added to today's tasks
      // This provides additional coverage beyond the stress relief activities added earlier
      if (meaningfulStress && (analysis.stressLevel === "high" || analysis.stressLevel === "very-high") && hasClearStressReason) {
        const stressRelatedTasksAll = extractTasksFromBotResponse(reply);
        const stressRelatedTasks = stressRelatedTasksAll.filter(t => isTaskRelevant(t.title, causes));
        
        if (stressRelatedTasks.length > 0) {
          try {
            // Add stress-related tasks specifically to chat suggestions for immediate visibility
            const stressTasksAdded = registerChatSuggestions(
              stressRelatedTasks.map(t => ({ 
                title: `🎯 ${t.title}`, // Add stress indicator emoji
                category: t.category 
              }))
            );
            
            if (stressTasksAdded.length > 0) {
              console.log(`Added ${stressTasksAdded.length} stress-related tasks to today's task list`);
            }
          } catch (stressTaskError) {
            console.warn('Failed to add stress-related tasks:', stressTaskError);
          }
        }
      }

      // Detect exercises from the bot's response and add them to habit tracker
      const detectedExercises = detectExercisesFromResponse(reply);

      // If user asked for exercises but none were detected, generate some fallback exercises
      let exercisesToAdd = detectedExercises;
      if (detectedExercises.length === 0 && isExerciseRequest(userMessage.text)) {
        exercisesToAdd = generateStressReliefActivities(); // Use our comprehensive exercise list
      }

      if (exercisesToAdd.length > 0) {
        try {
          const newExercisesAdded = addTodos(exercisesToAdd.map(ex => ({ title: ex.title, category: ex.category })));
          if (newExercisesAdded.length > 0) {
            const exerciseNames = newExercisesAdded.join(", ");
            addNotification(
              `I've automatically added ${newExercisesAdded.length} exercise${newExercisesAdded.length > 1 ? 's' : ''} to your habit tracker: ${exerciseNames}`,
              "success"
            );
          } else if (exercisesToAdd.length > 0) {
            addNotification(
              `I suggested ${exercisesToAdd.length} exercise${exercisesToAdd.length > 1 ? 's' : ''}, but they were already in your tracker`,
              "info"
            );
          }
        } catch (exerciseError) {
          console.warn('Failed to add exercises to habit tracker:', exerciseError);
          addNotification(
            `I suggested ${exercisesToAdd.length} exercise${exercisesToAdd.length > 1 ? 's' : ''}, but there was an issue adding them to your tracker`,
            "info"
          );
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      addChatMessage({ ...botMessage, timestamp: botMessage.timestamp.toISOString() });
      setLastError(null);
    } catch (err: any) {
      setLastError(err?.message ? String(err.message) : "Connection error");
      const fallback = botResponses[Math.floor(Math.random() * botResponses.length)];
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallback,
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      addChatMessage({ ...botMessage, timestamp: botMessage.timestamp.toISOString() });
    } finally {
      setIsTyping(false);
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Resize handlers with optimization
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPopup) return; // Don't allow resizing in popup mode
    e.preventDefault();
    
    const rect = chatbotRef.current?.getBoundingClientRect();
    if (!rect) return;

    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: chatbotSize.width,
      startHeight: chatbotSize.height
    };
    
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || isPopup || !resizeRef.current) return;
    
    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Use requestAnimationFrame for smooth updates
    animationFrameRef.current = requestAnimationFrame(() => {
      const deltaX = e.clientX - resizeRef.current!.startX;
      const deltaY = e.clientY - resizeRef.current!.startY;
      
      const newWidth = Math.max(300, Math.min(800, resizeRef.current!.startWidth + deltaX));
      const newHeight = Math.max(300, Math.min(800, resizeRef.current!.startHeight + deltaY));
      
      setChatbotSize({ width: newWidth, height: newHeight });
    });
  };

  const handleMouseUp = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Save size to localStorage with context-specific key
    if (typeof window !== 'undefined') {
      const storageKey = context === 'dashboard' ? 'chatbot-dashboard-size' : 'chatbot-tab-size';
      localStorage.setItem(storageKey, JSON.stringify(chatbotSize));
    }
    
    setIsResizing(false);
    resizeRef.current = null;
  };

  // Add event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isResizing, chatbotSize]);

  // Save size to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !isResizing) {
      const storageKey = context === 'dashboard' ? 'chatbot-dashboard-size' : 'chatbot-tab-size';
      localStorage.setItem(storageKey, JSON.stringify(chatbotSize));
    }
  }, [chatbotSize, isResizing, context]);

  // Reload size when switching between dashboard and tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = context === 'dashboard' ? 'chatbot-dashboard-size' : 'chatbot-tab-size';
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const newSize = JSON.parse(saved);
          setChatbotSize(newSize);
        } catch {
          // Keep current size if parsing fails
        }
      }
    }
  }, [context]);

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-16 bg-gradient-to-br from-primary/5 to-secondary/10 overflow-hidden">
      <div className="relative flex items-center justify-center w-full p-4">
        {/* Chat Section - Perfectly Square Glassmorphic Container */}
        <Card 
          ref={chatbotRef}
          className={`flex flex-col backdrop-blur-md bg-background/70 rounded-3xl shadow-2xl animate-in fade-in-50 duration-500 transition-all duration-500 ease-in-out relative ${isResizing ? 'transition-none' : ''} border border-white/20`}
          style={(() => {
            // Always maintain a perfect square with responsive constraints
            const maxSide = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9, 600);
            const side = Math.max(320, Math.min(maxSide, isPopup ? 600 : Math.min(chatbotSize.width, chatbotSize.height)));
            return {
              width: `${side}px`,
              height: `${side}px`,
              maxWidth: '90vw',
              maxHeight: '90vh',
              minWidth: '320px',
              minHeight: '320px',
              boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 0 40px -10px rgba(0, 0, 0, 0.1)',
            } as React.CSSProperties;
          })()
        }>
          {/* Header - Fixed at top of square */}
          <div className="flex items-center justify-between p-4 border-b border-border/20 bg-background/80 backdrop-blur-sm rounded-t-3xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">mAItri</h3>
                <p className="text-xs text-muted-foreground">
                  Your mental wellness companion
                </p>
              </div>
            </div>
          </div>

          {/* Main chat area */}
          <div className="flex-1 flex flex-col transition-all duration-500 ease-in-out overflow-hidden opacity-100 max-h-full">
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              {(lastError || !apiKey) && (
                <div className="mb-6 text-sm p-4 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                  {(!apiKey) ? (
                    <span>Live AI is disabled because the API key is missing. Add <code>VITE_GEMINI_API_KEY</code> to your env and restart the dev server.</span>
                  ) : (
                    <span>Using supportive fallback responses due to a connection issue. Retrying on your next message.</span>
                  )}
                </div>
              )}
              
              {/* Notifications */}
              {notifications.length > 0 && (
                <div className="mb-6 space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`text-sm p-4 rounded-xl border ${
                        notification.type === "success" 
                          ? "bg-green-50 text-green-900 border-green-200" 
                          : "bg-blue-50 text-blue-900 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          notification.type === "success" ? "bg-green-500" : "bg-blue-500"
                        }`} />
                        <span className="font-medium">{notification.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Analysis Status */}
              {isAnalyzing && (
                <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in-50 duration-500">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-primary">Analyzing your message for stress and habit suggestions...</span>
                  </div>
                </div>
              )}


              {/* Messages - Scrollable area */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto py-4 space-y-6 relative chat-messages-container animate-in fade-in-50 duration-1000 delay-300 px-2"
                onScroll={handleScroll}
              >
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      style={{ willChange: 'transform, opacity' }}
                    >
                      <div className={`flex items-start space-x-2 max-w-[85%] ${
                        message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110 ${
                          message.sender === 'user' 
                            ? 'bg-primary text-primary-foreground shadow-md' 
                            : 'bg-secondary text-secondary-foreground shadow-md'
                        }`}>
                          {message.sender === 'user' ? (
                            <User className="h-5 w-5" />
                          ) : (
                            <Bot className="h-5 w-5" />
                          )}
                        </div>
                        <motion.div
                          layout
                          className={`px-4 py-3 rounded-xl max-w-full transition-all duration-300 hover:shadow-md ${
                            message.sender === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md shadow-md'
                              : 'bg-muted text-foreground rounded-bl-md shadow-md'
                          }`}
                        >
                          <div className="text-sm leading-relaxed whitespace-pre-line">
                            {message.sender === 'bot' ? (
                              <FormattedText text={message.text} />
                            ) : (
                              message.text
                            )}
                          </div>
                          <p className={`text-xs mt-2 opacity-70`}>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Typing Indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start space-x-2 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-md">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="px-4 py-3 rounded-xl rounded-bl-md bg-muted shadow-md">
                          <div className="flex space-x-2">
                            <div className="w-3 h-3 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-3 h-3 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Analyzing Indicator */}
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start space-x-2 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-md">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="px-4 py-3 rounded-xl rounded-bl-md bg-muted shadow-md">
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-muted-foreground font-medium">Analyzing your message...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Invisible element for auto-scrolling */}
                <div ref={messagesEndRef} />
                
                {/* Scroll to bottom button */}
                <AnimatePresence>
                  {showScrollButton && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className="absolute bottom-4 right-4 z-10"
                    >
                      <Button
                        onClick={scrollToBottom}
                        size="sm"
                        className="rounded-full w-12 h-12 p-0 shadow-lg transition-all duration-300 hover:scale-110"
                        variant="secondary"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Message Input - Fixed at bottom */}
              <div className="border-t border-border/20 pt-4 pb-4 px-4 bg-background/80 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-700 delay-500 mt-2 rounded-b-3xl">
                <div className="flex space-x-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Share your thoughts, feelings, or concerns..."
                    className="flex-1 text-sm h-12 px-4 py-2 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:scale-[1.01] shadow-md"
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isTyping}
                    size="sm"
                    className="px-4 h-12 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-md"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 animate-in fade-in-50 duration-1000 delay-700 truncate">
                  {isAnalyzing ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>AI is analyzing your message...</span>
                    </span>
                  ) : (
                    "Share your thoughts for personalized support."
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Resize Handle - Only show when not in popup mode */}
          {!isPopup && (
            <div
              className="absolute bottom-2 right-2 w-6 h-6 cursor-se-resize opacity-40 hover:opacity-80 transition-opacity duration-200 flex items-center justify-center group select-none z-20"
              onMouseDown={handleMouseDown}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              <div className="absolute inset-0 bg-primary/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-200"></div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}