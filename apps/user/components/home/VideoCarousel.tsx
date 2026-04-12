// components/VideoCarousel.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { cn } from '@/components/ui/cn';

interface VideoCarouselProps {
  videoPaths: string[];
}

export default function VideoCarousel({ videoPaths }: VideoCarouselProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const handleVideoEnd = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoPaths.length);
  };

  const goToNext = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoPaths.length);
  };

  const goToPrev = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex - 1 + videoPaths.length) % videoPaths.length);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Ensure video plays when index changes
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.load(); // Load the new video
      video.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error("Auto-play failed:", error);
          setIsPlaying(false); // Update state if auto-play is blocked
        });
    }
  }, [currentVideoIndex, videoPaths]);

  if (!videoPaths || videoPaths.length === 0) {
    return (
      <div className="aspect-[16/9] w-full bg-deep-black flex items-center justify-center rounded-3xl border border-gold-900/50">
        <p className="text-gold-500 font-bold">No videos to show</p>
      </div>
    );
  }

  return (
    <div className="relative group aspect-[16/9] w-full bg-deep-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gold-950/20">
      <video
        ref={videoRef}
        src={videoPaths[currentVideoIndex]}
        onEnded={handleVideoEnd}
        className="w-full h-full object-cover"
        muted={true} // Videos must be muted for auto-play
        playsInline
      />

      {/* Overlay for black/gold branding */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/70 pointer-events-none" />

      {/* Controls */}
      <button
        onClick={goToPrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 hover:bg-gold-500/20"
      >
        <ChevronLeft size={30} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 hover:bg-gold-500/20"
      >
        <ChevronRight size={30} />
      </button>

      <button
        onClick={togglePlay}
        className="absolute bottom-6 left-6 bg-black/50 p-3 rounded-full text-gold-500 z-10 hover:bg-gold-500/20"
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 right-6 flex gap-2 z-10">
        {videoPaths.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              index === currentVideoIndex ? "bg-gold-500 scale-125" : "bg-gold-800"
            )}
          />
        ))}
      </div>
    </div>
  );
}