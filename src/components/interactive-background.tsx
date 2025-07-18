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

// Class for the "Spacetime Rip" effect on left-click
class SpacetimeRip {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    life: number;
    maxLife: number;
    strength: number;

    constructor(x: number, y: number) {
        this.maxLife = 90; // How long the rip stays open
        this.life = this.maxLife;
        this.strength = 1.5;

        const angle = Math.random() * Math.PI * 2;
        const length = Math.random() * 200 + 150; // Random length
        this.x1 = x - (Math.cos(angle) * length) / 2;
        this.y1 = y - (Math.sin(angle) * length) / 2;
        this.x2 = x + (Math.cos(angle) * length) / 2;
        this.y2 = y + (Math.sin(angle) * length) / 2;
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
  const ripsRef = useRef<SpacetimeRip[]>([]);


  class Particle {
    x: number;
    y: number;
    size: number;
    baseX: number;
    baseY: number;
    color: string;
    vx: number;
    vy: number;
    isRipped: number = 0;
    
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
    
    update(vortices: Vortex[], rips: SpacetimeRip[]) {
      if (this.isRipped > 0) {
        this.isRipped--;
      }

       // 1. Spacetime Rip Interaction
      for (const rip of rips) {
          if (rip.life <= 0) continue;
          
          const dx = this.x - rip.x1;
          const dy = this.y - rip.y1;
          const dxx = rip.x2 - rip.x1;
          const dyy = rip.y2 - rip.y1;

          const t = ((dx * dxx) + (dy * dyy)) / ((dxx * dxx) + (dyy * dyy));
          const closestX = t < 0 ? rip.x1 : t > 1 ? rip.x2 : rip.x1 + t * dxx;
          const closestY = t < 0 ? rip.y1 : t > 1 ? rip.y2 : rip.y1 + t * dyy;

          const dist_dx = closestX - this.x;
          const dist_dy = closestY - this.y;
          const distance = Math.sqrt(dist_dx * dist_dx + dist_dy * dist_dy);
          
          const effectRadius = 100 * (rip.life / rip.maxLife);

          if (distance < effectRadius) {
              this.isRipped = rip.life;
              const force = (effectRadius - distance) / effectRadius;
              this.vx += (dist_dx / distance) * rip.strength * force;
              this.vy += (dist_dy / distance) * rip.strength * force;
          }
      }
      
      // 2. Vortex interaction (right-click)
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

      // 3. Mouse repulsion
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

      // 4. Spring-back force (Jelly effect)
      const dx_base = this.baseX - this.x;
      const dy_base = this.baseY - this.y;
      
      const springForceX = dx_base * this.springFactor;
      const springForceY = dy_base * this.springFactor;
      
      this.vx += springForceX;
      this.vy += springForceY;
      
      // 5. Apply damping (friction)
      this.vx *= this.dampingFactor;
      this.vy *= this.dampingFactor;
      
      // 6. Update position
      this.x += this.vx;
      this.y += this.vy;
    }
    
    draw() {
      this.ctx.shadowBlur = 0;
      
      if(this.isRipped > 0){
          const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
          const stretchLength = 1 + speed * 2;
          const angle = Math.atan2(this.vy, this.vx);
          
          this.ctx.strokeStyle = `hsla(195, 100%, 70%, ${this.isRipped / 90})`;
          this.ctx.lineWidth = this.size > 1.5 ? 1.5 : 1;
          this.ctx.beginPath();
          this.ctx.moveTo(this.x - Math.cos(angle) * stretchLength, this.y - Math.sin(angle) * stretchLength);
          this.ctx.lineTo(this.x + Math.cos(angle) * stretchLength, this.y + Math.sin(angle) * stretchLength);
          this.ctx.stroke();

      } else {
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
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

    const handleLeftClick = (event: globalThis.MouseEvent) => {
      ripsRef.current.push(new SpacetimeRip(event.x, event.y));
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
      
      ripsRef.current = ripsRef.current.filter(r => r.life > 0);
      ripsRef.current.forEach(r => r.update());
      
      vorticesRef.current = vorticesRef.current.filter(v => v.life > 0);
      vorticesRef.current.forEach(v => v.update());

      particlesRef.current.forEach(p => {
        p.update(vorticesRef.current, ripsRef.current);
        p.draw();
      });

      // Draw Rips
      ripsRef.current.forEach(rip => {
          const lifeRatio = rip.life / rip.maxLife;
          const gradient = ctx.createLinearGradient(rip.x1, rip.y1, rip.x2, rip.y2);
          gradient.addColorStop(0, `rgba(0,0,0,0)`);
          gradient.addColorStop(0.5, `rgba(20, 20, 30, ${lifeRatio * 0.8})`);
          gradient.addColorStop(1, `rgba(0,0,0,0)`);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = Math.sin(lifeRatio * Math.PI) * 20; // Pulsates
          ctx.beginPath();
          ctx.moveTo(rip.x1, rip.y1);
          ctx.lineTo(rip.x2, rip.y2);
          ctx.stroke();
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
