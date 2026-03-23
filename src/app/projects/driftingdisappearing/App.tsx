import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  index: number;
  originalX: number;
  originalY: number;
  line: number;
  createdAt: number;
}

export default function App() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<string>('');
  
  const wordIdRef = useRef(0);
  const wordIndexRef = useRef(0);
  const animationFrameRef = useRef<number>();

  // Handle typing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (currentWord.trim().length > 0) {
        const charWidth = 8.4;
        const spacing = charWidth * 1.5;
        const maxWidth = 80; // max width of text block in % of viewport
        const startX = 10; // left edge of text block
        const lineHeight = 4; // vertical spacing between lines in %
        const startY = 30; // starting Y position
        
        // Calculate position based on previous words
        let currentLine = 0;
        let currentLineWidth = 0;
        
        if (words.length > 0) {
          const lastWord = words[words.length - 1];
          currentLine = lastWord.line;
          
          // Calculate current line width
          words
            .filter(w => w.line === currentLine)
            .forEach(w => {
              currentLineWidth += (w.text.length * charWidth) / window.innerWidth * 100 + (spacing / window.innerWidth * 100);
            });
        }
        
        // Check if current word fits on current line
        const wordWidth = (currentWord.length * charWidth) / window.innerWidth * 100;
        const totalWidth = currentLineWidth + wordWidth;
        
        if (totalWidth > maxWidth && words.length > 0) {
          // Move to next line
          currentLine++;
          currentLineWidth = 0;
        }
        
        const xPos = startX + currentLineWidth;
        const yPos = startY + (currentLine * lineHeight);
        
        const newWord: Word = {
          id: wordIdRef.current++,
          text: currentWord,
          x: xPos,
          y: yPos,
          vx: 0,
          vy: 0,
          index: wordIndexRef.current++,
          originalX: xPos,
          originalY: yPos,
          line: currentLine,
          createdAt: Date.now(),
        };
        
        setWords(prev => [...prev, newWord]);
        setCurrentWord('');
      }
    } else if (e.key === 'Backspace') {
      setCurrentWord(prev => prev.slice(0, -1));
    } else if (e.key.length === 1) {
      setCurrentWord(prev => prev + e.key);
    }
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      
      setWords(prev => {
        if (prev.length === 0) return prev;

        const latestIndex = prev[prev.length - 1].index;

        // Filter out completely transparent words (older than 100 seconds)
        const visibleWords = prev.filter(word => {
          const elapsedSeconds = (now - word.createdAt) / 1000;
          return elapsedSeconds < 100;
        });

        return visibleWords.map((word, arrayIndex) => {
          let ax = 0;
          let ay = 0;

          // Calculate how many words are written AFTER this word
          const wordsAfter = latestIndex - word.index;
          
          // Speed: 2 pixels per second for each word written after this one
          // Convert to percentage per frame (assuming 60fps)
          const pixelsPerSecond = wordsAfter * 2;
          const percentPerFrame = (pixelsPerSecond / window.innerWidth * 100) / 60;

          // Only apply forces if there are words after this one
          if (wordsAfter > 0) {
            // Attraction to previous word (if not the first)
            if (arrayIndex > 0) {
              const prevWord = visibleWords[arrayIndex - 1];
              const dx = prevWord.x - word.x;
              const dy = prevWord.y - word.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist > 0) {
                const attraction = 0.002 * percentPerFrame;
                ax = (dx / dist) * attraction;
                ay = (dy / dist) * attraction;
              }
            }

            // Repulsion from all other words (collision avoidance)
            visibleWords.forEach((otherWord, otherIndex) => {
              if (otherIndex === arrayIndex) return;
              
              const dx = word.x - otherWord.x;
              const dy = word.y - otherWord.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              const minDist = 5;
              if (dist < minDist && dist > 0) {
                const repulsion = 0.008 * percentPerFrame;
                const force = (minDist - dist) / minDist;
                ax += (dx / dist) * repulsion * force;
                ay += (dy / dist) * repulsion * force;
              }
            });

            // Random drift that increases with number of words after
            ax += (Math.random() - 0.5) * 0.0008 * percentPerFrame;
            ay += (Math.random() - 0.5) * 0.0008 * percentPerFrame;
          }

          // Update velocity with acceleration
          let newVx = word.vx + ax;
          let newVy = word.vy + ay;

          // Damping
          newVx *= 0.98;
          newVy *= 0.98;

          // Update position
          let newX = word.x + newVx;
          let newY = word.y + newVy;

          // Wraparound at boundaries - words come out on the other side
          if (newX < 0) {
            newX = 100;
          } else if (newX > 100) {
            newX = 0;
          }

          if (newY < 0) {
            newY = 100;
          } else if (newY > 100) {
            newY = 0;
          }

          return {
            ...word,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          };
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Focus textarea on mount
  useEffect(() => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  }, []);

  // Calculate position for current word
  const getCurrentWordPosition = () => {
    const charWidth = 8.4;
    const spacing = charWidth * 1.5;
    const maxWidth = 80;
    const startX = 10;
    const lineHeight = 4;
    const startY = 30;
    
    let currentLine = 0;
    let currentLineWidth = 0;
    
    if (words.length > 0) {
      const lastWord = words[words.length - 1];
      currentLine = lastWord.line;
      
      // Calculate current line width
      words
        .filter(w => w.line === currentLine)
        .forEach(w => {
          currentLineWidth += (w.text.length * charWidth) / window.innerWidth * 100 + (spacing / window.innerWidth * 100);
        });
    }
    
    // Check if current word fits on current line
    const wordWidth = (currentWord.length * charWidth) / window.innerWidth * 100;
    const totalWidth = currentLineWidth + wordWidth;
    
    if (totalWidth > maxWidth && words.length > 0) {
      currentLine++;
      currentLineWidth = 0;
    }
    
    return { 
      x: startX + currentLineWidth, 
      y: startY + (currentLine * lineHeight) 
    };
  };

  const currentWordPos = getCurrentWordPosition();

  return (
    <div className="size-full relative bg-neutral-50 overflow-hidden">
      {/* All words */}
      {words.map((word) => {
        // Calculate opacity based on time elapsed (1% per second)
        const elapsedSeconds = (Date.now() - word.createdAt) / 1000;
        const opacity = Math.max(0, 1 - (elapsedSeconds / 100));
        
        return (
          <div
            key={word.id}
            className="absolute text-sm text-neutral-900 font-mono tracking-wide whitespace-nowrap pointer-events-none"
            style={{
              left: `${word.x}%`,
              top: `${word.y}%`,
              transform: 'translate(0, -50%)',
              opacity: opacity,
            }}
          >
            {word.text}
          </div>
        );
      })}

      {/* Current word being typed */}
      {currentWord && (
        <div 
          className="absolute text-sm text-neutral-900 font-mono tracking-wide whitespace-nowrap pointer-events-none"
          style={{
            left: `${currentWordPos.x}%`,
            top: `${currentWordPos.y}%`,
            transform: 'translate(0, -50%)',
          }}
        >
          {currentWord}
        </div>
      )}

      {/* Invisible textarea for input */}
      <textarea
        onKeyDown={handleKeyDown}
        className="w-full h-full bg-transparent resize-none outline-none border-none text-transparent caret-transparent selection:bg-transparent"
        style={{ caretColor: 'transparent' }}
        autoFocus
      />
    </div>
  );
}