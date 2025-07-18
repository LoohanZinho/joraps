"use client";

import { useRef, useEffect } from 'react';

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number | null; y: number | null; radius: number }>({
    x: null,
    y: null,
    radius: 100,
  });

  class Particle {
    x: number;
    y: number;
    size: number;
    speed: number;
    color: string;
    baseX: number;
    baseY: number;
    density: number;
    
    constructor(private ctx: CanvasRenderingContext2D, private canvasWidth: number, private canvasHeight: number, color: string) {
      this.x = Math.random() * canvasWidth;
      this.y = Math.random() * canvasHeight;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = Math.random() * 2 + 0.5;
      this.speed = Math.random() * 0.5 + 0.1;
      this.density = (Math.random() * 30) + 1;
      this.color = color;
    }
    
    update() {
      // Continuous downward movement for the base position
      this.baseY += this.speed;
      if (this.baseY > this.canvasHeight + this.size) {
        this.baseY = 0 - this.size;
        this.baseX = Math.random() * this.canvasWidth;
      }
      
      let targetX = this.baseX;
      let targetY = this.baseY;

      // Interaction with mouse
      if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouseRef.current.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouseRef.current.radius - distance) / mouseRef.current.radius;
          const directionX = forceDirectionX * force * this.density;
          const directionY = forceDirectionY * force * this.density;
          
          targetX = this.x - directionX;
          targetY = this.y - directionY;
        }
      }

      // Smoothly move towards the target position
      this.x += (targetX - this.x) / 10;
      this.y += (targetY - this.y) / 10;
    }
    
    draw() {
      this.ctx.fillStyle = this.color;
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const computedStyle = getComputedStyle(document.documentElement);
    const particleColor = `hsl(${computedStyle.getPropertyValue('--primary').trim()})`;

    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const initParticles = () => {
        particlesRef.current = [];
        // Set a fixed number of particles as requested
        let numberOfParticles = 1500; 
        for (let i = 0; i < numberOfParticles; i++) {
            particlesRef.current.push(new Particle(ctx, canvas.width, canvas.height, particleColor));
        }
    };

    const handleMouseMove = (event: globalThis.MouseEvent) => {
        mouseRef.current.x = event.x;
        mouseRef.current.y = event.y;
    };
    
    const handleMouseLeave = () => {
        mouseRef.current.x = null;
        mouseRef.current.y = null;
    };

    const handleClick = () => {
      const originalRadius = mouseRef.current.radius;
      mouseRef.current.radius = originalRadius * 2.5; // Shockwave effect
      setTimeout(() => {
        mouseRef.current.radius = originalRadius;
      }, 200);
    };

    const handleResize = () => {
        setCanvasDimensions();
        initParticles();
    };

    setCanvasDimensions();
    initParticles();
    
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10 bg-background" />;
}
