"use client";

import { useRef, useEffect, useCallback } from 'react';

// Class for the "Vortex" black hole effect on right-click
class Vortex {
  x: number;
  y: number;
  strength: number;
  maxStrength: number;
  radius: number;
  life: number;
  maxLife: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.maxStrength = 2;
    this.strength = this.maxStrength;
    this.radius = 250;
    this.maxLife = 180;
    this.life = this.maxLife;
  }

  update() {
    this.life--;
    this.strength = this.maxStrength * (this.life / this.maxLife);
  }
}

// Class for the "Chain Lightning" bolts
class LightningBolt {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    life: number;
    maxLife: number;

    constructor(p1: Particle, p2: Particle) {
        this.x1 = p1.x;
        this.y1 = p1.y;
        this.x2 = p2.x;
        this.y2 = p2.y;
        this.maxLife = 30; // How long the bolt stays visible
        this.life = this.maxLife;
    }

    update() {
        if (this.life > 0) {
            this.life--;
        }
    }
}


export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number | null; y: number | null; radius: number }>({
    x: null,
    y: null,
    radius: 100,
  });
  const vorticesRef = useRef<Vortex[]>([]);
  const lightningBoltsRef = useRef<LightningBolt[]>([]);


  class Particle {
    x: number;
    y: number;
    size: number;
    baseX: number;
    baseY: number;
    color: string;
    vx: number;
    vy: number;
    isStruck: number = 0; // Countdown timer for the lightning effect
    
    private springFactor = 0.02;
    private dampingFactor = 0.92;

    constructor(private ctx: CanvasRenderingContext2D, private canvasWidth: number, private canvasHeight: number) {
      this.x = Math.random() * canvasWidth;
      this.y = Math.random() * canvasHeight;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = Math.random() * 2 + 0.5;
      this.color = `hsl(210, 82%, 54%)`;
      this.vx = 0;
      this.vy = 0;
    }
    
    update(vortices: Vortex[]) {
       if (this.isStruck > 0) {
        this.isStruck--;
       }

      // 1. Vortex interaction (right-click)
      for (const vortex of vortices) {
        if (vortex.life <= 0) continue;
        const dx_vortex = vortex.x - this.x;
        const dy_vortex = vortex.y - this.y;
        const distance_vortex = Math.sqrt(dx_vortex * dx_vortex + dy_vortex * dy_vortex);

        if (distance_vortex < vortex.radius) {
          const force = (vortex.radius - distance_vortex) / vortex.radius;
          const angle = Math.atan2(dy_vortex, dx_vortex);

          const pullX = Math.cos(angle) * vortex.strength * force;
          const pullY = Math.sin(angle) * vortex.strength * force;
          
          const tangentialX = -Math.sin(angle) * vortex.strength * force * 0.5;
          const tangentialY = Math.cos(angle) * vortex.strength * force * 0.5;

          this.vx += pullX + tangentialX;
          this.vy += pullY + tangentialY;
        }
      }

      // 2. Mouse repulsion
      if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
        const dx_mouse = this.x - mouseRef.current.x;
        const dy_mouse = this.y - mouseRef.current.y;
        const distance_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);
        
        if (distance_mouse < mouseRef.current.radius) {
          const forceDirectionX = dx_mouse / distance_mouse;
          const forceDirectionY = dy_mouse / distance_mouse;
          const force = (mouseRef.current.radius - distance_mouse) / mouseRef.current.radius;
          this.vx += forceDirectionX * force * 0.5;
          this.vy += forceDirectionY * force * 0.5;
        }
      }

      // 3. Spring-back force (Jelly effect)
      const dx_base = this.baseX - this.x;
      const dy_base = this.baseY - this.y;
      
      const springForceX = dx_base * this.springFactor;
      const springForceY = dy_base * this.springFactor;
      
      this.vx += springForceX;
      this.vy += springForceY;
      
      // 4. Apply damping (friction)
      this.vx *= this.dampingFactor;
      this.vy *= this.dampingFactor;
      
      // 5. Update position
      this.x += this.vx;
      this.y += this.vy;
    }
    
    draw() {
      if (this.isStruck > 0) {
        this.ctx.fillStyle = `hsla(195, 100%, 80%, ${this.isStruck / 60})`;
        this.ctx.shadowColor = 'white';
        this.ctx.shadowBlur = 10;
      } else {
        this.ctx.fillStyle = this.color;
        this.ctx.shadowBlur = 0;
      }
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // Reset shadow blur
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

    const handleLeftClick = (event: globalThis.MouseEvent) => {
        const particles = particlesRef.current;
        let closestParticle: Particle | null = null;
        let minDistance = Infinity;

        // Find the closest particle to the click
        for (const p of particles) {
            const dist = Math.hypot(p.x - event.x, p.y - event.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestParticle = p;
            }
        }
        
        if (!closestParticle) return;
        
        const chainLength = 15;
        const searchRadius = 100;
        let currentParticle = closestParticle;

        for (let i = 0; i < chainLength; i++) {
            if (!currentParticle) break;
            currentParticle.isStruck = 60; // Set timer for glow effect

            let nextParticle: Particle | null = null;
            let nextMinDistance = Infinity;
            
            // Find the nearest un-struck particle
            for (const p of particles) {
                if (p === currentParticle || p.isStruck > 0) continue;
                const dist = Math.hypot(currentParticle.x - p.x, currentParticle.y - p.y);
                if (dist < nextMinDistance && dist < searchRadius) {
                    nextMinDistance = dist;
                    nextParticle = p;
                }
            }

            if (nextParticle) {
                lightningBoltsRef.current.push(new LightningBolt(currentParticle, nextParticle));
                currentParticle = nextParticle;
            } else {
                break; // End of chain
            }
        }
    };

    const handleRightClick = (event: globalThis.MouseEvent) => {
      event.preventDefault(); // Prevent context menu from appearing
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
      
      vorticesRef.current = vorticesRef.current.filter(v => v.life > 0);
      vorticesRef.current.forEach(v => v.update());

      lightningBoltsRef.current = lightningBoltsRef.current.filter(b => b.life > 0);
      lightningBoltsRef.current.forEach(b => b.update());

      particlesRef.current.forEach(p => {
        p.update(vorticesRef.current);
        p.draw();
      });

      // Draw Lightning Bolts
      lightningBoltsRef.current.forEach(bolt => {
        const lifeRatio = bolt.life / bolt.maxLife;
        ctx.strokeStyle = `hsla(195, 100%, 80%, ${lifeRatio})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(bolt.x1, bolt.y1);
        ctx.lineTo(bolt.x2, bolt.y2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleLeftClick);
    window.addEventListener('contextmenu', handleRightClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleLeftClick);
      window.removeEventListener('contextmenu', handleRightClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10 bg-background" />;
}
