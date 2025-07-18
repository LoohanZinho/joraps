"use client";

import { useRef, useEffect } from 'react';

// Classe para as ondas de choque criadas pelo clique
class Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  life: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.radius = 1;
    this.maxRadius = 150; // O quão longe a onda vai
    this.speed = 5;      // Velocidade de expansão da onda
    this.life = 1;       // Força da onda (diminui com o tempo)
  }

  update() {
    if (this.life > 0) {
      this.radius += this.speed;
      // A força da onda diminui à medida que ela se expande
      this.life -= 0.025; 
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(0, 0%, 100%, ${this.life * 0.2})`; // Efeito visual sutil da onda
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
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
    
    constructor(private ctx: CanvasRenderingContext2D, private canvasWidth: number, private canvasHeight: number, color: string) {
      this.x = Math.random() * canvasWidth;
      this.y = Math.random() * canvasHeight;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = Math.random() * 2 + 0.5;
      this.density = (Math.random() * 30) + 1;
      this.color = color;
      this.vx = 0;
      this.vy = 0;
    }
    
    update() {
      // Movimento de retorno à base (atração)
      const dx_base = this.baseX - this.x;
      const dy_base = this.baseY - this.y;
      const distance_base = Math.sqrt(dx_base * dx_base + dy_base * dy_base);
      const force_base = distance_base * 0.02; // Quanto mais longe, mais forte a atração
      this.vx += (dx_base / distance_base) * force_base;
      this.vy += (dy_base / distance_base) * force_base;

      // Movimento contínuo de base (drift)
      this.baseY += 0.1;
      if (this.baseY > this.canvasHeight + this.size) {
        this.baseY = 0 - this.size;
        this.baseX = Math.random() * this.canvasWidth;
      }
      
      // Interação com o mouse (repulsão)
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
      
      // Interação com as ondas de choque (explosão)
      shockwavesRef.current.forEach(wave => {
        if (wave.life > 0) {
          const dx_wave = this.x - wave.x;
          const dy_wave = this.y - wave.y;
          const distance_wave = Math.sqrt(dx_wave * dx_wave + dy_wave * dy_wave);
          
          if (distance_wave < wave.radius && distance_wave > 0) {
            const forceDirectionX = dx_wave / distance_wave;
            const forceDirectionY = dy_wave / distance_wave;
            const force = (1 - (distance_wave / wave.radius)) * wave.life * 15; // Força da explosão
            this.vx += forceDirectionX * force;
            this.vy += forceDirectionY * force;
          }
        }
      });

      // Aplicar atrito para parar o movimento eventualmente
      this.vx *= 0.95;
      this.vy *= 0.95;

      // Atualizar posição
      this.x += this.vx;
      this.y += this.vy;
    }
    
    draw() {
      // A cor da partícula muda com a velocidade (mais rápido = mais branco)
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const brightness = Math.min(speed * 20, 100);
      this.ctx.fillStyle = `hsl(0, 0%, ${100 - brightness}%)`;
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

    const handleClick = (event: globalThis.MouseEvent) => {
      shockwavesRef.current.push(new Shockwave(event.x, event.y));
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
      
      // Atualiza e desenha partículas
      particlesRef.current.forEach(p => {
        p.update();
        p.draw();
      });

      // Atualiza, desenha e remove ondas de choque "mortas"
      shockwavesRef.current = shockwavesRef.current.filter(wave => {
        wave.update();
        // wave.draw(ctx); // Descomente para ver o círculo da onda de choque
        return wave.life > 0;
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
