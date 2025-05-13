import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, Volume } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface TextToSpeechProps {
  text: string;
  compact?: boolean;
}

export function TextToSpeech({ text, compact = false }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isSupported, setIsSupported] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const previousVolumeRef = useRef<number>(1);

  // Check if speech synthesis is supported
  useEffect(() => {
    if (!window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    // Get available voices
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Set default voice (prefer English)
      if (availableVoices.length > 0) {
        const englishVoice = availableVoices.find(voice => 
          voice.lang.includes('en-') && voice.localService
        );
        setCurrentVoice(englishVoice?.name || availableVoices[0].name);
      }
    };

    // Chrome needs this to get voices
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    
    updateVoices();

    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Create and configure utterance
  const createUtterance = useCallback(() => {
    if (!window.speechSynthesis) return null;
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set selected voice
    if (currentVoice) {
      const voice = voices.find(v => v.name === currentVoice);
      if (voice) utterance.voice = voice;
    }
    
    utterance.rate = rate;
    utterance.volume = isMuted ? 0 : volume;
    
    // Handle events
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    return utterance;
  }, [text, currentVoice, voices, rate, volume, isMuted]);

  // Play text
  const playText = useCallback(() => {
    if (!window.speechSynthesis || !isSupported) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create new utterance
    const utterance = createUtterance();
    if (!utterance) return;
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [createUtterance, isSupported]);

  // Pause/resume speech
  const togglePause = useCallback(() => {
    if (!window.speechSynthesis || !isPlaying) return;
    
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  // Stop speech
  const stopSpeech = useCallback(() => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (isMuted) {
      // Unmute
      setVolume(previousVolumeRef.current);
      setIsMuted(false);
      
      // Update current utterance if playing
      if (isPlaying && utteranceRef.current) {
        utteranceRef.current.volume = previousVolumeRef.current;
      }
    } else {
      // Mute
      previousVolumeRef.current = volume;
      setIsMuted(true);
      
      // Update current utterance if playing
      if (isPlaying && utteranceRef.current) {
        utteranceRef.current.volume = 0;
      }
    }
  }, [isMuted, volume, isPlaying]);

  // Update utterance when settings change
  useEffect(() => {
    if (isPlaying && utteranceRef.current) {
      utteranceRef.current.rate = rate;
      utteranceRef.current.volume = isMuted ? 0 : volume;
      
      // Update voice if changed during playback
      if (currentVoice) {
        const voice = voices.find(v => v.name === currentVoice);
        if (voice) utteranceRef.current.voice = voice;
      }
    }
  }, [rate, volume, isMuted, currentVoice, voices, isPlaying]);

  // Skip forward/backward
  const skipForward = useCallback(() => {
    stopSpeech();
    // Implement text chunking for more advanced skipping
    setTimeout(playText, 50);
  }, [stopSpeech, playText]);

  const skipBackward = useCallback(() => {
    stopSpeech();
    // Implement text chunking for more advanced skipping
    setTimeout(playText, 50);
  }, [stopSpeech, playText]);

  if (!isSupported) {
    return <div className="text-sm text-muted-foreground">Text-to-speech not supported in this browser</div>;
  }

  // Compact version (icon only)
  if (compact) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Text to Speech">
            <Volume2 className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="w-full sm:max-w-lg mx-auto rounded-t-lg">
          <SheetHeader>
            <SheetTitle>Text to Speech</SheetTitle>
            <SheetDescription>
              Listen to the content being read aloud
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={skipBackward}
                disabled={!isPlaying}
                aria-label="Skip backward"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                variant="default"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={isPlaying ? togglePause : playText}
                aria-label={isPlaying ? (isPaused ? "Resume" : "Pause") : "Play"}
              >
                {isPlaying && !isPaused ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={skipForward}
                disabled={!isPlaying}
                aria-label="Skip forward"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Voice</div>
                <Select
                  value={currentVoice}
                  onValueChange={setCurrentVoice}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Speed</div>
                <div className="flex items-center space-x-2">
                  <Slider
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={[rate]}
                    onValueChange={(values) => setRate(values[0])}
                  />
                  <span className="text-sm w-10 text-right">{rate.toFixed(1)}x</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Volume</div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume className="h-4 w-4" />}
                </Button>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[isMuted ? 0 : volume]}
                onValueChange={(values) => {
                  setVolume(values[0]);
                  if (values[0] > 0 && isMuted) setIsMuted(false);
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Full version
  return (
    <div className="rounded-lg border bg-card shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Text to Speech</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isMuted ? "Unmute" : "Mute"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex items-center justify-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={skipBackward}
                disabled={!isPlaying}
                aria-label="Skip backward"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Skip backward</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={isPlaying ? togglePause : playText}
          aria-label={isPlaying ? (isPaused ? "Resume" : "Pause") : "Play"}
        >
          {isPlaying && !isPaused ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={skipForward}
                disabled={!isPlaying}
                aria-label="Skip forward"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Skip forward</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Voice</div>
          <Select
            value={currentVoice}
            onValueChange={setCurrentVoice}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Speed</div>
          <div className="flex items-center space-x-2">
            <Slider
              min={0.5}
              max={2}
              step={0.1}
              value={[rate]}
              onValueChange={(values) => setRate(values[0])}
            />
            <span className="text-sm w-10 text-right">{rate.toFixed(1)}x</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-sm font-medium">Volume</div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[isMuted ? 0 : volume]}
          onValueChange={(values) => {
            setVolume(values[0]);
            if (values[0] > 0 && isMuted) setIsMuted(false);
          }}
        />
      </div>
    </div>
  );
} 