"use client";

import { useRef, useEffect } from 'react';

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number | null; y: number | null; radius: number }>({
    x: null,
    y: null,
    radius: 100, // Raio de influência do mouse
  });

  class Particle {
    x: number;
    y: number;
    size: number;
    baseX: number;
    baseY: number;
    density: number;
    color: string;
    vx: number; // velocity x
    vy: number; // velocity y
    
    // Spring physics properties for the jelly effect
    private springFactor = 0.002;
    private dampingFactor = 0.95; // Simulates friction/air resistance
    private springBackDamping = 0.92; // Controls how quickly the jelly settles

    constructor(private ctx: CanvasRenderingContext2D, private canvasWidth: number, private canvasHeight: number) {
      this.x = Math.random() * canvasWidth;
      this.y = Math.random() * canvasHeight;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = Math.random() * 2 + 0.5;
      this.density = (Math.random() * 30) + 1;
      this.color = `hsl(210, 82%, 54%)`; // Primary color
      this.vx = 0;
      this.vy = 0;
    }
    
    update() {
      // 1. Mouse repulsion
      if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
        const dx_mouse = this.x - mouseRef.current.x;
        const dy_mouse = this.y - mouseRef.current.y;
        const distance_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);
        
        if (distance_mouse < mouseRef.current.radius) {
          const forceDirectionX = dx_mouse / distance_mouse;
          const forceDirectionY = dy_mouse / distance_mouse;
          const force = (mouseRef.current.radius - distance_mouse) / mouseRef.current.radius;
          this.vx += forceDirectionX * force * 0.25;
          this.vy += forceDirectionY * force * 0.25;
        }
      }

      // 2. Spring-back force (Jelly effect)
      // This pulls the particle back to its base position
      const dx_base = this.baseX - this.x;
      const dy_base = this.baseY - this.y;
      
      const springForceX = dx_base * this.springFactor;
      const springForceY = dy_base * this.springFactor;
      
      this.vx += springForceX;
      this.vy += springForceY;
      
      // 3. Apply damping to simulate friction and settle the jelly effect
      this.vx *= this.springBackDamping;
      this.vy *= this.springBackDamping;
      
      // 4. Update position based on velocity
      this.x += this.vx;
      this.y += this.vy;
      
      // 5. Continuous background drift
      this.baseY -= 0.1;
      if (this.baseY < 0 - this.size) {
        this.baseY = this.canvasHeight + this.size;
        this.baseX = Math.random() * this.canvasWidth;
        this.x = this.baseX;
        this.y = this.baseY;
      }
    }
    
    draw() {
      // The color of the particle changes with velocity (faster = more white/bright)
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const brightness = Math.min(speed * 20, 46); // 54 (base) + 46 = 100 (white)
      this.ctx.fillStyle = `hsl(210, 82%, ${54 + brightness}%)`;
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.closePath();
      this.ctx.fill();
    }

    explode(clickX: number, clickY: number) {
      const dx = this.x - clickX;
      const dy = this.y - clickY;
      const distance = Math.sqrt(dx*dx + dy*dy) || 1; // Avoid division by zero
      const maxDistance = 200; // The radius of the explosion effect

      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        this.vx += (dx / distance) * force * 15;
        this.vy += (dy / distance) * force * 15;
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const initParticles = () => {
        particlesRef.current = [];
        let numberOfParticles = 1500; 
        for (let i = 0; i < numberOfParticles; i++) {
            particlesRef.current.push(new Particle(ctx, canvas.width, canvas.height));
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

    const handleClick = (event: globalThis.MouseEvent) => {
      particlesRef.current.forEach(p => p.explode(event.x, event.y));
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
