"use client";

import { useRef, useEffect } from 'react';

const WorldMap = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 2000 1001"
    className="pointer-events-none absolute inset-0 h-full w-full object-cover text-gray-200 opacity-20"
    style={{ filter: 'grayscale(1) brightness(1.5)' }}
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M1000 0.5C447.8 0.5 0.5 447.8 0.5 1000h1999C1999.5 447.8 1552.2 0.5 1000 0.5z"
      opacity="0.1"
    />
    <path
      fill="currentColor"
      d="M1743.2 590.2c-5.1-1.3-10.4-2.1-15.8-2.1-23.2 0-42.1 18.9-42.1 42.1s18.9 42.1 42.1 42.1c5.4 0 10.7-0.8 15.8-2.1 19-38.3 19-38.3 0-80zm-111-30.8c-28.4-15.1-62.1-19.6-94.3-12.8-32.2 6.8-59.5 25.9-76.3 52.8-16.8 26.9-22.9 59.9-16.1 92.1s25.9 59.5 52.8 76.3c26.9 16.8 59.9 22.9 92.1 16.1 32.2-6.8 59.5-25.9 76.3-52.8s22.9-59.9 16.1-92.1c-6.8-32.2-25.9-59.5-52.8-76.3zM921.2 165.2c-19.6-19.6-46.5-33-76.8-36.4-30.2-3.4-60.8 3.2-86.4 18.8-25.6 15.6-45 39.4-54.6 67.5-9.6 28.1-9.1 59.1 1.4 86.8s29.7 51.1 55.4 65.5c25.8 14.4 56.4 17.2 86.1 8.5 29.7-8.8 55.4-27.5 72.8-52.1 17.3-24.6 25.8-54.3 22.1-84.2-3.8-29.9-17.6-57.5-39.6-77.9-1.2-1.2-2.5-2.2-3.8-3.5zm-492.2 46c-21-3.6-42.8-2.6-63.5 3-20.7 5.6-39.7 16-55.1 30.1-15.4 14.1-26.8 31.3-33.3 50.4-6.5 19.1-7.9 40-4.1 60.1 3.8 20.1 12.3 38.9 24.6 54.7 12.3 15.8 28.2 28.3 46.1 36.5 17.9 8.2 37.5 11.9 57.3 10.9 19.8-1 39-6.8 56-16.8 17-10 31.4-23.7 42.1-40.1 10.7-16.4 17.5-35.3 19.6-55.1 2.1-19.8 0-40.2-6.5-59.1-6.5-18.9-17.3-36.1-31.4-50.1-14.1-14.1-31.4-25.1-50.1-31.9-6.3-2.3-12.8-4.1-19.5-5.5z M1451.2 593.2c-5.1-1.3-10.4-2.1-15.8-2.1-23.2 0-42.1 18.9-42.1 42.1s18.9 42.1 42.1 42.1c5.4 0 10.7-0.8 15.8-2.1 19-38.3 19-38.3 0-80zM826.6 850.5c-20.5 0-37.1 16.6-37.1 37.1s16.6 37.1 37.1 37.1 37.1-16.6 37.1-37.1-16.6-37.1-37.1-37.1zm-449-146.8c-20.5 0-37.1 16.6-37.1 37.1s16.6 37.1 37.1 37.1 37.1-16.6 37.1-37.1-16.6-37.1-37.1-37.1zm748.2 165.7c-20.5 0-37.1 16.6-37.1 37.1s16.6 37.1 37.1 37.1 37.1-16.6 37.1-37.1-16.6-37.1-37.1-37.1zM593 301.1c-20.5 0-37.1 16.6-37.1 37.1s16.6 37.1 37.1 37.1 37.1-16.6 37.1-37.1-16.6-37.1-37.1-37.1zm501.9-46.7c-20.5 0-37.1 16.6-37.1 37.1s16.6 37.1 37.1 37.1 37.1-16.6 37.1-37.1-16.6-37.1-37.1-37.1zM1482 277.6c-20.5 0-37.1 16.6-37.1 37.1s16.6 37.1 37.1 37.1 37.1-16.6 37.1-37.1-16.6-37.1-37.1-37.1z"/>
  </svg>
);

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0, isOver: false });
  const clickPulse = useRef({ x: 0, y: 0, strength: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--primary').trim();
    
    let animationFrameId: number;
    type Star = {
        x: number; y: number; // current position
        ox: number; oy: number; // original position
        vx: number; vy: number; // velocity
        size: number; opacity: number;
    };
    let stars: Star[] = [];

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        stars = [];
        const starCount = Math.floor((canvas.width * canvas.height) / 1000);
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: (Math.random() - 0.5) * canvas.width,
                y: (Math.random() - 0.5) * canvas.height,
                ox: 0, oy: 0,
                vx: 0, vy: 0,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2,
            });
        }
        stars.forEach(star => {
            star.ox = star.x;
            star.oy = star.y;
        });
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: globalThis.MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.current = { 
            x: e.clientX - rect.left - canvas.width / 2, 
            y: e.clientY - rect.top - canvas.height / 2, 
            isOver: true 
        };
    };

    const handleMouseLeave = () => {
        mouse.current.isOver = false;
    }

    const handleMouseDown = (e: globalThis.MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        clickPulse.current = {
            x: e.clientX - rect.left - canvas.width / 2,
            y: e.clientY - rect.top - canvas.height / 2,
            strength: 20, // Initial strength of the explosion
        };
    };
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);


    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);

      // Handle click pulse
      if (clickPulse.current.strength > 0) {
        clickPulse.current.strength *= 0.9; // Decay the strength
      }

      stars.forEach(star => {
        // --- MOUSE INTERACTION ---
        const dxMouse = mouse.current.x - star.x;
        const dyMouse = mouse.current.y - star.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        let forceMouse = 0;
        const interactionRadius = 50;
        if (mouse.current.isOver && distMouse < interactionRadius) {
            const proximity = (interactionRadius - distMouse) / interactionRadius;
            forceMouse = -proximity * 2;
        }

        const angleMouse = Math.atan2(dyMouse, dxMouse);
        star.vx += Math.cos(angleMouse) * forceMouse;
        star.vy += Math.sin(angleMouse) * forceMouse;

        // --- CLICK EXPLOSION INTERACTION ---
        if (clickPulse.current.strength > 0.1) {
            const dxClick = clickPulse.current.x - star.x;
            const dyClick = clickPulse.current.y - star.y;
            const distClick = Math.sqrt(dxClick * dxClick + dyClick * dyClick);
            const pulseRadius = 200; 

            if (distClick < pulseRadius) {
                const proximity = (pulseRadius - distClick) / pulseRadius;
                const forceClick = -proximity * clickPulse.current.strength * 0.1;
                const angleClick = Math.atan2(dyClick, dxClick);
                star.vx += Math.cos(angleClick) * forceClick;
                star.vy += Math.sin(angleClick) * forceClick;
            }
        }
        
        // --- SPRING AND FRICTION ---
        // Apply spring force back to origin
        star.vx += (star.ox - star.x) * 0.01;
        star.vy += (star.oy - star.y) * 0.01;

        // Apply friction
        star.vx *= 0.92;
        star.vy *= 0.92;
        
        star.x += star.vx;
        star.y += star.vy;

        // --- DRAW STAR ---
        ctx.beginPath();
        ctx.fillStyle = `hsla(${primaryColor}, ${star.opacity})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 -z-10 h-full w-full bg-background"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" />
      <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-blue-50/0 to-indigo-100/50" />
      <WorldMap />
    </div>
  );
}
