// Audio utility functions
let soundEnabled = true; // Default to enabled

// Initialize sound setting from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('soundEnabled');
  if (saved !== null) {
    soundEnabled = JSON.parse(saved);
  }
}

// Function to update sound enabled state (called from Settings)
export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('soundEnabled', JSON.stringify(enabled));
  }
};

// Function to get current sound state
export const getSoundEnabled = () => soundEnabled;

export const playSound = (soundName: 'click' | 'taskcomplete') => {
  // Check if sound is enabled before playing
  if (!soundEnabled) {
    return;
  }
  
  try {
    const audio = new Audio(`/${soundName}.mp3`);
    audio.volume = 0.3; // Set a reasonable volume level
    audio.play().catch((error) => {
      // Silently handle audio play errors (e.g., user hasn't interacted with page yet)
      console.debug(`Could not play ${soundName} sound:`, error);
    });
  } catch (error) {
    console.debug(`Error creating audio for ${soundName}:`, error);
  }
};

export const playClickSound = () => playSound('click');
export const playTaskCompleteSound = () => playSound('taskcomplete');
