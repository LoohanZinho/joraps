"use client";

import { useRef, useEffect, useCallback } from 'react';

type Lightning = {
  from: Particle;
  to: Particle;
  life: number;
};

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number | null; y: number | null; radius: number }>({
    x: null,
    y: null,
    radius: 100,
  });
  const vorticesRef = useRef<Vortex[]>([]);
  const lightningRef = useRef<Lightning[]>([]);

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

  class Particle {
    x: number;
    y: number;
    size: number;
    baseX: number;
    baseY: number;
    color: string;
    vx: number;
    vy: number;
    isElectrified: number = 0; // Use a number as a timer for the effect
    
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
      if (this.isElectrified > 0) {
        this.isElectrified--;
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
      if (this.isElectrified > 0) {
        this.ctx.fillStyle = `hsl(180, 100%, 80%)`; // Bright cyan for electrified particles
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = `hsl(180, 100%, 80%)`;
      } else {
        this.ctx.fillStyle = this.color;
        this.ctx.shadowBlur = 0;
      }
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // Reset shadow for next particle
    }
  }

  const findClosestParticle = useCallback((x: number, y: number, ignoreElectrified: boolean) => {
    let closestParticle: Particle | null = null;
    let minDistance = Infinity;

    for (const particle of particlesRef.current) {
      if (ignoreElectrified && particle.isElectrified > 0) continue;

      const dx = particle.x - x;
      const dy = particle.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        closestParticle = particle;
      }
    }
    return closestParticle;
  }, []);

  const triggerChainLightning = useCallback((startX: number, startY: number) => {
    const MAX_CHAIN_LINKS = 15;
    const MAX_SEARCH_RADIUS = 200;
    const EFFECT_DURATION = 30; // Frames

    let currentParticle = findClosestParticle(startX, startY, false);
    if (!currentParticle) return;
    
    currentParticle.isElectrified = EFFECT_DURATION;
    
    for (let i = 0; i < MAX_CHAIN_LINKS; i++) {
        let closestNeighbor: Particle | null = null;
        let minDistance = MAX_SEARCH_RADIUS;

        for (const otherParticle of particlesRef.current) {
            if (otherParticle === currentParticle || otherParticle.isElectrified > 0) continue;

            const dx = otherParticle.x - currentParticle.x;
            const dy = otherParticle.y - currentParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestNeighbor = otherParticle;
            }
        }
        
        if (closestNeighbor) {
            lightningRef.current.push({ from: currentParticle, to: closestNeighbor, life: EFFECT_DURATION });
            closestNeighbor.isElectrified = EFFECT_DURATION;
            currentParticle = closestNeighbor;
        } else {
            break; // No more neighbors found in range
        }
    }
  }, [findClosestParticle]);


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
      triggerChainLightning(event.x, event.y);
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

      particlesRef.current.forEach(p => {
        p.update(vorticesRef.current);
        p.draw();
      });

      // Draw lightning
      lightningRef.current = lightningRef.current.filter(l => l.life > 0);
      lightningRef.current.forEach(l => {
          l.life--;
          ctx.beginPath();
          ctx.moveTo(l.from.x, l.from.y);
          ctx.lineTo(l.to.x, l.to.y);
          ctx.strokeStyle = `rgba(173, 216, 230, ${l.life / 30 * 0.8})`; // Light blue, fades out
          ctx.lineWidth = 1.5;
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
  }, [triggerChainLightning]);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10 bg-background" />;
}
