"use client";

import { useRef, useEffect } from 'react';

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number | null; y: number | null; radius: number }>({
    x: null,
    y: null,
    radius: 150, 
  });
  const vorticesRef = useRef<Vortex[]>([]);

  class Vortex {
    x: number;
    y: number;
    maxStrength: number;
    strength: number;
    radius: number;
    life: number;
    maxLife: number;

    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
      this.maxStrength = 2; // Increased strength for a more dramatic pull
      this.strength = this.maxStrength;
      this.radius = 250; // The area of effect for the vortex
      this.maxLife = 120; // How long the vortex lasts in frames
      this.life = this.maxLife;
    }

    update() {
      this.life--;
      // The strength of the vortex diminishes over its lifetime
      this.strength = this.maxStrength * (this.life / this.maxLife);
    }
  }

  class Particle {
    x: number;
    y: number;
    size: number;
    baseX: number;
    baseY: number;
    color: string;
    vx: number;
    vy: number;
    
    private springFactor = 0.02; // How strongly it returns to base
    private dampingFactor = 0.92; // Friction to stop oscillations

    constructor(private ctx: CanvasRenderingContext2D, private canvasWidth: number, private canvasHeight: number) {
      this.x = Math.random() * canvasWidth;
      this.y = Math.random() * canvasHeight;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = Math.random() * 2 + 0.5;
      this.color = `hsl(210, 82%, 54%)`; // Primary color
      this.vx = 0;
      this.vy = 0;
    }
    
    update(vortices: Vortex[]) {
      let inVortex = false;

      // 1. Vortex interaction
      for (const vortex of vortices) {
        if (vortex.life <= 0) continue;
        const dx_vortex = vortex.x - this.x;
        const dy_vortex = vortex.y - this.y;
        const distance_vortex = Math.sqrt(dx_vortex * dx_vortex + dy_vortex * dy_vortex);

        if (distance_vortex < vortex.radius) {
          inVortex = true;
          const force = (vortex.radius - distance_vortex) / vortex.radius;
          const angle = Math.atan2(dy_vortex, dx_vortex);

          // Force pulling towards the center
          const pullX = Math.cos(angle) * vortex.strength * force;
          const pullY = Math.sin(angle) * vortex.strength * force;
          
          // Tangential force for rotation
          const tangentialX = -Math.sin(angle) * vortex.strength * force * 0.5; // Adjust multiplier for more/less spin
          const tangentialY = Math.cos(angle) * vortex.strength * force * 0.5;

          this.vx += pullX + tangentialX;
          this.vy += pullY + tangentialY;
        }
      }

      // 2. Mouse repulsion (weaker than vortex)
      if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
        const dx_mouse = this.x - mouseRef.current.x;
        const dy_mouse = this.y - mouseRef.current.y;
        const distance_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);
        
        if (distance_mouse < mouseRef.current.radius) {
          const forceDirectionX = dx_mouse / distance_mouse;
          const forceDirectionY = dy_mouse / distance_mouse;
          const force = (mouseRef.current.radius - distance_mouse) / mouseRef.current.radius;
          this.vx += forceDirectionX * force * 0.25; // Softer push
          this.vy += forceDirectionY * force * 0.25;
        }
      }

      // 3. Spring-back force (Jelly effect)
      // This force is always active but is overpowered by the vortex
      const dx_base = this.baseX - this.x;
      const dy_base = this.baseY - this.y;
      
      const springForceX = dx_base * this.springFactor;
      const springForceY = dy_base * this.springFactor;
      
      this.vx += springForceX;
      this.vy += springForceY;
      
      // 4. Apply damping
      this.vx *= this.dampingFactor;
      this.vy *= this.dampingFactor;
      
      // 5. Update position
      this.x += this.vx;
      this.y += this.vy;
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
      vorticesRef.current.push(new Vortex(event.x, event.y));
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
      
      // Update and filter out old vortices
      vorticesRef.current = vorticesRef.current.filter(v => v.life > 0);
      vorticesRef.current.forEach(v => v.update());

      particlesRef.current.forEach(p => {
        p.update(vorticesRef.current);
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
