"use client";

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  mediaStream: MediaStream;
  isSuppressed: boolean;
}

export default function AudioVisualizer({ mediaStream, isSuppressed }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const smoothedDataArrayRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!mediaStream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--primary').trim();
    const accentColor = computedStyle.getPropertyValue('--accent').trim();

    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
    const audioContext = audioContextRef.current;
    
    if (!analyserRef.current) {
      analyserRef.current = audioContext.createAnalyser();
    }
    const analyser = analyserRef.current;
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    if (!dataArrayRef.current || dataArrayRef.current.length !== bufferLength) {
      dataArrayRef.current = new Uint8Array(bufferLength);
      smoothedDataArrayRef.current = new Float32Array(bufferLength);
      smoothedDataArrayRef.current.fill(0); // Initialize with zeros
    }
    const dataArray = dataArrayRef.current;
    const smoothedDataArray = smoothedDataArrayRef.current!;
    const smoothingFactor = 0.1;

    // Noise suppression parameters
    const NOISE_THRESHOLD = 20; // Ignore any signal below this value
    const VOICE_BOOST = 1.1; // Boost signal above threshold
    const IGNORE_LOW_FREQS = 2; // Ignore the first N frequency bins (bass rumble)

    const draw = () => {
      animationFrameIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      
      const gradient = ctx.createLinearGradient(0, height / 2, width, height / 2);
      gradient.addColorStop(0, `hsl(${primaryColor})`);
      gradient.addColorStop(0.5, `hsl(${accentColor})`);
      gradient.addColorStop(1, `hsl(${primaryColor})`);
      ctx.fillStyle = gradient;
      
      const barWidth = (width / (bufferLength - IGNORE_LOW_FREQS)) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = IGNORE_LOW_FREQS; i < bufferLength; i++) {
        let rawValue = dataArray[i];

        if (isSuppressed) {
          if (rawValue < NOISE_THRESHOLD) {
            rawValue = 0; // Suppress noise
          } else {
            rawValue *= VOICE_BOOST; // Boost voice
          }
        }
        
        // Smooth the data
        const targetHeight = rawValue * 0.75;
        smoothedDataArray[i] += (targetHeight - smoothedDataArray[i]) * smoothingFactor;
        barHeight = smoothedDataArray[i];
        
        const y = height / 2 - barHeight / 2;
        ctx.fillRect(x, y, barWidth, barHeight);

        x += barWidth + 2;
      }
    };

    draw();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      try {
        source.disconnect();
      } catch {
      }
    };
  }, [mediaStream, isSuppressed]);

  return <canvas ref={canvasRef} width="500" height="150" className="w-full h-auto" />;
}
