import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface CharEvent {
  char: string;
  timestamp: number;
  isSpace: boolean;
  isBackspace: boolean;
}

type Phase = 'intro' | 'writing' | 'replay' | 'ended';

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [displayText, setDisplayText] = useState<string>('');
  
  const charsRef = useRef<CharEvent[]>([]);
  const startTimeRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle invisible typing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (phase !== 'writing') return;
    
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const timestamp = Date.now() - startTimeRef.current;
    
    if (e.key.length === 1 && e.key !== ' ') {
      // Regular character
      charsRef.current.push({
        char: e.key,
        timestamp,
        isSpace: false,
        isBackspace: false
      });
    } else if (e.key === ' ' || e.key === 'Enter') {
      // Space/Enter marks word boundary
      charsRef.current.push({
        char: ' ',
        timestamp,
        isSpace: true,
        isBackspace: false
      });
    } else if (e.key === 'Backspace') {
      charsRef.current.push({
        char: '',
        timestamp,
        isSpace: false,
        isBackspace: true
      });
    }
  };

  // Start replay
  const handleFertig = () => {
    if (charsRef.current.length === 0) return;
    
    setPhase('replay');
    setDisplayText('');

    // Build the final text by processing all events
    let reconstructedText = '';
    const processedEvents: CharEvent[] = [];
    
    charsRef.current.forEach(event => {
      if (event.isBackspace) {
        reconstructedText = reconstructedText.slice(0, -1);
      } else {
        reconstructedText += event.char;
        processedEvents.push(event);
      }
    });

    // Replay character by character
    let currentIndex = 0;
    let currentWord = '';
    
    const playNextChar = () => {
      if (currentIndex >= processedEvents.length) {
        // End replay
        setTimeout(() => {
          setDisplayText('');
          setPhase('ended');
        }, 1500);
        return;
      }

      const event = processedEvents[currentIndex];
      
      if (event.isSpace) {
        // Space triggers word completion - clear and start new word
        currentWord = '';
        setDisplayText('');
      } else {
        // Add character to current word
        currentWord += event.char;
        setDisplayText(currentWord);
      }
      
      currentIndex++;
      
      // Calculate delay to next character
      if (currentIndex < processedEvents.length) {
        const delay = processedEvents[currentIndex].timestamp - event.timestamp;
        setTimeout(playNextChar, Math.max(delay, 10));
      } else {
        // End of replay
        setTimeout(() => {
          setDisplayText('');
          setPhase('ended');
        }, 1500);
      }
    };

    // Start replay
    const initialDelay = processedEvents[0]?.timestamp || 0;
    setTimeout(playNextChar, initialDelay);
  };

  // Reset
  const handleReset = () => {
    setPhase('writing');
    setDisplayText('');
    charsRef.current = [];
    startTimeRef.current = 0;
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.focus();
    }
  };

  // Start from intro
  const handleBegin = () => {
    setPhase('writing');
  };

  useEffect(() => {
    if (phase === 'writing' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase]);

  return (
    <div className="size-full flex items-center justify-center bg-neutral-50">
      {phase === 'intro' && (
        <div className="w-full max-w-lg flex flex-col items-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h1
              style={{
                fontFamily: "'Space Grotesk', monospace, sans-serif",
                fontSize: "clamp(2rem, 6vw, 3.5rem)",
                color: "#313642",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              One-Word Replay
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center mb-12 max-w-md"
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.95rem",
              color: "#6B6F7B",
              lineHeight: 1.7,
            }}
          >
            Während des Schreibens bleibt die Oberfläche leer. 
            Keine visuelle Rückmeldung. Du produzierst im Unsichtbaren. 
            Erst nach dem Abschluss beginnt die Sichtbarkeit – Buchstabe für Buchstabe, 
            Wort für Wort, in der exakten Geschwindigkeit deines Denkens.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            onClick={handleBegin}
            className="group cursor-pointer"
            style={{
              fontFamily: "'Space Grotesk', monospace, sans-serif",
              fontSize: "0.8rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "0.9rem 3rem",
              borderRadius: "100px",
              border: "none",
              backgroundColor: "#313642",
              color: "#F2F3F6",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(49,54,66,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Begin
          </motion.button>
        </div>
      )}

      {phase === 'writing' && (
        <div className="relative w-full h-full flex flex-col">
          <textarea
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-neutral-50 resize-none outline-none border-none text-transparent caret-transparent selection:bg-transparent"
            style={{ caretColor: 'transparent' }}
            autoFocus
          />
          <button
            onClick={handleFertig}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 px-8 py-3 text-xs tracking-widest uppercase bg-neutral-900 text-neutral-50 font-mono hover:bg-neutral-800 transition-colors"
          >
            Fertig
          </button>
        </div>
      )}

      {phase === 'replay' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="text-4xl text-neutral-900 font-mono tracking-wide">
            {displayText}
          </div>
        </div>
      )}

      {phase === 'ended' && (
        <button
          onClick={handleReset}
          className="px-8 py-3 text-xs tracking-widest uppercase bg-neutral-900 text-neutral-50 font-mono hover:bg-neutral-800 transition-colors"
        >
          Neu beginnen
        </button>
      )}
    </div>
  );
}