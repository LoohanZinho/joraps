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
  const shockwavesRef = useRef<Shockwave[]>([]);
  const vorticesRef = useRef<Vortex[]>([]);

  // Class for the "Glitch Vortex" effect on left-click
  class Shockwave {
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
      this.maxStrength = 5; // Very strong initial repulsive force
      this.strength = this.maxStrength;
      this.radius = 300; // Large area of effect
      this.maxLife = 120; // How long the chaos lasts
      this.life = this.maxLife;
    }

    update() {
      this.life--;
      // The strength of the vortex diminishes over its lifetime
      this.strength = this.maxStrength * (this.life / this.maxLife);
    }
  }

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
    isGlitching: boolean = false;
    
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
    
    update(shockwaves: Shockwave[], vortices: Vortex[]) {
      this.isGlitching = false;

      // 1. "Glitch Vortex" interaction (left-click)
      for (const wave of shockwaves) {
        if (wave.life <= 0) continue;
        const dx_wave = this.x - wave.x;
        const dy_wave = this.y - wave.y;
        const distance_wave = Math.sqrt(dx_wave * dx_wave + dy_wave * dy_wave);

        if (distance_wave < wave.radius) {
          const force = (wave.radius - distance_wave) / wave.radius;
          const angle = Math.atan2(dy_wave, dx_wave);
          
          // Repulsive force pushing away
          const pushX = Math.cos(angle) * wave.strength * force;
          const pushY = Math.sin(angle) * wave.strength * force;

          // Tangential force for chaotic rotation
          const tangentialX = Math.sin(angle) * wave.strength * force * 0.5;
          const tangentialY = -Math.cos(angle) * wave.strength * force * 0.5;
          
          this.vx += pushX + tangentialX;
          this.vy += pushY + tangentialY;
          this.isGlitching = true;
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
      if (this.isGlitching && Math.random() > 0.9) {
          this.ctx.fillStyle = Math.random() > 0.5 ? 'hsl(0, 100%, 50%)' : 'hsl(210, 100%, 80%)';
      } else {
        this.ctx.fillStyle = this.color;
      }
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

    const handleLeftClick = (event: globalThis.MouseEvent) => {
      shockwavesRef.current.push(new Shockwave(event.x, event.y));
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
      
      shockwavesRef.current = shockwavesRef.current.filter(sw => sw.life > 0);
      shockwavesRef.current.forEach(sw => sw.update());
      
      vorticesRef.current = vorticesRef.current.filter(v => v.life > 0);
      vorticesRef.current.forEach(v => v.update());

      particlesRef.current.forEach(p => {
        p.update(shockwavesRef.current, vorticesRef.current);
        p.draw();
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
